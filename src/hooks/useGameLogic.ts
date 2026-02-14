import { useState, useCallback } from 'react';
import { GameState, Player, SpellCard, TurnPhase, DivinityId } from '@/types/game';
import { createMockGameState } from '@/data/mockGame';
import { toast } from 'sonner';
import { getEffectiveMetamorphosisCost, getEffectiveCardCost } from '@/engine/costModifiers';
import { calculateCycleEtherGeneration } from '@/engine/etherGeneration';
import { getMetamorphoseEffect, PendingEffect } from '@/engine/metamorphoseEffects';
import { TargetingResult } from '@/components/game/TargetingModal';
import { canBeIncapacitated as canBeIncapacitatedCheck, canBeRemovedFromGame as canBeRemovedFromGameCheck, canBeRetroMetamorphosed as canBeRetroCheck } from '@/engine/mortalStatuses';

export type InteractionMode = 'idle' | 'metamorphosing' | 'playing_spell';

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('idle');
  const [winners, setWinners] = useState<Player[]>([]);
  const [discardRequired, setDiscardRequired] = useState(false);
  const [pendingReactionCard, setPendingReactionCard] = useState<SpellCard | null>(null);
  const [pendingEffect, setPendingEffect] = useState<PendingEffect | null>(null);

  const startGame = useCallback((playerCount: number, selectedGods?: DivinityId[], playerNames?: string[]) => {
    const state = createMockGameState(playerCount, selectedGods);
    // Apply player names
    if (playerNames) {
      state.players = state.players.map((p, i) => {
        const pseudo = playerNames[i]?.trim();
        return pseudo ? { ...p, name: `${p.name} (${pseudo})` } : p;
      });
    }
    setGameState(state);
    setCurrentPlayerIndex(0);
    setGameStarted(true);
    setWinners([]);
    setDiscardRequired(false);
    setPendingReactionCard(null);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
    setGameStarted(false);
    setWinners([]);
    setDiscardRequired(false);
    setInteractionMode('idle');
    setPendingEffect(null);
    setPendingReactionCard(null);
    toast.dismiss();
  }, []);

  const handleDiscard = useCallback((cardIds: string[]) => {
    setGameState((prev) => {
      if (!prev) return prev;
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        const discarded = p.hand.filter((c) => cardIds.includes(c.id));
        return {
          ...p,
          hand: p.hand.filter((c) => !cardIds.includes(c.id)),
        };
      });
      const discardedCards = prev.players[prev.activePlayerIndex].hand.filter((c) => cardIds.includes(c.id));
      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [...discardedCards, ...prev.discardPile],
      };
    });
    setDiscardRequired(false);
  }, []);

  const handleEndTurn = useCallback(() => {
    // Use functional state update to avoid stale closure bugs (fixes Sursaut)
    let shouldDiscard = false;
    let endTurnWinners: Player[] = [];
    let nextIdx = 0;

    setGameState((prev) => {
      if (!prev) return prev;
      const currentPlayer = prev.players[prev.activePlayerIndex];

      // Check if hand > 2 → need to discard first
      if (currentPlayer.hand.length > 2) {
        shouldDiscard = true;
        return prev;
      }

      const nextPlayerIdx = (prev.activePlayerIndex + 1) % prev.players.length;
      const isNewCycle = nextPlayerIdx === prev.cycleStartPlayerIndex;
      nextIdx = nextPlayerIdx;

      let updatedPlayers = prev.players.map((p, i) => {
        if (i === prev.activePlayerIndex) {
          return {
            ...p,
            ether: p.sursautActive ? 0 : p.ether,
            sursautActive: false,
            metamorphosesThisTurn: 0,
            maxMetamorphosesThisTurn: 1,
            cannotMetamorphose: false,
          };
        }
        return p;
      });

      let newDeck = [...prev.deck];
      let newDiscardPile = [...prev.discardPile];
      const newLog = [
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: currentPlayer.name,
          action: 'Fin du Tour',
          detail: 'a terminé son tour',
        },
        ...prev.log,
      ];

      // Check victory at end of cycle
      if (isNewCycle) {
        const cycleWinners = updatedPlayers.filter((p) => p.metamorphosedCount >= 10);
        if (cycleWinners.length > 0) {
          endTurnWinners = cycleWinners;
          return {
            ...prev,
            players: updatedPlayers,
            log: newLog,
          };
        }

        // Generate ether at start of new cycle using engine
        const genResult = calculateCycleEtherGeneration({
          ...prev,
          players: updatedPlayers,
        });
        updatedPlayers = genResult.updatedPlayers;
        newLog.unshift(...genResult.logs);
        newLog.unshift({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: 'Système',
          action: 'Nouveau Cycle',
          detail: `Cycle ${prev.turnCount + 1} — Éther généré pour tous les dieux`,
        });
      }

      // Draw 2 cards for next player (reshuffle discard if deck empty)
      const drawnCards: SpellCard[] = [];
      if (!updatedPlayers[nextPlayerIdx].cannotDraw) {
        for (let i = 0; i < 2; i++) {
          if (newDeck.length === 0 && newDiscardPile.length > 0) {
            newDeck = [...newDiscardPile].sort(() => Math.random() - 0.5);
            newDiscardPile = [];
            newLog.unshift({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              playerName: 'Système',
              action: 'Pioche reconstituée',
              detail: 'La défausse a été mélangée pour former une nouvelle pioche',
            });
          }
          const card = newDeck.pop();
          if (card) drawnCards.push(card);
        }
      }
      updatedPlayers = updatedPlayers.map((p, i) => {
        if (i === nextPlayerIdx) {
          return { ...p, hand: [...p.hand, ...drawnCards], cannotDraw: false };
        }
        return p;
      });

      if (drawnCards.length > 0) {
        newLog.unshift({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: updatedPlayers[nextPlayerIdx].name,
          action: 'Pioche',
          detail: `a pioché ${drawnCards.length} cartes`,
        });
      }

      return {
        ...prev,
        players: updatedPlayers,
        activePlayerIndex: nextPlayerIdx,
        phase: 'principale' as TurnPhase,
        reactionsBlocked: false,
        turnCount: isNewCycle ? prev.turnCount + 1 : prev.turnCount,
        deck: newDeck,
        discardPile: newDiscardPile,
        log: newLog,
      };
    });

    // Side effects after state update (updater runs synchronously)
    if (shouldDiscard) {
      setDiscardRequired(true);
      return;
    }
    if (endTurnWinners.length > 0) {
      setWinners(endTurnWinners);
      return;
    }
    setInteractionMode('idle');
    setCurrentPlayerIndex(nextIdx);
  }, []);

  const handleMortalClick = useCallback((mortalId: string) => {
    if (interactionMode !== 'metamorphosing') return;

    // We need to track if an effect should fire, outside setGameState
    let effectToTrigger: PendingEffect | null = null;

    setGameState((prev) => {
      if (!prev) return prev;
      const player = prev.players[prev.activePlayerIndex];

      if (player.cannotMetamorphose) {
        toast.error('Métamorphose interdite ce tour');
        return prev;
      }
      if (player.metamorphosesThisTurn >= player.maxMetamorphosesThisTurn) {
        toast.error('Métamorphose déjà effectuée ce tour');
        return prev;
      }

      const mortal = player.mortals.find((m) => m.id === mortalId);
      if (!mortal) return prev;
      if (mortal.isMetamorphosed) {
        toast.error('Ce mortel est déjà métamorphosé');
        return prev;
      }
      if (mortal.status === 'incapacite') {
        toast.error('Ce mortel est en Torpeur');
        return prev;
      }
      if (mortal.status === 'retired') {
        toast.error('Ce mortel est retiré du jeu');
        return prev;
      }
      const effectiveCost = getEffectiveMetamorphosisCost(mortal, player, prev);
      if (player.ether < effectiveCost) {
        toast.error(`Pas assez d'Éther ! (coût: ${effectiveCost}, disponible: ${player.ether})`, {
          style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '18px' },
        });
        return prev;
      }

      const updatedMortals = player.mortals.map((m) =>
        m.id === mortalId ? { ...m, isMetamorphosed: true } : m
      );
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        return {
          ...p,
          ether: p.ether - effectiveCost,
          mortals: updatedMortals,
          metamorphosedCount: updatedMortals.filter((m) => m.isMetamorphosed).length,
          metamorphosesThisTurn: p.metamorphosesThisTurn + 1,
        };
      });

      const newState = {
        ...prev,
        players: updatedPlayers,
        log: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Métamorphose',
            detail: `a métamorphosé ${mortal.nameRecto} → ${mortal.nameVerso} (coût: ${effectiveCost} Éther${effectiveCost !== mortal.cost ? ` [base: ${mortal.cost}]` : ''})`,
          },
          ...prev.log,
        ],
      };

      // Check for on-metamorphose effect
      const metamorphosedMortal = updatedMortals.find(m => m.id === mortalId)!;
      const updatedPlayer = updatedPlayers[prev.activePlayerIndex];
      effectToTrigger = getMetamorphoseEffect(metamorphosedMortal, updatedPlayer, newState);

      return newState;
    });

    setInteractionMode('idle');

    // If there's a pending effect, show the targeting modal
    if (effectToTrigger) {
      if (effectToTrigger.conditionNotMet && effectToTrigger.type === 'none') {
        toast.info(effectToTrigger.conditionNotMet);
      } else {
        setPendingEffect(effectToTrigger);
      }
    }
  }, [interactionMode]);

  const handleCardClick = useCallback((cardId: string) => {
    if (interactionMode !== 'playing_spell') return;

    let spellEffectToTrigger: PendingEffect | null = null;

    setGameState((prev) => {
      if (!prev) return prev;
      const player = prev.players[prev.activePlayerIndex];
      const card = player.hand.find((c) => c.id === cardId);
      if (!card) return prev;

      // If it's a reaction card, show dialog instead of directly placing
      if (card.type === 'reaction') {
        setPendingReactionCard(card);
        return prev;
      }

      // Check cost (with modifiers)
      const effectiveCardCost = getEffectiveCardCost(card, player);
      if (player.ether < effectiveCardCost) {
        toast.error(`Pas assez d'Éther ! (coût: ${effectiveCardCost}, disponible: ${player.ether})`, {
          style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '18px' },
        });
        return prev;
      }

      // Check activation conditions
      const condCheck = checkActivationCondition(card, player, prev);
      if (!condCheck.valid) {
        toast.error(condCheck.reason || 'Conditions non remplies');
        return prev;
      }

      // Sortilege → pay effective cost and resolve
      let updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        return {
          ...p,
          ether: p.ether - effectiveCardCost,
          hand: p.hand.filter((c) => c.id !== cardId),
        };
      });

      let reactionsBlocked = prev.reactionsBlocked;

      if (card.name === 'Anabolisme') {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === prev.activePlayerIndex ? { ...p, ether: p.ether + 1 } : p
        );
      } else if (card.name === 'Sursaut') {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === prev.activePlayerIndex ? { ...p, ether: p.ether + 20, sursautActive: true } : p
        );
      } else if (card.name === 'Règne') {
        reactionsBlocked = true;
      } else if (card.name === 'Rage') {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === prev.activePlayerIndex
            ? { ...p, maxMetamorphosesThisTurn: p.maxMetamorphosesThisTurn + 1 }
            : p
        );
      } else if (card.name === 'Torpeur') {
        const hasValidTarget = prev.players.some((p, idx) =>
          idx !== prev.activePlayerIndex && p.mortals.some(m =>
            canBeIncapacitatedCheck(m, p, prev)
          )
        );
        if (hasValidTarget) {
          spellEffectToTrigger = {
            effectId: crypto.randomUUID(),
            type: 'enemy_mortal_incapacitate',
            sourcePlayerIndex: prev.activePlayerIndex,
            sourceMortalCode: 'SPELL-TORPEUR',
            sourceMortalName: 'Torpeur',
            description: 'Incapacitez un mortel ennemi.',
            maxTargets: 1,
          };
        } else {
          toast.info('Aucune cible valide pour Torpeur');
        }
      } else if (card.name === 'Doute') {
        const activePlayer = updatedPlayers[prev.activePlayerIndex];
        const hasRetroTarget = activePlayer.mortals.some(m =>
          m.isMetamorphosed && canBeRetroCheck(m, activePlayer, prev)
        );
        if (hasRetroTarget) {
          spellEffectToTrigger = {
            effectId: crypto.randomUUID(),
            type: 'retro_own_mortal',
            sourcePlayerIndex: prev.activePlayerIndex,
            sourceMortalCode: 'SPELL-DOUTE',
            sourceMortalName: 'Doute',
            description: 'Rétromorphosez un de vos mortels.',
            maxTargets: 1,
          };
        } else {
          toast.info('Aucun de vos mortels ne peut être rétromorphosé');
        }
      } else if (card.name === 'Pharmaka') {
        const hasRetroTarget = prev.players.some((p, idx) =>
          idx !== prev.activePlayerIndex && p.mortals.some(m =>
            m.isMetamorphosed && canBeRetroCheck(m, p, prev)
          )
        );
        if (hasRetroTarget) {
          spellEffectToTrigger = {
            effectId: crypto.randomUUID(),
            type: 'retro_enemy_mortal',
            sourcePlayerIndex: prev.activePlayerIndex,
            sourceMortalCode: 'SPELL-PHARMAKA',
            sourceMortalName: 'Pharmaka',
            description: 'Rétromorphosez un mortel ennemi.',
            maxTargets: 1,
          };
        } else {
          toast.info('Aucun mortel ennemi ne peut être rétromorphosé');
        }
      }

      return {
        ...prev,
        players: updatedPlayers,
        reactionsBlocked,
        discardPile: [card, ...prev.discardPile],
        log: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Sort joué',
            detail: `a joué ${card.name} (coût: ${effectiveCardCost} Éther${effectiveCardCost !== card.cost ? ` [base: ${card.cost}]` : ''}) — ${card.description}`,
          },
          ...prev.log,
        ],
      };
    });
    setInteractionMode('idle');

    if (spellEffectToTrigger) {
      setPendingEffect(spellEffectToTrigger);
    }
  }, [interactionMode]);

  const handleReactionPlay = useCallback(() => {
    if (!pendingReactionCard || !gameState) return;
    const player = gameState.players[gameState.activePlayerIndex];
    const card = pendingReactionCard;

    // Check activation conditions
    const condCheck = checkActivationCondition(card, player, gameState);
    if (!condCheck.valid) {
      toast.error(condCheck.reason || 'Conditions d\'activation non remplies');
      return;
    }

    const effectiveReactionCost = getEffectiveCardCost(card, player);
    if (player.ether < effectiveReactionCost) {
      toast.error(`Pas assez d'Éther ! (coût: ${effectiveReactionCost}, disponible: ${player.ether})`, {
        style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '18px' },
      });
      return;
    }

    setGameState((prev) => {
      if (!prev) return prev;
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        return {
          ...p,
          ether: p.ether - effectiveReactionCost,
          hand: p.hand.filter((c) => c.id !== card.id),
        };
      });
      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [card, ...prev.discardPile],
        log: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Réaction lancée',
            detail: `a lancé ${card.name} — ${card.description}`,
          },
          ...prev.log,
        ],
      };
    });
    setPendingReactionCard(null);
    setInteractionMode('idle');
  }, [pendingReactionCard, gameState]);

  const handleReactionPlaceFaceDown = useCallback(() => {
    if (!pendingReactionCard || !gameState) return;
    const player = gameState.players[gameState.activePlayerIndex];
    const card = pendingReactionCard;

    if (player.reactions.length >= 2) {
      toast.error('Maximum 2 réactions posées');
      return;
    }

    setGameState((prev) => {
      if (!prev) return prev;
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        return {
          ...p,
          hand: p.hand.filter((c) => c.id !== card.id),
          reactions: [...p.reactions, card],
        };
      });
      return {
        ...prev,
        players: updatedPlayers,
        log: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Réaction posée',
            detail: 'a posé une réaction face cachée',
          },
          ...prev.log,
        ],
      };
    });
    setPendingReactionCard(null);
    setInteractionMode('idle');
  }, [pendingReactionCard, gameState]);

  const cancelReactionDialog = useCallback(() => {
    setPendingReactionCard(null);
  }, []);

  const handleDiscardReaction = useCallback((cardId: string) => {
    setGameState((prev) => {
      if (!prev) return prev;
      const player = prev.players[prev.activePlayerIndex];
      const card = player.reactions.find((c) => c.id === cardId);
      if (!card) return prev;
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        return { ...p, reactions: p.reactions.filter((c) => c.id !== cardId) };
      });
      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [card, ...prev.discardPile],
        log: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Réaction défaussée',
            detail: `a défaussé une réaction posée`,
          },
          ...prev.log,
        ],
      };
    });
  }, []);

  const toggleMetamorphoseMode = useCallback(() => {
    setInteractionMode((prev) => (prev === 'metamorphosing' ? 'idle' : 'metamorphosing'));
  }, []);

  const toggleSpellMode = useCallback(() => {
    setInteractionMode((prev) => (prev === 'playing_spell' ? 'idle' : 'playing_spell'));
  }, []);

  const handleToggleReactionWindow = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        reactionWindowActive: !prev.reactionWindowActive,
        reactionTimeRemaining: 20,
      };
    });
  }, []);

  const resolveEffect = useCallback((result: TargetingResult) => {
    setGameState((prev) => {
      if (!prev) return prev;
      const sourcePlayer = prev.players.find((_, i) =>
        pendingEffect ? i === pendingEffect.sourcePlayerIndex : false
      );
      const sourcePlayerName = sourcePlayer?.name || 'Système';

      let updatedPlayers = [...prev.players];
      const newLog = [...prev.log];

      // Handle mortal targeting (incapacitate / remove)
      if (result.targetMortals && result.targetMortals.length > 0) {
        for (const target of result.targetMortals) {
          updatedPlayers = updatedPlayers.map(p => {
            if (p.id !== target.playerId) return p;
            return {
              ...p,
              mortals: p.mortals.map(m => {
                if (m.id !== target.mortalId) return m;
                if (result.type === 'enemy_mortal_incapacitate') {
                  return { ...m, status: 'incapacite' as const };
                }
                if (result.type === 'enemy_mortal_remove') {
                  return { ...m, status: 'retired' as const };
                }
                return m;
              }),
            };
          });

          // Find mortal name for log
          const targetPlayer = prev.players.find(p => p.id === target.playerId);
          const targetMortal = targetPlayer?.mortals.find(m => m.id === target.mortalId);
          const actionLabel = result.type === 'enemy_mortal_remove' ? 'Retrait du jeu' : 'Incapacitation';
          const actionDetail = result.type === 'enemy_mortal_remove'
            ? `a retiré du jeu ${targetMortal?.nameVerso || 'un mortel'} de ${targetPlayer?.name}`
            : `a incapacité ${targetMortal?.nameVerso || 'un mortel'} de ${targetPlayer?.name}`;

          newLog.unshift({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: sourcePlayerName,
            action: actionLabel,
            detail: actionDetail,
          });
        }
      }

      // Handle ether destruction
      if (result.etherDestroyed && result.etherDestroyed.length > 0) {
        // First generate ether for the source player
        if (pendingEffect?.etherGenerate) {
          updatedPlayers = updatedPlayers.map((p, i) =>
            i === pendingEffect.sourcePlayerIndex
              ? { ...p, ether: p.ether + pendingEffect.etherGenerate! }
              : p
          );
          newLog.unshift({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: sourcePlayerName,
            action: 'Éther généré',
            detail: `a généré ${pendingEffect.etherGenerate} Éther`,
          });
        }

        let totalDestroyed = 0;
        for (const { playerId, amount } of result.etherDestroyed) {
          updatedPlayers = updatedPlayers.map(p => {
            if (p.id !== playerId) return p;
            const actual = Math.min(amount, p.ether);
            totalDestroyed += actual;
            return { ...p, ether: p.ether - actual };
          });
          const targetPlayer = prev.players.find(p => p.id === playerId);
          newLog.unshift({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: sourcePlayerName,
            action: 'Éther détruit',
            detail: `a détruit ${amount} Éther de ${targetPlayer?.name}`,
          });
        }
      }

      // Handle ether steal
      if (result.etherStolen && result.etherStolen.length > 0) {
        let totalStolen = 0;
        for (const { playerId, amount } of result.etherStolen) {
          updatedPlayers = updatedPlayers.map(p => {
            if (p.id !== playerId) return p;
            const actual = Math.min(amount, p.ether);
            totalStolen += actual;
            return { ...p, ether: p.ether - actual };
          });
          const targetPlayer = prev.players.find(p => p.id === playerId);
          newLog.unshift({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: sourcePlayerName,
            action: 'Éther volé',
            detail: `a volé ${amount} Éther à ${targetPlayer?.name}`,
          });
        }
        // Add stolen ether to source player
        if (pendingEffect) {
          updatedPlayers = updatedPlayers.map((p, i) =>
            i === pendingEffect.sourcePlayerIndex
              ? { ...p, ether: p.ether + totalStolen }
              : p
          );
        }
      }

      return {
        ...prev,
        players: updatedPlayers,
        log: newLog,
      };
    });
    setPendingEffect(null);
  }, [pendingEffect]);

  const cancelEffect = useCallback(() => {
    setPendingEffect(null);
  }, []);

  const cancelDiscard = useCallback(() => {
    setDiscardRequired(false);
  }, []);

  /** Handle mortal targeting clicks from the board (bubble mode) */
  const handleTargetMortalClick = useCallback((playerId: string, mortalId: string) => {
    if (!pendingEffect) return;
    const isIncapacitate = pendingEffect.type === 'enemy_mortal_incapacitate';
    const isRemove = pendingEffect.type === 'enemy_mortal_remove';
    const isHeal = pendingEffect.type === 'mortal_heal';
    const isRetroOwn = pendingEffect.type === 'retro_own_mortal';
    const isRetroEnemy = pendingEffect.type === 'retro_enemy_mortal';
    if (!isIncapacitate && !isRemove && !isHeal && !isRetroOwn && !isRetroEnemy) return;

    // Track whether the click was valid so we only clear pendingEffect on success
    let targetValid = false;

    setGameState((prev) => {
      if (!prev || !pendingEffect) return prev;
      const targetPlayer = prev.players.find(p => p.id === playerId);
      if (!targetPlayer) return prev;
      const mortal = targetPlayer.mortals.find(m => m.id === mortalId);
      if (!mortal) return prev;

      // Validate target
      if (isHeal) {
        if (!mortal.isMetamorphosed || mortal.status !== 'incapacite') {
          toast.error('Ce mortel n\'est pas incapacité', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
      } else if (isRetroOwn) {
        const sourcePlayerId = prev.players[pendingEffect.sourcePlayerIndex]?.id;
        if (playerId !== sourcePlayerId) {
          toast.error('Vous devez cibler un de vos propres mortels', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
        if (!mortal.isMetamorphosed || !canBeRetroCheck(mortal, targetPlayer, prev)) {
          toast.error('Ce mortel ne peut pas être rétromorphosé', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
      } else if (isRetroEnemy) {
        const sourcePlayerId = prev.players[pendingEffect.sourcePlayerIndex]?.id;
        if (playerId === sourcePlayerId) {
          toast.error('Vous devez cibler un mortel ennemi', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
        if (!mortal.isMetamorphosed || !canBeRetroCheck(mortal, targetPlayer, prev)) {
          toast.error('Ce mortel ne peut pas être rétromorphosé', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
      } else if (isRemove) {
        if (!mortal.isMetamorphosed) {
          toast.error('Ce mortel n\'est pas encore métamorphosé', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
        if (!canBeRemovedFromGameCheck(mortal, targetPlayer, prev)) {
          toast.error('Ce mortel ne peut pas être retiré du jeu', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
      } else if (isIncapacitate) {
        if (!canBeIncapacitatedCheck(mortal, targetPlayer, prev)) {
          toast.error('Ce mortel ne peut pas être incapacité', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
      }

      // Valid target — apply effect
      targetValid = true;
      const sourcePlayer = prev.players[pendingEffect.sourcePlayerIndex];

      let newStatus: 'incapacite' | 'retired' | 'normal';
      let actionLabel: string;
      let actionDetail: string;

      if (isHeal) {
        newStatus = 'normal';
        actionLabel = 'Guérison';
        actionDetail = `a levé l'incapacité de ${mortal.nameVerso || mortal.nameRecto} de ${targetPlayer.name}`;
      } else if (isRetroOwn || isRetroEnemy) {
        // Retrometamorphosis: flip back to recto
        const updatedPlayers = prev.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            mortals: p.mortals.map(m =>
              m.id === mortalId ? { ...m, isMetamorphosed: false, status: 'normal' as const } : m
            ),
            metamorphosedCount: p.mortals.filter(m => m.id !== mortalId && m.isMetamorphosed).length,
          };
        });

        toast.success(`${mortal.nameVerso || mortal.nameRecto} rétromorphosé !`, {
          style: { background: 'hsl(30 50% 20%)', border: '1px solid hsl(30 60% 40%)', color: 'white', fontSize: '16px' },
        });

        return {
          ...prev,
          players: updatedPlayers,
          log: [
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              playerName: sourcePlayer?.name || 'Système',
              action: 'Rétromorphose',
              detail: `a rétromorphosé ${mortal.nameVerso || mortal.nameRecto} de ${targetPlayer.name}`,
            },
            ...prev.log,
          ],
        };
      } else if (isRemove) {
        newStatus = 'retired';
        actionLabel = 'Retrait du jeu';
        actionDetail = `a retiré du jeu ${mortal.nameVerso || mortal.nameRecto} de ${targetPlayer.name}`;
      } else {
        newStatus = 'incapacite';
        actionLabel = 'Incapacitation';
        actionDetail = `a incapacité ${mortal.nameVerso || mortal.nameRecto} de ${targetPlayer.name}`;
      }

      const updatedPlayers = prev.players.map(p => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          mortals: p.mortals.map(m =>
            m.id === mortalId ? { ...m, status: newStatus } : m
          ),
        };
      });

      toast.success(
        isHeal ? `Incapacité de ${mortal.nameVerso || mortal.nameRecto} levée !`
        : isRemove ? `${mortal.nameVerso || mortal.nameRecto} retiré du jeu !`
        : `${mortal.nameVerso || mortal.nameRecto} incapacité !`, {
        style: { background: 'hsl(270 40% 20%)', border: '1px solid hsl(270 50% 40%)', color: 'white', fontSize: '16px' },
      });

      return {
        ...prev,
        players: updatedPlayers,
        log: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: sourcePlayer?.name || 'Système',
            action: actionLabel,
            detail: actionDetail,
          },
          ...prev.log,
        ],
      };
    });

    // Only clear pending effect if the target was valid
    if (targetValid) {
      // Support multi-target: decrement maxTargets
      if (pendingEffect.maxTargets > 1) {
        setPendingEffect(prev => prev ? { ...prev, maxTargets: prev.maxTargets - 1, optional: true } : null);
      } else {
        setPendingEffect(null);
      }
    }
  }, [pendingEffect]);

  /** Auto-heal all own incapacitated mortals (for MIN-09 2nd metamorphosis) */
  const healAllOwnMortals = useCallback((playerIdx: number) => {
    setGameState((prev) => {
      if (!prev) return prev;
      const player = prev.players[playerIdx];
      const healed: string[] = [];
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== playerIdx) return p;
        return {
          ...p,
          mortals: p.mortals.map(m => {
            if (m.isMetamorphosed && m.status === 'incapacite') {
              healed.push(m.nameVerso || m.nameRecto);
              return { ...m, status: 'normal' as const };
            }
            return m;
          }),
        };
      });
      return {
        ...prev,
        players: updatedPlayers,
        log: healed.length > 0 ? [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Guérison totale',
            detail: `a levé les incapacités de ${healed.join(', ')}`,
          },
          ...prev.log,
        ] : prev.log,
      };
    });
  }, []);

  /** Select a choice from a choice effect */
  const selectChoice = useCallback((chosenEffect: PendingEffect) => {
    toast.dismiss('choice-bubble');
    setPendingEffect(chosenEffect);
  }, []);

  return {
    gameState,
    currentPlayerIndex,
    gameStarted,
    interactionMode,
    winners,
    discardRequired,
    pendingReactionCard,
    pendingEffect,
    startGame,
    resetGame,
    handleEndTurn,
    handleDiscard,
    handleMortalClick,
    handleCardClick,
    handleReactionPlay,
    handleReactionPlaceFaceDown,
    cancelReactionDialog,
    handleDiscardReaction,
    toggleMetamorphoseMode,
    toggleSpellMode,
    handleToggleReactionWindow,
    resolveEffect,
    cancelEffect,
    cancelDiscard,
    handleTargetMortalClick,
    healAllOwnMortals,
    selectChoice,
  };
}

function checkActivationCondition(
  card: SpellCard,
  player: Player,
  state: GameState
): { valid: boolean; reason?: string } {
  if (!card.activationCondition) return { valid: true };

  if (card.name === 'Rage') {
    if (player.metamorphosesThisTurn === 0) {
      return { valid: false, reason: 'Vous devez d\'abord métamorphoser un mortel ce tour' };
    }
  }
  if (card.name === 'Turbulence') {
    const hasReactions = state.players.some((p) => p.reactions.length > 0);
    if (!hasReactions) return { valid: false, reason: 'Aucune réaction posée en jeu' };
  }
  if (card.name === 'Métabolisme') {
    const hasAna = state.discardPile.some((c) => c.name === 'Anabolisme');
    const hasCata = state.discardPile.some((c) => c.name === 'Catabolisme');
    if (!hasAna || !hasCata) return { valid: false, reason: 'Il faut un Anabolisme et un Catabolisme dans la défausse' };
  }

  if (card.type === 'reaction') return { valid: true };

  return { valid: true };
}

export function canPlayCard(card: SpellCard, player: Player, gameState: GameState): boolean {
  const effectiveCost = getEffectiveCardCost(card, player);
  if (player.ether < effectiveCost) return false;
  const check = checkActivationCondition(card, player, gameState);
  return check.valid;
}
