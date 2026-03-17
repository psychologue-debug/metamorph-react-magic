import { useState, useCallback, useEffect, useRef } from 'react';
import { generateUUID } from '@/lib/uuid';
import { GameState, Player, SpellCard, TurnPhase, DivinityId, Mortal, ReactionTrigger, ReactionWindowState, GameLogEntry } from '@/types/game';
import { createMockGameState } from '@/data/mockGame';
import { toast } from 'sonner';
import { getEffectiveMetamorphosisCost, getEffectiveCardCost } from '@/engine/costModifiers';
import { calculateCycleEtherGeneration } from '@/engine/etherGeneration';
import { getMetamorphoseEffect, PendingEffect } from '@/engine/metamorphoseEffects';
import { TargetingResult } from '@/components/game/TargetingModal';
import { canBeIncapacitated as canBeIncapacitatedCheck, canBeRemovedFromGame as canBeRemovedFromGameCheck, canBeRetroMetamorphosed as canBeRetroCheck } from '@/engine/mortalStatuses';
import { getActivatedEffect, hasActivatedEffect } from '@/engine/activatedEffects';
import { getEligibleReactors, resolveReaction } from '@/engine/reactionEngine';
import { onMortalMetamorphosed, onMortalIncapacitated, onEtherDestroyed, onReactionPlayed, onMortalRetroMetamorphosed, onForcedDiscard, onOutOfCycleEtherGenerated, onOutOfPhaseCardDrawn, onMortalEffectGeneratedEther, onMortalRetired, applyTriggeredResult } from '@/engine/triggeredEffects';

const crypto = { randomUUID: generateUUID } as const;

export type InteractionMode = 'idle' | 'metamorphosing' | 'playing_spell' | 'activating_effect' | 'placing_reaction';

export interface MultiplayerConfig {
  sessionId: string;
  localPlayerId: string; // the player's UUID from localStorage
}

export function useGameLogic(multiplayerConfig?: MultiplayerConfig) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  // In multiplayer, currentPlayerIndex = local player's index (for board view)
  // In solo, currentPlayerIndex = activePlayerIndex (hot-seat)
  const currentPlayerIndex = multiplayerConfig && gameState
    ? gameState.players.findIndex(p => p.id === multiplayerConfig.localPlayerId)
    : (gameState?.activePlayerIndex ?? 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('idle');
  const [winners, setWinners] = useState<Player[]>([]);
  const [discardRequired, setDiscardRequired] = useState(false);
  const discardJustCompleted = useRef(false);
  const [pendingReactionCard, setPendingReactionCard] = useState<SpellCard | null>(null);
  const [pendingEffect, setPendingEffect] = useState<PendingEffect | null>(null);
  const reactionWindow = gameState?.reactionWindow ?? null;
  const [storedMetamorphoseEffect, setStoredMetamorphoseEffect] = useState<PendingEffect | null>(null);
  const metamorphoseReactionInfoRef = useRef<{ trigger: ReactionTrigger; reactors: string[] } | null>(null);
  const savedMortalSnapshotRef = useRef<{ mortal: Mortal; playerId: string } | null>(null);
  const prevGameStateRef = useRef<GameState | null>(null);
  const targetingLockRef = useRef(false);
  const metamorphoseTriggeredRef = useRef<Set<string>>(new Set());
  const pendingEffectRef = useRef<PendingEffect | null>(null);
  const targetsConsumedRef = useRef(0);
  const [metamorphoseEffectUndo, setMetamorphoseEffectUndo] = useState<{
    playerId: string;
    mortalId: string;
    mortalSnapshot: Mortal;
    effectType?: string; // e.g. 'enemy_mortal_remove' to trigger VEN-09 after reaction
  } | null>(null);

  const startGame = useCallback((playerCount: number, selectedGods?: DivinityId[], playerNames?: string[], playerIds?: string[]) => {
    const state = createMockGameState(playerCount, selectedGods, playerIds);
    // Apply player names
    if (playerNames) {
      state.players = state.players.map((p, i) => {
        const pseudo = playerNames[i]?.trim();
        return pseudo ? { ...p, name: `${p.name} (${pseudo})` } : p;
      });
    }
    setGameState(state);
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
    setStoredMetamorphoseEffect(null);
    setMetamorphoseEffectUndo(null);
    metamorphoseReactionInfoRef.current = null;
    savedMortalSnapshotRef.current = null;
    toast.dismiss();
  }, []);

  const handleDiscard = useCallback((cardIds: string[]) => {
    setGameState((prev) => {
      if (!prev) return prev;
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
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
    discardJustCompleted.current = true;
  }, []);

  const handleEndTurn = useCallback(() => {
    // Force-clear all blocking states so "Fin de tour" always works
    setPendingEffect(null);
    setPendingReactionCard(null);
    setStoredMetamorphoseEffect(null);
    setMetamorphoseEffectUndo(null);
    setGameState(prev => prev ? { ...prev, reactionWindow: null, forcedDiscardQueue: null } : prev);
    metamorphoseReactionInfoRef.current = null;
    savedMortalSnapshotRef.current = null;
    setInteractionMode('idle');
    toast.dismiss();

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
            skipNextTurn: false,
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
            gameOver: true,
          };
        }

        // Sursis auto-metamorphose (imparable)
        updatedPlayers = updatedPlayers.map(p => {
          const hasSursis = p.mortals.some(m => m.sursisTarget);
          if (!hasSursis) return p;
          const updatedMortals = p.mortals.map(m => {
            if (!m.sursisTarget) return m;
            newLog.unshift({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              playerName: 'Système',
              action: 'Sursis',
              detail: `${m.nameRecto} de ${p.name} est automatiquement métamorphosé (Sursis)`,
            });
            return { ...m, isMetamorphosed: true, sursisTarget: false };
          });
          return {
            ...p,
            mortals: updatedMortals,
            metamorphosedCount: updatedMortals.filter(m => m.isMetamorphosed).length,
          };
        });

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
        reactionWindow: null,
        forcedDiscardQueue: null,
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
    // currentPlayerIndex is now derived from gameState.activePlayerIndex — no separate setState needed
  }, []);

  // Auto-proceed with end turn after discard completes
  useEffect(() => {
    if (discardJustCompleted.current && !discardRequired) {
      discardJustCompleted.current = false;
      handleEndTurn();
    }
  }, [discardRequired, handleEndTurn]);

  // Sync pendingEffect ref and reset targeting counters when pendingEffect changes
  useEffect(() => {
    pendingEffectRef.current = pendingEffect;
    targetingLockRef.current = false;
    targetsConsumedRef.current = 0;
  }, [pendingEffect]);

  // === Sommeil auto-skip: when active player has skipNextTurn, auto-end after delay ===
  useEffect(() => {
    if (!gameState) return;
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (!activePlayer?.skipNextTurn) return;
    // Don't auto-skip if there's a pending discard (hand > 2)
    if (activePlayer.hand.length > 2) {
      setDiscardRequired(true);
      return;
    }
    const timer = setTimeout(() => {
      handleEndTurn();
    }, 1500);
    return () => clearTimeout(timer);
  }, [gameState?.activePlayerIndex, gameState?.players[gameState?.activePlayerIndex ?? 0]?.skipNextTurn, handleEndTurn]);

  const handleMortalClick = useCallback((mortalId: string) => {
    if (interactionMode === 'activating_effect') {
      // Activation mode: trigger mortal's activated ability
      if (!gameState) return;
      const player = gameState.players[gameState.activePlayerIndex];
      const mortal = player.mortals.find(m => m.id === mortalId);
      if (!mortal) return;
      if (!mortal.isMetamorphosed) {
        toast.error('Ce mortel n\'est pas métamorphosé');
        setInteractionMode('idle');
        return;
      }
      if (mortal.status === 'incapacite') {
        toast.error('Ce mortel est incapacité, il ne peut pas activer son effet');
        setInteractionMode('idle');
        return;
      }
      if (mortal.status === 'retired') {
        toast.error('Ce mortel est retiré du jeu');
        setInteractionMode('idle');
        return;
      }
      if (!hasActivatedEffect(mortal)) {
        toast.info(`${mortal.nameVerso} n'a pas d'effet activable.`);
        setInteractionMode('idle');
        return;
      }

      const result = getActivatedEffect(mortal, player, gameState);
      if (!result) {
        toast.info(`${mortal.nameVerso} n'a pas d'effet activable.`);
        setInteractionMode('idle');
        return;
      }
      if (result.type === 'error') {
        toast.error(result.errorMessage || 'Impossible d\'activer cet effet');
        setInteractionMode('idle');
        return;
      }

      if (result.type === 'immediate') {
        setGameState((prev) => {
          if (!prev) return prev;
          const pi = prev.activePlayerIndex;
          const newState = result.applyState!(prev, pi);
          return {
            ...newState,
            log: [
              {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                playerName: prev.players[pi].name,
                action: 'Activation',
                detail: result.logMessage || `a activé l'effet de ${mortal.nameVerso}`,
              },
              ...newState.log,
            ],
          };
        });
        toast.success(`Effet de ${mortal.nameVerso} activé !`, {
          style: { background: 'hsl(30 50% 20%)', border: '1px solid hsl(30 60% 40%)', color: 'white', fontSize: '16px' },
        });
        setInteractionMode('idle');
        return;
      }

      // Pending effect
      if (result.preApplyState) {
        setGameState((prev) => {
          if (!prev) return prev;
          const pi = prev.activePlayerIndex;
          const newState = result.preApplyState!(prev, pi);
          return {
            ...newState,
            log: result.preLogMessage ? [
              {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                playerName: prev.players[pi].name,
                action: 'Activation',
                detail: result.preLogMessage,
              },
              ...newState.log,
            ] : newState.log,
          };
        });
      }
      setPendingEffect(result.effect!);
      setInteractionMode('idle');
      return;
    }

    if (interactionMode !== 'metamorphosing') return;

    // We need to track if an effect should fire, outside setGameState
    let effectToTrigger: PendingEffect | null = null;
    let metamorphoseCostPaid = 0;
    let metamorphosedMortalId = '';
    let sourcePlayerId = '';
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
      const metamorphosedMortal2 = updatedMortals.find(m => m.id === mortalId)!;
      const updatedPlayer = updatedPlayers[prev.activePlayerIndex];
      effectToTrigger = getMetamorphoseEffect(metamorphosedMortal2, updatedPlayer, newState);
      metamorphoseCostPaid = effectiveCost;
      metamorphosedMortalId = mortalId;
      sourcePlayerId = player.id;

      return newState;
    });

    setInteractionMode('idle');

    // Check if any opponents can react to this metamorphose
    if (gameState && sourcePlayerId) {
      const trigger: ReactionTrigger = {
        type: 'metamorphose',
        sourcePlayerId,
        targetMortalId: metamorphosedMortalId,
        metamorphoseCost: metamorphoseCostPaid,
        effectDescription: effectToTrigger?.description || undefined,
      };
      const reactors = getEligibleReactors(trigger, gameState);
      if (reactors.length > 0) {
        // Dynamic categorisation: effects targeting specific mortals need targeting FIRST
        const needsMortalTargeting = effectToTrigger && [
          'enemy_mortal_incapacitate', 'enemy_mortal_remove',
          'mortal_heal', 'retro_own_mortal', 'retro_enemy_mortal',
        ].includes(effectToTrigger.type);

        // For ALL metamorphose effects (targeted or not), open reaction window first
        // This allows Résistance/Sursis to react to the metamorphose itself
        if (effectToTrigger) {
          setStoredMetamorphoseEffect(effectToTrigger);
        }
        if (needsMortalTargeting) {
          // Keep reaction info for phase 2 (Parade/Compassion after targeting)
          metamorphoseReactionInfoRef.current = { trigger, reactors };
        }

        // Build description for reaction window
        const metamorphosedMortalObj = gameState.players
          .find(p => p.id === sourcePlayerId)?.mortals.find(m => m.id === metamorphosedMortalId);
        const mortalDisplayName = metamorphosedMortalObj?.nameVerso || metamorphosedMortalObj?.nameRecto || 'un mortel';
        const activePlayerName = gameState.players[gameState.activePlayerIndex]?.name || 'Un joueur';
        const effectDesc = effectToTrigger
          ? `${activePlayerName} vient de métamorphoser ${mortalDisplayName} (${effectToTrigger.description}). Voulez-vous réagir ?`
          : `${activePlayerName} vient de métamorphoser ${mortalDisplayName}. Voulez-vous réagir ?`;

        setGameState(prev => prev ? {
          ...prev,
          reactionWindow: {
            trigger: { ...trigger, effectDescription: effectDesc },
            reactorQueue: reactors,
            currentReactorIndex: 0,
            phase: 'waiting_ready' as const,
            responses: [],
            timerStartedAt: Date.now(),
          },
        } : prev);
        return;
      }
    }

    // No reactions — apply effect immediately
    if (effectToTrigger) {
      if (effectToTrigger.conditionNotMet && effectToTrigger.type === 'none') {
        toast.info(effectToTrigger.conditionNotMet);
      } else {
        setPendingEffect(effectToTrigger);
      }
    }
  }, [interactionMode, gameState]);

  const handleCardClick = useCallback((cardId: string) => {
    if (interactionMode !== 'playing_spell' && interactionMode !== 'placing_reaction') return;
    let spellGeneratedEtherForPlayer = -1;

    setGameState((prev) => {
      if (!prev) return prev;
      const player = prev.players[prev.activePlayerIndex];
      const card = player.hand.find((c) => c.id === cardId);
      if (!card) return prev;

      // Reaction cards are placed face down directly
      if (card.type === 'reaction') {
        if (player.reactions.length >= 2) {
          toast.error('Maximum 2 réactions posées');
          return prev;
        }
        const updPlayers = prev.players.map((pp, ii) => {
          if (ii !== prev.activePlayerIndex) return pp;
          return { ...pp, hand: pp.hand.filter(c => c.id !== cardId), reactions: [...pp.reactions, card] };
        });
        return {
          ...prev,
          players: updPlayers,
          log: [{ id: crypto.randomUUID(), timestamp: Date.now(), playerName: player.name, action: 'Réaction posée', detail: `a posé une réaction face cachée` }, ...prev.log],
        };
      }

      // In placing_reaction mode, only reaction cards are valid
      if (interactionMode === 'placing_reaction') {
        toast.error('Seules les cartes Réaction peuvent être posées dans ce mode');
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

      // Pre-validate targeting spells BEFORE paying cost
      if (card.name === 'Torpeur') {
        const hasValidTarget = prev.players.some((p, idx) =>
          idx !== prev.activePlayerIndex && p.mortals.some(m =>
            canBeIncapacitatedCheck(m, p, prev)
          )
        );
        if (!hasValidTarget) {
          toast.error('Aucune cible valide pour Torpeur (aucun mortel ennemi métamorphosé éligible)');
          return prev;
        }
      } else if (card.name === 'Doute') {
        const hasRetroTarget = player.mortals.some(m =>
          m.isMetamorphosed && canBeRetroCheck(m, player, prev)
        );
        if (!hasRetroTarget) {
          toast.error('Aucun de vos mortels ne peut être rétromorphosé');
          return prev;
        }
      } else if (card.name === 'Pharmaka') {
        const hasRetroTarget = prev.players.some((p, idx) =>
          idx !== prev.activePlayerIndex && p.mortals.some(m =>
            m.isMetamorphosed && canBeRetroCheck(m, p, prev)
          )
        );
        if (!hasRetroTarget) {
          toast.error('Aucun mortel ennemi ne peut être rétromorphosé');
          return prev;
        }
      } else if (card.name === 'Éveil') {
        const hasIncapTarget = player.mortals.some(m =>
          m.isMetamorphosed && m.status === 'incapacite'
        );
        if (!hasIncapTarget) {
          toast.error('Aucun de vos mortels n\'est incapacité');
          return prev;
        }
      } else if (card.name === 'Glane') {
        if (prev.discardPile.length === 0) {
          toast.error('La défausse est vide');
          return prev;
        }
      } else if (card.name === 'Katadesmos') {
        if (prev.players.length <= 1) {
          toast.error('Aucun dieu ennemi à cibler');
          return prev;
        }
      } else if (card.name === 'Sommeil') {
        if (prev.players.length <= 1) {
          toast.error('Aucun dieu ennemi à cibler');
          return prev;
        }
      }
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
        spellGeneratedEtherForPlayer = prev.activePlayerIndex;
      } else if (card.name === 'Sursaut') {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === prev.activePlayerIndex ? { ...p, ether: p.ether + 20, sursautActive: true } : p
        );
        spellGeneratedEtherForPlayer = prev.activePlayerIndex;
      } else if (card.name === 'Règne') {
        reactionsBlocked = true;
      } else if (card.name === 'Rage') {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === prev.activePlayerIndex
            ? { ...p, maxMetamorphosesThisTurn: p.maxMetamorphosesThisTurn + 1 }
            : p
        );
      } else if (card.name === 'Torpeur') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'enemy_mortal_incapacitate',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-TORPEUR',
          sourceMortalName: 'Torpeur',
          description: 'Incapacitez un mortel ennemi.',
          maxTargets: 1,
        });
      } else if (card.name === 'Catabolisme') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'generate_destroy_ether',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-CATABOLISME',
          sourceMortalName: 'Catabolisme',
          description: 'Détruisez jusqu\'à 5 Éther sur les réservoirs ennemis.',
          maxTargets: 0,
          etherGenerate: 0,
          etherDestroy: 5,
        });
      } else if (card.name === 'Doute') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'retro_own_mortal',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-DOUTE',
          sourceMortalName: 'Doute',
          description: 'Rétromorphosez un de vos mortels.',
          maxTargets: 1,
        });
      } else if (card.name === 'Pharmaka') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'retro_enemy_mortal',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-PHARMAKA',
          sourceMortalName: 'Pharmaka',
          description: 'Rétromorphosez un mortel ennemi.',
          maxTargets: 1,
        });
      } else if (card.name === 'Éveil') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'mortal_heal',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-EVEIL',
          sourceMortalName: 'Éveil',
          description: 'Levez l\'incapacité d\'un de vos mortels.',
          maxTargets: 1,
          healOwnOnly: true,
        });
      } else if (card.name === 'Glane') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'select_from_discard',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-GLANE',
          sourceMortalName: 'Glane',
          description: 'Prenez une carte de la défausse et mettez-la dans votre main.',
          maxTargets: 1,
        });
      } else if (card.name === 'Katadesmos') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'select_enemy_god',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-KATADESMOS',
          sourceMortalName: 'Katadesmos',
          description: 'Le dieu ennemi désigné ne pourra en aucune façon métamorphoser ses mortels jusqu\'à la fin de son prochain tour.',
          maxTargets: 1,
        });
      } else if (card.name === 'Sommeil') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'select_enemy_god',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-SOMMEIL',
          sourceMortalName: 'Sommeil',
          description: 'Le dieu ennemi désigné sautera son prochain tour.',
          maxTargets: 1,
        });
      } else if (card.name === 'Manne') {
        setPendingEffect({
          effectId: crypto.randomUUID(),
          type: 'pay_draw_discard',
          sourcePlayerIndex: prev.activePlayerIndex,
          sourceMortalCode: 'SPELL-MANNE',
          sourceMortalName: 'Manne',
          description: 'Piochez 4 cartes et défaussez-en 2.',
          maxTargets: 0,
          etherCostToActivate: 0,
          drawCards: 4,
          discardCards: 2,
          includeReactions: true,
        });
      } else if (card.name === 'Turbulence') {
        const allReactions = prev.players.flatMap(p => p.reactions);
        updatedPlayers = updatedPlayers.map(p => ({ ...p, reactions: [] }));
        return {
          ...prev,
          players: updatedPlayers,
          reactionsBlocked,
          discardPile: [card, ...allReactions, ...prev.discardPile],
          log: [{
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Sort joué',
            detail: `a joué Turbulence (coût: ${effectiveCardCost} Éther) — Toutes les réactions posées ont été défaussées (${allReactions.length} cartes)`,
          }, ...prev.log],
        };
      } else if (card.name === 'Métabolisme') {
        const newDiscard = [...prev.discardPile];
        const anaIdx = newDiscard.findIndex(c => c.name === 'Anabolisme');
        const cataIdx = newDiscard.findIndex(c => c.name === 'Catabolisme');
        if (anaIdx === -1 || cataIdx === -1) return prev;
        const toRemove = [anaIdx, cataIdx].sort((a, b) => b - a);
        const taken: SpellCard[] = [];
        for (const idx of toRemove) {
          taken.push(newDiscard.splice(idx, 1)[0]);
        }
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === prev.activePlayerIndex ? { ...p, hand: [...p.hand, ...taken] } : p
        );
        return {
          ...prev,
          players: updatedPlayers,
          reactionsBlocked,
          discardPile: [card, ...newDiscard],
          log: [{
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Sort joué',
            detail: `a joué Métabolisme (coût: ${effectiveCardCost} Éther) — A récupéré un Anabolisme et un Catabolisme de la défausse`,
          }, ...prev.log],
        };
      } else if (card.name === 'Éon') {
        const newCycleStart = (prev.activePlayerIndex + 1) % prev.players.length;
        return {
          ...prev,
          players: updatedPlayers,
          reactionsBlocked,
          cycleStartPlayerIndex: newCycleStart,
          discardPile: [card, ...prev.discardPile],
          log: [{
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Sort joué',
            detail: `a joué Éon (coût: ${effectiveCardCost} Éther) — Le cycle se terminera désormais à la fin du tour de ${player.name}`,
          }, ...prev.log],
        };
      }

      const baseLog: GameLogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        playerName: player.name,
        action: 'Sort joué',
        detail: `a joué ${card.name} (coût: ${effectiveCardCost} Éther${effectiveCardCost !== card.cost ? ` [base: ${card.cost}]` : ''}) — ${card.description}`,
      };

      let finalPlayers = updatedPlayers;
      let finalDeck = [...prev.deck];
      let finalDiscardPile = [card, ...prev.discardPile];
      const extraLogs: GameLogEntry[] = [];

      // Triggered: APO-05 (Source d'eau) for spells that generate ether
      if (spellGeneratedEtherForPlayer >= 0) {
        const trigResult = onOutOfCycleEtherGenerated(finalPlayers, spellGeneratedEtherForPlayer);
        if (trigResult.etherChanges.length > 0 || trigResult.drawCards.length > 0) {
          const applied = applyTriggeredResult({ ...prev, players: finalPlayers, deck: finalDeck, discardPile: finalDiscardPile }, trigResult);
          finalPlayers = applied.players;
          finalDeck = applied.deck;
          finalDiscardPile = applied.discardPile;
          extraLogs.push(...applied.logs);
        }
      }

      return {
        ...prev,
        players: finalPlayers,
        reactionsBlocked,
        deck: finalDeck,
        discardPile: finalDiscardPile,
        log: [baseLog, ...extraLogs, ...prev.log],
      };
    });
    setInteractionMode('idle');
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

  const toggleActivateMode = useCallback(() => {
    setInteractionMode((prev) => (prev === 'activating_effect' ? 'idle' : 'activating_effect'));
  }, []);

  const togglePlaceReactionMode = useCallback(() => {
    setInteractionMode((prev) => (prev === 'placing_reaction' ? 'idle' : 'placing_reaction'));
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
      let updatedDeck = [...prev.deck];
      let updatedDiscardPile = [...prev.discardPile];

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

        // Trigger VEN-09 (Pins) for retired mortals
        if (result.type === 'enemy_mortal_remove') {
          const retiredResult = onMortalRetired(updatedPlayers);
          const applied = applyTriggeredResult({ ...prev, players: updatedPlayers, deck: updatedDeck, discardPile: updatedDiscardPile }, retiredResult);
          updatedPlayers = applied.players;
          updatedDeck = applied.deck;
          updatedDiscardPile = applied.discardPile;
          applied.logs.forEach(l => newLog.unshift(l));
        }
      }


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
        deck: updatedDeck,
        discardPile: updatedDiscardPile,
        log: newLog,
      };
    });

    // Triggered: APO-05/MIN-04 for ether generated/stolen via mortal effects
    if (pendingEffect) {
      const sourceMortalCode = pendingEffect.sourceMortalCode || '';
      const hasEtherGen = pendingEffect.etherGenerate && pendingEffect.etherGenerate > 0;
      const hasEtherSteal = result.etherStolen && result.etherStolen.length > 0;
      if (hasEtherGen || hasEtherSteal) {
        setGameState(gs => {
          if (!gs) return gs;
          const pi = pendingEffect.sourcePlayerIndex;
          let finalState = gs;
          const apo05Result = onOutOfCycleEtherGenerated(finalState.players, pi, sourceMortalCode.startsWith('SPELL-') ? undefined : sourceMortalCode);
          if (apo05Result.etherChanges.length > 0) {
            const applied = applyTriggeredResult(finalState, apo05Result);
            finalState = { ...finalState, players: applied.players, log: [...applied.logs, ...finalState.log] };
          }
          if (!sourceMortalCode.startsWith('SPELL-')) {
            const min04Result = onMortalEffectGeneratedEther(finalState.players, pi, sourceMortalCode);
            if (min04Result.etherChanges.length > 0) {
              const applied = applyTriggeredResult(finalState, min04Result);
              finalState = { ...finalState, players: applied.players, log: [...applied.logs, ...finalState.log] };
            }
          }
          return finalState === gs ? gs : finalState;
        });
      }
    }

    // Triggered effects: ether destroyed (DIA-05 Mouettes)
    if (result.etherDestroyed && result.etherDestroyed.some(e => e.amount > 0)) {
      setGameState(gs => {
        if (!gs) return gs;
        const trigResult = onEtherDestroyed(gs.players);
        if (trigResult.etherChanges.length === 0) return gs;
        const applied = applyTriggeredResult(gs, trigResult);
        let finalState = { ...gs, players: applied.players, log: [...applied.logs, ...gs.log] };
        // Chain APO-05/MIN-04 for DIA-05 ether
        for (const change of trigResult.etherChanges) {
          const apo05Result = onOutOfCycleEtherGenerated(finalState.players, change.playerIndex, 'DIA-05');
          if (apo05Result.etherChanges.length > 0) {
            const apo05Applied = applyTriggeredResult(finalState, apo05Result);
            finalState = { ...finalState, players: apo05Applied.players, log: [...apo05Applied.logs, ...finalState.log] };
          }
          const min04Result = onMortalEffectGeneratedEther(finalState.players, change.playerIndex, 'DIA-05');
          if (min04Result.etherChanges.length > 0) {
            const min04Applied = applyTriggeredResult(finalState, min04Result);
            finalState = { ...finalState, players: min04Applied.players, log: [...min04Applied.logs, ...finalState.log] };
          }
        }
        return finalState;
      });
    }

    // Chain thenEffect if present
    if (pendingEffect?.thenEffect) {
      setPendingEffect(pendingEffect.thenEffect);
    } else {
      setPendingEffect(null);
    }
  }, [pendingEffect]);

  const cancelEffect = useCallback(() => {
    setPendingEffect(null);
  }, []);

  const cancelDiscard = useCallback(() => {
    setDiscardRequired(false);
  }, []);

  /** Handle mortal targeting clicks from the board (bubble mode) */
  const handleTargetMortalClick = useCallback((playerId: string, mortalId: string) => {
    // Use ref to always read the LATEST pendingEffect (avoids stale closure)
    const currentEffect = pendingEffectRef.current;
    if (!currentEffect) return;
    if (targetingLockRef.current) return;
    
    // Check if we've already consumed all allowed targets for this effect
    const maxAllowed = currentEffect.maxTargets || 1;
    if (targetsConsumedRef.current >= maxAllowed) return;
    
    const isIncapacitate = currentEffect.type === 'enemy_mortal_incapacitate';
    const isRemove = currentEffect.type === 'enemy_mortal_remove';
    const isHeal = currentEffect.type === 'mortal_heal';
    const isRetroOwn = currentEffect.type === 'retro_own_mortal';
    const isRetroEnemy = currentEffect.type === 'retro_enemy_mortal';
    if (!isIncapacitate && !isRemove && !isHeal && !isRetroOwn && !isRetroEnemy) return;

    // Track whether the click was valid so we only clear pendingEffect on success
    let targetValid = false;

    setGameState((prev) => {
      if (!prev || !currentEffect) return prev;
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
        if (currentEffect.etherCostToActivate) {
          const src = prev.players[currentEffect.sourcePlayerIndex];
          if (src.ether < currentEffect.etherCostToActivate) {
            toast.error(`Pas assez d'Éther (${currentEffect.etherCostToActivate} requis)`);
            return prev;
          }
        }
      } else if (isRetroOwn) {
        const sourcePlayerId = prev.players[currentEffect.sourcePlayerIndex]?.id;
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
        if (currentEffect.filterType && mortal.type !== currentEffect.filterType) {
          toast.error(`Ce mortel n'est pas de type ${currentEffect.filterType}`, {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
      } else if (isRetroEnemy) {
        const sourcePlayerId = prev.players[currentEffect.sourcePlayerIndex]?.id;
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
        if (mortal.status === 'incapacite') {
          toast.error('Ce mortel est déjà incapacité');
          return prev;
        }
        if (!canBeIncapacitatedCheck(mortal, targetPlayer, prev)) {
          toast.error('Ce mortel ne peut pas être incapacité', {
            style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
          });
          return prev;
        }
      }

      // Valid target — apply effect
      targetValid = true;
      // IMMEDIATELY increment consumed counter and lock to prevent any further clicks
      targetsConsumedRef.current += 1;
      const newConsumed = targetsConsumedRef.current;
      const effectMaxTargets = currentEffect.maxTargets || 1;
      // If we've consumed all targets, lock immediately
      if (newConsumed >= effectMaxTargets) {
        targetingLockRef.current = true;
      }
      
      // Save snapshot for potential Compassion/Parade undo
      if (isIncapacitate || isRemove || isRetroEnemy) {
        savedMortalSnapshotRef.current = { mortal: { ...mortal }, playerId };
      }
      const sourcePlayer = prev.players[currentEffect.sourcePlayerIndex];

      let newStatus: 'incapacite' | 'retired' | 'normal';
      let actionLabel: string;
      let actionDetail: string;

      if (isHeal) {
        newStatus = 'normal';
        actionLabel = 'Guérison';
        actionDetail = `a levé l'incapacité de ${mortal.nameVerso || mortal.nameRecto} de ${targetPlayer.name}`;
      } else if (isRetroOwn || isRetroEnemy) {
        let actualRetroMortalId = mortalId;
        let actualRetroPlayerId = playerId;
        if (isRetroEnemy) {
          const defenderPlayer = prev.players.find(p => p.id === playerId);
          if (defenderPlayer) {
            const cenee = defenderPlayer.mortals.find(
              m => m.code === 'NEP-09' && m.isMetamorphosed && m.status !== 'incapacite' && m.status !== 'retired' && m.id !== mortalId
            );
            if (cenee) {
              actualRetroMortalId = cenee.id;
              toast.info(`${cenee.nameVerso} se sacrifie à la place de ${mortal.nameVerso || mortal.nameRecto} !`, {
                style: { background: 'hsl(195 70% 20%)', border: '1px solid hsl(195 70% 40%)', color: 'white', fontSize: '16px' },
                duration: 4000,
              });
            }
          }
        }

        const retroTarget = prev.players.find(p => p.id === actualRetroPlayerId)?.mortals.find(m => m.id === actualRetroMortalId);
        let updatedPlayers = prev.players.map(p => {
          if (p.id !== actualRetroPlayerId) return p;
          return {
            ...p,
            mortals: p.mortals.map(m =>
              m.id === actualRetroMortalId ? { ...m, isMetamorphosed: false, status: 'normal' as const } : m
            ),
            metamorphosedCount: p.mortals.filter(m => m.id !== actualRetroMortalId && m.isMetamorphosed).length,
          };
        });

        let newDeck = [...prev.deck];
        let newDiscardPile = [...prev.discardPile];
        const extraLogs: GameLogEntry[] = [];

        if (currentEffect.thenGenerate) {
          updatedPlayers = updatedPlayers.map((p, i) =>
            i === currentEffect.sourcePlayerIndex
              ? { ...p, ether: p.ether + currentEffect.thenGenerate! }
              : p
          );
          const oocResult = onOutOfCycleEtherGenerated(updatedPlayers, currentEffect.sourcePlayerIndex, currentEffect.sourceMortalCode);
          if (oocResult.etherChanges.length > 0 || oocResult.drawCards.length > 0) {
            const oocApplied = applyTriggeredResult({ ...prev, players: updatedPlayers, deck: newDeck, discardPile: newDiscardPile }, oocResult);
            updatedPlayers = oocApplied.players;
            newDeck = oocApplied.deck;
            newDiscardPile = oocApplied.discardPile;
            extraLogs.push(...oocApplied.logs);
          }
        }

        if (currentEffect.thenDraw && currentEffect.thenDraw > 0) {
          const drawnCards: any[] = [];
          for (let i = 0; i < currentEffect.thenDraw; i++) {
            if (newDeck.length === 0 && newDiscardPile.length > 0) {
              newDeck = [...newDiscardPile].sort(() => Math.random() - 0.5);
              newDiscardPile = [];
            }
            const card = newDeck.pop();
            if (card) drawnCards.push(card);
          }
          if (drawnCards.length > 0) {
            updatedPlayers = updatedPlayers.map((p, i) =>
              i === currentEffect.sourcePlayerIndex
                ? { ...p, hand: [...p.hand, ...drawnCards] }
                : p
            );
          }
        }

        const retroName = retroTarget?.nameVerso || retroTarget?.nameRecto || mortal.nameVerso || mortal.nameRecto;
        toast.success(`${retroName} rétromorphosé !${currentEffect.thenGenerate ? ` +${currentEffect.thenGenerate} Éther` : ''}${currentEffect.thenDraw ? ` +${currentEffect.thenDraw} carte(s)` : ''}`, {
          style: { background: 'hsl(30 50% 20%)', border: '1px solid hsl(30 60% 40%)', color: 'white', fontSize: '16px' },
        });

        return {
          ...prev,
          players: updatedPlayers,
          deck: newDeck,
          discardPile: newDiscardPile,
          log: [
            ...extraLogs,
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              playerName: sourcePlayer?.name || 'Système',
              action: 'Rétromorphose',
              detail: `a rétromorphosé ${retroName} de ${targetPlayer.name}${currentEffect.thenGenerate ? ` (+${currentEffect.thenGenerate} Éther)` : ''}${currentEffect.thenDraw ? ` (+${currentEffect.thenDraw} carte)` : ''}`,
            },
            ...prev.log,
          ],
        };
      } else if (isRemove) {
        newStatus = 'retired';
        actionLabel = 'Retrait du jeu';
        actionDetail = `a retiré du jeu ${mortal.nameVerso || mortal.nameRecto} de ${targetPlayer.name}`;
      } else {
        if (currentEffect.etherCostToActivate) {
          const src = prev.players[currentEffect.sourcePlayerIndex];
          if (src.ether < currentEffect.etherCostToActivate) {
            toast.error(`Pas assez d'Éther (${currentEffect.etherCostToActivate} requis)`);
            return prev;
          }
        }
        newStatus = 'incapacite';
        actionLabel = 'Incapacitation';
        actionDetail = `a incapacité ${mortal.nameVerso || mortal.nameRecto} de ${targetPlayer.name}`;
      }

      let updatedPlayers = prev.players.map(p => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          mortals: p.mortals.map(m =>
            m.id === mortalId ? { ...m, status: newStatus } : m
          ),
        };
      });

      if (currentEffect.etherCostToActivate) {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === currentEffect.sourcePlayerIndex
            ? { ...p, ether: p.ether - currentEffect.etherCostToActivate! }
            : p
        );
      }

      toast.success(
        isHeal ? `Incapacité de ${mortal.nameVerso || mortal.nameRecto} levée !`
        : isRemove ? `${mortal.nameVerso || mortal.nameRecto} retiré du jeu !`
        : `${mortal.nameVerso || mortal.nameRecto} incapacité !`, {
        style: { background: 'hsl(270 40% 20%)', border: '1px solid hsl(270 50% 40%)', color: 'white', fontSize: '16px' },
      });

      let finalDeck = [...prev.deck];
      let finalDiscardPile = [...prev.discardPile];

      return {
        ...prev,
        players: updatedPlayers,
        deck: finalDeck,
        discardPile: finalDiscardPile,
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
      // Check if Compassion/Parade reaction window should open for hostile targeting
      const isHostileEnemyEffect = (isIncapacitate || isRemove || isRetroEnemy);
      const srcPlayerId = gameState?.players[currentEffect.sourcePlayerIndex]?.id;
      const isEnemyAction = srcPlayerId !== playerId;

      if (isHostileEnemyEffect && isEnemyAction && gameState) {
        const triggerType = currentEffect.fromMetamorphose ? 'mortal_effect'
          : currentEffect.sourceMortalCode?.startsWith('SPELL-') ? 'spell_effect'
          : 'mortal_effect';
        const baseTrigger = currentEffect.fromMetamorphose && metamorphoseReactionInfoRef.current
          ? metamorphoseReactionInfoRef.current.trigger
          : { type: triggerType as any, sourcePlayerId: srcPlayerId! };

        const trigger: ReactionTrigger = {
          ...baseTrigger,
          type: triggerType as any,
          targetPlayerId: playerId,
          targetMortalId: mortalId,
        };

        const reactors = getEligibleReactors(trigger, gameState);
        if (reactors.length > 0) {
          metamorphoseReactionInfoRef.current = null;
          const snapshot = savedMortalSnapshotRef.current;
          savedMortalSnapshotRef.current = null;
          if (snapshot) {
            setMetamorphoseEffectUndo({
              playerId: snapshot.playerId,
              mortalId: snapshot.mortal.id,
              mortalSnapshot: snapshot.mortal,
              effectType: currentEffect.type,
            });
          }
          const targetPlayer = gameState.players.find(p => p.id === playerId);
          const targetMortal = targetPlayer?.mortals.find(m => m.id === mortalId);
          const actionLabel = currentEffect.type === 'enemy_mortal_remove' ? 'retirer du jeu'
            : currentEffect.type === 'mortal_heal' ? 'lever l\'incapacité de'
            : currentEffect.type === 'retro_own_mortal' || currentEffect.type === 'retro_enemy_mortal' ? 'rétromorphoser'
            : 'incapaciter';
          setGameState(prev => prev ? {
            ...prev,
            reactionWindow: {
              trigger: {
                ...trigger,
                effectDescription: `${currentEffect.sourceMortalName} va ${actionLabel} ${targetMortal?.nameVerso || targetMortal?.nameRecto || 'un mortel'} de ${targetPlayer?.name || 'un joueur'}`,
              },
              reactorQueue: reactors,
              currentReactorIndex: 0,
              phase: 'waiting_ready' as const,
              responses: [],
              timerStartedAt: Date.now(),
            },
          } : prev);
          // Lock and clear immediately
          targetingLockRef.current = true;
          pendingEffectRef.current = null;
          setPendingEffect(null);
          return;
        }
      }

      // No reaction window opened — trigger VEN-09 (Pins) immediately if removal
      if (isRemove) {
        setGameState(prev => {
          if (!prev) return prev;
          const retiredResult = onMortalRetired(prev.players);
          const applied = applyTriggeredResult(prev, retiredResult);
          if (applied.logs.length > 0) {
            return {
              ...prev,
              players: applied.players,
              deck: applied.deck,
              discardPile: applied.discardPile,
              log: [...applied.logs, ...prev.log],
            };
          }
          return prev;
        });
      }

      // Support multi-target: decrement maxTargets
      const effectMaxTargets = currentEffect.maxTargets || 1;
      if (effectMaxTargets > 1 && targetsConsumedRef.current < effectMaxTargets) {
        // Still more targets allowed — update the effect with decremented maxTargets
        setPendingEffect(prev => prev ? { ...prev, maxTargets: prev.maxTargets - 1, optional: true } : null);
      } else if (targetsConsumedRef.current >= effectMaxTargets && currentEffect.thenEffect) {
        // All targets consumed, chain to next effect
        targetingLockRef.current = false;
        pendingEffectRef.current = currentEffect.thenEffect;
        setPendingEffect(currentEffect.thenEffect);
      } else {
        // All targets consumed, no chain — clear
        targetingLockRef.current = true;
        pendingEffectRef.current = null;
        setPendingEffect(null);
      }
    }
  }, [pendingEffect, gameState]);

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

  /** Resolve select_god_discard_all: a god discards all hand + reactions */
  const resolveGodDiscard = useCallback((targetPlayerId: string) => {
    if (!pendingEffect) return;
    setGameState((prev) => {
      if (!prev) return prev;
      const targetPlayer = prev.players.find(p => p.id === targetPlayerId);
      if (!targetPlayer) return prev;
      const discardedCards = [...targetPlayer.hand, ...targetPlayer.reactions];
      const updatedPlayers = prev.players.map(p => {
        if (p.id !== targetPlayerId) return p;
        return { ...p, hand: [], reactions: [] };
      });
      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [...discardedCards, ...prev.discardPile],
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: prev.players[pendingEffect.sourcePlayerIndex]?.name || 'Système',
          action: 'Défausse forcée',
          detail: `${targetPlayer.name} a défaussé toutes ses cartes (${discardedCards.length})`,
        }, ...prev.log],
      };
    });
    // Triggered: forced discard (VEN-05 Fontaine, NEP-01 Banc de poissons)
    setGameState(gs => {
      if (!gs) return gs;
      const tgtIdx = gs.players.findIndex(p => p.id === targetPlayerId);
      if (tgtIdx < 0) return gs;
      const trigResult = onForcedDiscard(gs.players, tgtIdx, true);
      if (trigResult.etherChanges.length === 0) return gs;
      const applied = applyTriggeredResult(gs, trigResult);
      return { ...gs, players: applied.players, log: [...applied.logs, ...gs.log] };
    });
    setPendingEffect(pendingEffect.thenEffect || null);
  }, [pendingEffect]);

  /** Resolve discard_cards_then_effect: discard N cards, optionally retro self, then chain */
  const resolveCardDiscard = useCallback((cardIds: string[]) => {
    if (!pendingEffect) return;
    setGameState((prev) => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const player = prev.players[pi];

      // Collect discarded cards from hand and reactions
      const discardedFromHand = player.hand.filter(c => cardIds.includes(c.id));
      const discardedFromReactions = player.reactions.filter(c => cardIds.includes(c.id));
      const allDiscarded = [...discardedFromHand, ...discardedFromReactions];

      let updatedPlayers = prev.players.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          hand: p.hand.filter(c => !cardIds.includes(c.id)),
          reactions: p.reactions.filter(c => !cardIds.includes(c.id)),
        };
      });

      // Retro self if retroSelfMortalId is set (DIA-10)
      if (pendingEffect.retroSelfMortalId) {
        updatedPlayers = updatedPlayers.map((p, i) => {
          if (i !== pi) return p;
          return {
            ...p,
            mortals: p.mortals.map(m =>
              m.id === pendingEffect.retroSelfMortalId
                ? { ...m, isMetamorphosed: false, status: 'normal' as const }
                : m
            ),
            metamorphosedCount: p.mortals.filter(m =>
              m.id !== pendingEffect.retroSelfMortalId && m.isMetamorphosed
            ).length,
          };
        });
      }

      // Generate ether if thenGenerate is set (VEN-09)
      if (pendingEffect.thenGenerate) {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === pi ? { ...p, ether: p.ether + pendingEffect.thenGenerate! } : p
        );
      }

      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [...allDiscarded, ...prev.discardPile],
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: player.name,
          action: 'Activation',
          detail: `a défaussé ${allDiscarded.length} carte(s)${pendingEffect.retroSelfMortalId ? ' et rétromorphosé un mortel' : ''}${pendingEffect.thenGenerate ? ` (+${pendingEffect.thenGenerate} Éther)` : ''}`,
        }, ...prev.log],
      };
    });
    // Chain thenEffect
    if (pendingEffect.thenEffect) {
      setPendingEffect(pendingEffect.thenEffect);
    } else {
      setPendingEffect(null);
    }
  }, [pendingEffect]);

  /** Resolve pay_draw_discard: pay ether, draw cards, then discard */
  const resolvePayDrawDiscard = useCallback((discardCardIds: string[]) => {
    if (!pendingEffect) return;
    setGameState((prev) => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const player = prev.players[pi];

      // Discard selected cards
      const discardedCards = player.hand.filter(c => discardCardIds.includes(c.id));
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          hand: p.hand.filter(c => !discardCardIds.includes(c.id)),
        };
      });

      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [...discardedCards, ...prev.discardPile],
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: player.name,
          action: 'Défausse',
          detail: `a défaussé ${discardedCards.length} carte(s)`,
        }, ...prev.log],
      };
    });
    // Triggered: NEP-01 (Banc de poissons) — forced discard from mortal effect
    if (pendingEffect.sourceMortalCode) {
      setGameState(gs => {
        if (!gs) return gs;
        const isEnemy = pendingEffect.sourcePlayerIndex !== gs.activePlayerIndex;
        const trigResult = onForcedDiscard(gs.players, pendingEffect.sourcePlayerIndex, isEnemy);
        if (trigResult.etherChanges.length === 0 && trigResult.drawCards.length === 0) return gs;
        const applied = applyTriggeredResult(gs, trigResult);
        return { ...gs, players: applied.players, deck: applied.deck, discardPile: applied.discardPile, log: [...applied.logs, ...gs.log] };
      });
    }
    // Chain thenEffect (e.g. heal for NEP-05)
    if (pendingEffect.thenEffect) {
      setPendingEffect(pendingEffect.thenEffect);
    } else {
      setPendingEffect(null);
    }
  }, [pendingEffect]);

  /** Initiate pay_draw_discard: pay ether + draw cards, then switch to discard mode */
  const initiatePayDraw = useCallback(() => {
    if (!pendingEffect || pendingEffect.type !== 'pay_draw_discard') return;
    setGameState((prev) => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const etherCost = pendingEffect.etherCostToActivate || 0;
      const drawCount = pendingEffect.drawCards || 0;

      let newDeck = [...prev.deck];
      let newDiscardPile = [...prev.discardPile];
      const drawnCards: any[] = [];
      for (let i = 0; i < drawCount; i++) {
        if (newDeck.length === 0 && newDiscardPile.length > 0) {
          newDeck = [...newDiscardPile].sort(() => Math.random() - 0.5);
          newDiscardPile = [];
        }
        const card = newDeck.pop();
        if (card) drawnCards.push(card);
      }

      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          ether: p.ether - etherCost,
          hand: [...p.hand, ...drawnCards],
        };
      });

      return {
        ...prev,
        players: updatedPlayers,
        deck: newDeck,
        discardPile: newDiscardPile,
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: prev.players[pi].name,
          action: 'Activation',
          detail: `a payé ${etherCost} Éther et pioché ${drawnCards.length} carte(s)`,
        }, ...prev.log],
      };
    });
    // Triggered: NEP-08 (Aigle) — draw outside draw phase
    setGameState(gs => {
      if (!gs) return gs;
      const trigResult = onOutOfPhaseCardDrawn(gs.players, pendingEffect.sourcePlayerIndex);
      if (trigResult.etherChanges.length === 0) return gs;
      const applied = applyTriggeredResult(gs, trigResult);
      return { ...gs, players: applied.players, log: [...applied.logs, ...gs.log] };
    });
    // Now we need to discard. Keep the same pendingEffect but it will be handled by the UI
    // The UI will show a discard interface and call resolvePayDrawDiscard
  }, [pendingEffect]);

  /** Resolve discard_own_reaction_then_enemy */
  const resolveReactionDiscard = useCallback((ownReactionId: string, enemyPlayerId: string, enemyReactionId: string) => {
    if (!pendingEffect) return;
    setGameState((prev) => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const player = prev.players[pi];
      const ownReaction = player.reactions.find(c => c.id === ownReactionId);
      const enemyPlayer = prev.players.find(p => p.id === enemyPlayerId);
      const enemyReaction = enemyPlayer?.reactions.find(c => c.id === enemyReactionId);

      const discarded = [ownReaction, enemyReaction].filter(Boolean);

      const updatedPlayers = prev.players.map(p => {
        if (p.id === player.id) {
          return { ...p, reactions: p.reactions.filter(c => c.id !== ownReactionId) };
        }
        if (p.id === enemyPlayerId) {
          return { ...p, reactions: p.reactions.filter(c => c.id !== enemyReactionId) };
        }
        return p;
      });

      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [...(discarded as any[]), ...prev.discardPile],
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: player.name,
          action: 'Activation',
          detail: `a défaussé une réaction et forcé ${enemyPlayer?.name} à défausser une réaction`,
        }, ...prev.log],
      };
    });
    // Triggered: NEP-01 (Banc de poissons) — Neptune discards own reaction
    setGameState(gs => {
      if (!gs) return gs;
      const pi = pendingEffect.sourcePlayerIndex;
      const trigResult = onForcedDiscard(gs.players, pi, false);
      if (trigResult.etherChanges.length === 0) return gs;
      const applied = applyTriggeredResult(gs, trigResult);
      return { ...gs, players: applied.players, deck: applied.deck, discardPile: applied.discardPile, log: [...applied.logs, ...gs.log] };
    });
    // Triggered: NEP-01 for enemy player who was forced to discard
    setGameState(gs => {
      if (!gs) return gs;
      const enemyIdx = gs.players.findIndex(p => p.id === enemyPlayerId);
      if (enemyIdx < 0) return gs;
      const trigResult = onForcedDiscard(gs.players, enemyIdx, true);
      if (trigResult.etherChanges.length === 0) return gs;
      const applied = applyTriggeredResult(gs, trigResult);
      return { ...gs, players: applied.players, deck: applied.deck, discardPile: applied.discardPile, log: [...applied.logs, ...gs.log] };
    });
    setPendingEffect(null);
  }, [pendingEffect]);

  // === Glane: take a card from discard pile ===
  const resolveGlane = useCallback((cardId: string) => {
    if (!pendingEffect) return;
    setGameState(prev => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const cardIdx = prev.discardPile.findIndex(c => c.id === cardId);
      if (cardIdx === -1) return prev;
      const card = prev.discardPile[cardIdx];
      const newDiscard = prev.discardPile.filter((_, i) => i !== cardIdx);
      const updatedPlayers = prev.players.map((p, i) =>
        i === pi ? { ...p, hand: [...p.hand, card] } : p
      );
      return {
        ...prev,
        players: updatedPlayers,
        discardPile: newDiscard,
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: prev.players[pi].name,
          action: 'Glane',
          detail: `a récupéré ${card.name} de la défausse`,
        }, ...prev.log],
      };
    });
    setPendingEffect(null);
  }, [pendingEffect]);

  // === Select enemy god (Katadesmos / Sommeil / Mortal effects) ===
  const resolveSelectGod = useCallback((targetPlayerId: string) => {
    if (!pendingEffect) return;
    setGameState(prev => {
      if (!prev) return prev;
      const targetPlayer = prev.players.find(p => p.id === targetPlayerId);
      const sourceName = prev.players[pendingEffect.sourcePlayerIndex]?.name || 'Système';

      if (pendingEffect.sourceMortalCode === 'SPELL-KATADESMOS') {
        const updatedPlayers = prev.players.map(p =>
          p.id === targetPlayerId ? { ...p, cannotMetamorphose: true } : p
        );
        return {
          ...prev,
          players: updatedPlayers,
          log: [{
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: sourceName,
            action: 'Katadesmos',
            detail: `a maudit ${targetPlayer?.name} — Métamorphose interdite jusqu'à la fin de son prochain tour`,
          }, ...prev.log],
        };
      }
      if (pendingEffect.sourceMortalCode === 'SPELL-SOMMEIL') {
        const updatedPlayers = prev.players.map(p =>
          p.id === targetPlayerId ? { ...p, skipNextTurn: true } : p
        );
        return {
          ...prev,
          players: updatedPlayers,
          log: [{
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: sourceName,
            action: 'Sommeil',
            detail: `a endormi ${targetPlayer?.name} — Tour sauté`,
          }, ...prev.log],
        };
      }
      // APO-01 (Mydas Âne) / CER-09 (Pivert): target god can't draw
      if (pendingEffect.sourceMortalCode === 'APO-01' || pendingEffect.sourceMortalCode === 'CER-09') {
        const updatedPlayers = prev.players.map(p =>
          p.id === targetPlayerId ? { ...p, cannotDraw: true } : p
        );
        return {
          ...prev,
          players: updatedPlayers,
          log: [{
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: sourceName,
            action: pendingEffect.sourceMortalName,
            detail: `${targetPlayer?.name} ne pourra pas piocher lors de son prochain tour`,
          }, ...prev.log],
        };
      }
      // DIA-03 (Atalante/Lion): target god loses 2 ether + discards 2 cards
      if (pendingEffect.sourceMortalCode === 'DIA-03') {
        const tp = prev.players.find(p => p.id === targetPlayerId);
        if (!tp) return prev;
        const actualEtherLoss = Math.min(2, tp.ether);
        const discardCount = Math.min(2, tp.hand.length);
        const discardedCards = discardCount > 0 ? tp.hand.slice(-discardCount) : [];
        let updatedPlayers = prev.players.map(p => {
          if (p.id !== targetPlayerId) return p;
          return {
            ...p,
            ether: Math.max(0, p.ether - 2),
            hand: discardCount > 0 ? p.hand.slice(0, -discardCount) : p.hand,
          };
        });
        const mainLog: GameLogEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: sourceName,
          action: pendingEffect.sourceMortalName,
          detail: `${tp.name} perd ${actualEtherLoss} Éther et défausse ${discardedCards.length} carte(s)`,
        };
        let extraLogs: GameLogEntry[] = [];

        // Trigger DIA-05 (Mouettes) if ether was destroyed
        if (actualEtherLoss > 0) {
          const trigResult = onEtherDestroyed(updatedPlayers);
          if (trigResult.etherChanges.length > 0) {
            const applied = applyTriggeredResult({ ...prev, players: updatedPlayers } as GameState, trigResult);
            updatedPlayers = applied.players;
            extraLogs = [...extraLogs, ...applied.logs];
            // Chain APO-05/MIN-04 for DIA-05 ether
            for (const change of trigResult.etherChanges) {
              const apo05Result = onOutOfCycleEtherGenerated(updatedPlayers, change.playerIndex, 'DIA-05');
              if (apo05Result.etherChanges.length > 0) {
                const apo05Applied = applyTriggeredResult({ ...prev, players: updatedPlayers } as GameState, apo05Result);
                updatedPlayers = apo05Applied.players;
                extraLogs = [...extraLogs, ...apo05Applied.logs];
              }
            }
          }
        }

        return {
          ...prev,
          players: updatedPlayers,
          discardPile: [...discardedCards, ...prev.discardPile],
          log: [mainLog, ...extraLogs, ...prev.log],
        };
      }
      return prev;
    });
    setPendingEffect(null);
  }, [pendingEffect]);

  // === DIA-06 (Hermaphrodite): Play spell at discount ===
  const resolvePlaySpellAtDiscount = useCallback((cardId: string) => {
    if (!pendingEffect) return;
    const discount = pendingEffect.spellDiscount || 10;
    
    // We'll apply the spell inline (like handleCardClick) but with reduced cost
    let spellEffect: PendingEffect | null = null;

    setGameState(prev => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const player = prev.players[pi];
      const card = player.hand.find(c => c.id === cardId);
      if (!card) return prev;
      
      // Apply BAC-09 cost reduction too
      const baseCost = getEffectiveCardCost(card, player);
      const reducedCost = Math.max(0, baseCost - discount);
      
      if (player.ether < reducedCost) {
        toast.error(`Pas assez d'Éther ! (${reducedCost} requis)`);
        return prev;
      }

      let updatedPlayers = prev.players.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          ether: p.ether - reducedCost,
          hand: p.hand.filter(c => c.id !== cardId),
        };
      });

      let reactionsBlocked = prev.reactionsBlocked;
      let newDeck = [...prev.deck];
      let newDiscardPile = [card, ...prev.discardPile];

      // Apply spell effects inline
      if (card.name === 'Anabolisme') {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === pi ? { ...p, ether: p.ether + 1 } : p
        );
      } else if (card.name === 'Sursaut') {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === pi ? { ...p, ether: p.ether + 20, sursautActive: true } : p
        );
      } else if (card.name === 'Règne') {
        reactionsBlocked = true;
      } else if (card.name === 'Rage') {
        updatedPlayers = updatedPlayers.map((p, i) =>
          i === pi ? { ...p, maxMetamorphosesThisTurn: p.maxMetamorphosesThisTurn + 1 } : p
        );
      } else if (card.name === 'Torpeur') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'enemy_mortal_incapacitate', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-TORPEUR', sourceMortalName: 'Torpeur', description: 'Incapacitez un mortel ennemi.', maxTargets: 1 };
      } else if (card.name === 'Catabolisme') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'generate_destroy_ether', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-CATABOLISME', sourceMortalName: 'Catabolisme', description: 'Détruisez jusqu\'à 5 Éther.', maxTargets: 0, etherGenerate: 0, etherDestroy: 5 };
      } else if (card.name === 'Doute') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'retro_own_mortal', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-DOUTE', sourceMortalName: 'Doute', description: 'Rétromorphosez un de vos mortels.', maxTargets: 1 };
      } else if (card.name === 'Pharmaka') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'retro_enemy_mortal', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-PHARMAKA', sourceMortalName: 'Pharmaka', description: 'Rétromorphosez un mortel ennemi.', maxTargets: 1 };
      } else if (card.name === 'Éveil') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'mortal_heal', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-EVEIL', sourceMortalName: 'Éveil', description: 'Levez l\'incapacité d\'un de vos mortels.', maxTargets: 1, healOwnOnly: true };
      } else if (card.name === 'Glane') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'select_from_discard', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-GLANE', sourceMortalName: 'Glane', description: 'Prenez une carte de la défausse.', maxTargets: 1 };
      } else if (card.name === 'Métabolisme') {
        const anaIdx = newDiscardPile.findIndex(c => c.name === 'Anabolisme');
        const cataIdx = newDiscardPile.findIndex(c => c.name === 'Catabolisme');
        if (anaIdx !== -1 && cataIdx !== -1) {
          const toRemove = [anaIdx, cataIdx].sort((a, b) => b - a);
          const taken: SpellCard[] = [];
          for (const idx of toRemove) {
            taken.push(newDiscardPile.splice(idx, 1)[0]);
          }
          updatedPlayers = updatedPlayers.map((p, i) =>
            i === pi ? { ...p, hand: [...p.hand, ...taken] } : p
          );
        }
      } else if (card.name === 'Manne') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'pay_draw_discard', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-MANNE', sourceMortalName: 'Manne', description: 'Piochez 4 cartes et défaussez-en 2.', maxTargets: 0, etherCostToActivate: 0, drawCards: 4, discardCards: 2, includeReactions: true };
      } else if (card.name === 'Katadesmos') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'select_enemy_god', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-KATADESMOS', sourceMortalName: 'Katadesmos', description: 'Métamorphose interdite.', maxTargets: 1 };
      } else if (card.name === 'Sommeil') {
        spellEffect = { effectId: crypto.randomUUID(), type: 'select_enemy_god', sourcePlayerIndex: pi, sourceMortalCode: 'SPELL-SOMMEIL', sourceMortalName: 'Sommeil', description: 'Sautera son prochain tour.', maxTargets: 1 };
      } else if (card.name === 'Turbulence') {
        const allReactions = prev.players.flatMap(p => p.reactions);
        updatedPlayers = updatedPlayers.map(p => ({ ...p, reactions: [] }));
        newDiscardPile = [card, ...allReactions, ...prev.discardPile];
      }

      return {
        ...prev,
        players: updatedPlayers,
        reactionsBlocked,
        deck: newDeck,
        discardPile: newDiscardPile,
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: player.name,
          action: pendingEffect.sourceMortalName,
          detail: `a joué ${card.name} pour ${reducedCost} Éther (réduit de ${discount})`,
        }, ...prev.log],
      };
    });

    if (spellEffect) {
      setPendingEffect(spellEffect);
    } else {
      setPendingEffect(null);
    }
    toast.success('Sort joué à coût réduit !', {
      style: { background: 'hsl(280 40% 20%)', border: '1px solid hsl(280 50% 40%)', color: 'white', fontSize: '16px' },
    });
  }, [pendingEffect]);

  // === CER-05 (Monstre de Gila): Pay multiple of 3, enemies discard (hand + reactions) ===
  const resolvePayMultipleEnemyDiscard = useCallback((multiplier: number) => {
    if (!pendingEffect) return;
    const cost = multiplier * 3;
    setGameState(prev => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const player = prev.players[pi];
      if (player.ether < cost) return prev;

      const allDiscarded: SpellCard[] = [];
      const updatedPlayers = prev.players.map((p, i) => {
        if (i === pi) return { ...p, ether: p.ether - cost };
        // Each enemy discards 'multiplier' cards from hand + reactions combined
        const totalCards = [...p.hand, ...p.reactions];
        const discardCount = Math.min(multiplier, totalCards.length);
        // Discard from hand first, then reactions
        let remaining = discardCount;
        const discardedFromHand = p.hand.slice(-Math.min(remaining, p.hand.length));
        remaining -= discardedFromHand.length;
        const discardedFromReactions = remaining > 0 ? p.reactions.slice(-remaining) : [];
        const discarded = [...discardedFromHand, ...discardedFromReactions];
        allDiscarded.push(...discarded);
        const discardedIds = new Set(discarded.map(c => c.id));
        return {
          ...p,
          hand: p.hand.filter(c => !discardedIds.has(c.id)),
          reactions: p.reactions.filter(c => !discardedIds.has(c.id)),
        };
      });

      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [...allDiscarded, ...prev.discardPile],
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: player.name,
          action: pendingEffect.sourceMortalName,
          detail: `a payé ${cost} Éther — chaque ennemi défausse ${multiplier} carte(s) (main + réactions)`,
        }, ...prev.log],
      };
    });
    // Triggered: NEP-01 for forced discards
    setGameState(gs => {
      if (!gs) return gs;
      const trigResult = onForcedDiscard(gs.players, pendingEffect.sourcePlayerIndex, true);
      if (trigResult.etherChanges.length === 0 && trigResult.drawCards.length === 0) return gs;
      const applied = applyTriggeredResult(gs, trigResult);
      return { ...gs, players: applied.players, deck: applied.deck, discardPile: applied.discardPile, log: [...applied.logs, ...gs.log] };
    });
    setPendingEffect(null);
  }, [pendingEffect]);

  // === Reaction Window Handlers ===
  const handleReactionReady = useCallback((playerId: string) => {
    setGameState(prev => {
      if (!prev || !prev.reactionWindow) return prev;
      return { ...prev, reactionWindow: { ...prev.reactionWindow, phase: 'asking' as const, timerStartedAt: Date.now() } };
    });
  }, []);

  const handleReactionPass = useCallback((playerId: string) => {
    setGameState(prev => {
      if (!prev || !prev.reactionWindow) return prev;
      const rw = prev.reactionWindow;
      const newResponses = [...rw.responses, { playerId, passed: true }];
      const nextIdx = rw.currentReactorIndex + 1;
      if (nextIdx >= rw.reactorQueue.length) {
        return { ...prev, reactionWindow: { ...rw, responses: newResponses, phase: 'resolved' as const } };
      }
      return {
        ...prev,
        reactionWindow: {
          ...rw,
          responses: newResponses,
          currentReactorIndex: nextIdx,
          phase: 'waiting_ready' as const,
          timerStartedAt: Date.now(),
        },
      };
    });
  }, []);

  const handleReactionActivate = useCallback((playerId: string, cardId: string) => {
    if (!gameState || !reactionWindow) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    const card = player.reactions.find(c => c.id === cardId);
    if (!card) return;

    const { updatedState, blocksMetamorphoseEffect, cancelsMetamorphose, blocksSpellEffect, logMessage } =
      resolveReaction(card, reactionWindow.trigger, player, gameState);

    // Apply the resolution to game state
    setGameState({
      ...updatedState,
      log: [{
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        playerName: player.name,
        action: 'Réaction',
        detail: logMessage,
      }, ...updatedState.log],
    });

    // Triggered effects: reaction played (MIN-07 Araignée)
    setGameState(gs => {
      if (!gs) return gs;
      const trigResult = onReactionPlayed(gs.players);
      if (trigResult.etherChanges.length === 0) return gs;
      const applied = applyTriggeredResult(gs, trigResult);
      let finalState = { ...gs, players: applied.players, log: [...applied.logs, ...gs.log] };
      // Chain APO-05/MIN-04 for MIN-07 ether
      for (const change of trigResult.etherChanges) {
        const apo05Result = onOutOfCycleEtherGenerated(finalState.players, change.playerIndex, 'MIN-07');
        if (apo05Result.etherChanges.length > 0) {
          const apo05Applied = applyTriggeredResult(finalState, apo05Result);
          finalState = { ...finalState, players: apo05Applied.players, log: [...apo05Applied.logs, ...finalState.log] };
        }
        const min04Result = onMortalEffectGeneratedEther(finalState.players, change.playerIndex, 'MIN-07');
        if (min04Result.etherChanges.length > 0) {
          const min04Applied = applyTriggeredResult(finalState, min04Result);
          finalState = { ...finalState, players: min04Applied.players, log: [...min04Applied.logs, ...finalState.log] };
        }
      }
      return finalState;
    });

    // If Résistance or Sursis cancelled the metamorphose, clear stored effect
    if (cancelsMetamorphose) {
      setStoredMetamorphoseEffect(null);
    }
    // If Parade blocked the effect, clear stored effect
    if (blocksMetamorphoseEffect) {
      setStoredMetamorphoseEffect(null);
    }

    // Move to next reactor
    setGameState(prev => {
      if (!prev || !prev.reactionWindow) return prev;
      const rw = prev.reactionWindow;
      const newResponses = [...rw.responses, { playerId, cardId, cardName: card.name, passed: false }];
      const nextIdx = rw.currentReactorIndex + 1;
      if (nextIdx >= rw.reactorQueue.length) {
        return { ...prev, reactionWindow: { ...rw, responses: newResponses, phase: 'resolved' as const } };
      }
      return {
        ...prev,
        reactionWindow: {
          ...rw,
          responses: newResponses,
          currentReactorIndex: nextIdx,
          phase: 'waiting_ready' as const,
          timerStartedAt: Date.now(),
        },
      };
    });
  }, [gameState]);

  // When reaction window resolves, handle two-phase flow
  useEffect(() => {
    if (!reactionWindow || reactionWindow.phase !== 'resolved') return;

    const hasResistanceOrSursis = reactionWindow.responses.some(
      r => !r.passed && (r.cardName === 'Résistance' || r.cardName === 'Sursis')
    );
    const hasParade = reactionWindow.responses.some(
      r => !r.passed && r.cardName === 'Parade'
    );

    // === Phase 2: After targeting (metamorphoseEffectUndo is set) ===
    if (metamorphoseEffectUndo) {
      const hasCompassion = reactionWindow.responses.some(
        r => !r.passed && r.cardName === 'Compassion'
      );
      if (hasParade || hasCompassion) {
        // Undo the targeted effect
        const reactionName = hasCompassion ? 'Compassion' : 'Parade';
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map(p => {
              if (p.id !== metamorphoseEffectUndo.playerId) return p;
              const restoredMortals = p.mortals.map(m =>
                m.id === metamorphoseEffectUndo.mortalId
                  ? metamorphoseEffectUndo.mortalSnapshot
                  : m
              );
              return {
                ...p,
                mortals: restoredMortals,
                metamorphosedCount: restoredMortals.filter(m => m.isMetamorphosed).length,
              };
            }),
            log: [{
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              playerName: 'Système',
              action: reactionName,
              detail: `L'effet a été annulé par ${reactionName}`,
            }, ...prev.log],
          };
        });
      } else {
        // Effect was NOT cancelled — trigger VEN-09 (Pins) now if it was a removal
        if (metamorphoseEffectUndo.effectType === 'enemy_mortal_remove') {
          setGameState(prev => {
            if (!prev) return prev;
            const retiredResult = onMortalRetired(prev.players);
            const applied = applyTriggeredResult(prev, retiredResult);
            if (applied.logs.length > 0) {
              return {
                ...prev,
                players: applied.players,
                deck: applied.deck,
                discardPile: applied.discardPile,
                log: [...applied.logs, ...prev.log],
              };
            }
            return prev;
          });
        }
      }
      setMetamorphoseEffectUndo(null);
      setStoredMetamorphoseEffect(null);
      setGameState(prev => prev ? { ...prev, reactionWindow: null } : prev);
      metamorphoseReactionInfoRef.current = null;
      return;
    }

    // === Phase 1: After metamorphose reaction ===
    if (hasResistanceOrSursis) {
      // Metamorphose cancelled — clear everything
      setStoredMetamorphoseEffect(null);
      setGameState(prev => prev ? { ...prev, reactionWindow: null } : prev);
      metamorphoseReactionInfoRef.current = null;
      return;
    }

    // Metamorphose survived. Check if there's a stored effect to apply.
    if (storedMetamorphoseEffect) {
      const needsTargeting = [
        'enemy_mortal_incapacitate', 'enemy_mortal_remove',
        'mortal_heal', 'retro_own_mortal', 'retro_enemy_mortal',
      ].includes(storedMetamorphoseEffect.type);

      if (needsTargeting) {
        // Phase 1 done → move to targeting. metamorphoseReactionInfoRef stays for phase 2.
        setPendingEffect({ ...storedMetamorphoseEffect, fromMetamorphose: true });
        setStoredMetamorphoseEffect(null);
        setGameState(prev => prev ? { ...prev, reactionWindow: null } : prev);
        return;
      }

      // Non-targeted effect: check if Parade blocked it
      if (!hasParade) {
        if (storedMetamorphoseEffect.conditionNotMet && storedMetamorphoseEffect.type === 'none') {
          toast.info(storedMetamorphoseEffect.conditionNotMet);
        } else {
          setPendingEffect(storedMetamorphoseEffect);
        }
      }
    }

    setStoredMetamorphoseEffect(null);
    setGameState(prev => prev ? { ...prev, reactionWindow: null } : prev);
    metamorphoseReactionInfoRef.current = null;
  }, [reactionWindow, storedMetamorphoseEffect, metamorphoseEffectUndo]);

  // === Triggered passive effects: detect state changes and apply ===
  useEffect(() => {
    // Don't apply triggered effects while a reaction window is pending
    if (reactionWindow) return;
    if (!gameState || !prevGameStateRef.current) {
      prevGameStateRef.current = gameState;
      return;
    }
    const prev = prevGameStateRef.current;
    prevGameStateRef.current = gameState;

    for (let i = 0; i < gameState.players.length; i++) {
      const oldP = prev.players[i];
      const newP = gameState.players[i];
      if (!oldP || !newP) continue;
      for (let j = 0; j < newP.mortals.length; j++) {
        const oldM = oldP.mortals[j];
        const newM = newP.mortals[j];
        if (!oldM || !newM) continue;

        // New metamorphose detected
        if (!oldM.isMetamorphosed && newM.isMetamorphosed) {
          // Dedup: prevent triggered effects from firing twice for the same mortal
          if (metamorphoseTriggeredRef.current.has(newM.id)) continue;
          metamorphoseTriggeredRef.current.add(newM.id);

          const trigResult = onMortalMetamorphosed(gameState.players, newM.code, newM.type, i);
          if (trigResult.etherChanges.length > 0 || trigResult.drawCards.length > 0) {
            setGameState(gs => {
              if (!gs) return gs;
              const applied = applyTriggeredResult(gs, trigResult);
              let finalState = { ...gs, players: applied.players, deck: applied.deck, discardPile: applied.discardPile, log: [...applied.logs, ...gs.log] };
              // Chain APO-05 and MIN-04 for each ether change from mortal effects
              for (const change of trigResult.etherChanges) {
                const apo05Result = onOutOfCycleEtherGenerated(finalState.players, change.playerIndex);
                if (apo05Result.etherChanges.length > 0) {
                  const apo05Applied = applyTriggeredResult(finalState, apo05Result);
                  finalState = { ...finalState, players: apo05Applied.players, log: [...apo05Applied.logs, ...finalState.log] };
                }
                const min04Result = onMortalEffectGeneratedEther(finalState.players, change.playerIndex, newM.code);
                if (min04Result.etherChanges.length > 0) {
                  const min04Applied = applyTriggeredResult(finalState, min04Result);
                  finalState = { ...finalState, players: min04Applied.players, log: [...min04Applied.logs, ...finalState.log] };
                }
              }
              // Chain NEP-08 for draws from mortal effects (e.g. NEP-03)
              for (const draw of trigResult.drawCards) {
                const nep08Result = onOutOfPhaseCardDrawn(finalState.players, draw.playerIndex);
                if (nep08Result.etherChanges.length > 0) {
                  const nep08Applied = applyTriggeredResult(finalState, nep08Result);
                  finalState = { ...finalState, players: nep08Applied.players, log: [...nep08Applied.logs, ...finalState.log] };
                }
              }
              return finalState;
            });
          }
        }

        // New incapacitation detected
        if (oldM.status !== 'incapacite' && newM.status === 'incapacite') {
          const trigResult = onMortalIncapacitated(gameState.players);
          if (trigResult.etherChanges.length > 0) {
            setGameState(gs => {
              if (!gs) return gs;
              const applied = applyTriggeredResult(gs, trigResult);
              let finalState = { ...gs, players: applied.players, log: [...applied.logs, ...gs.log] };
              // Chain APO-05 for ether from mortal effects
              for (const change of trigResult.etherChanges) {
                const apo05Result = onOutOfCycleEtherGenerated(finalState.players, change.playerIndex, 'VEN-02');
                if (apo05Result.etherChanges.length > 0) {
                  const apo05Applied = applyTriggeredResult(finalState, apo05Result);
                  finalState = { ...finalState, players: apo05Applied.players, log: [...apo05Applied.logs, ...finalState.log] };
                }
                const min04Result = onMortalEffectGeneratedEther(finalState.players, change.playerIndex, 'VEN-02');
                if (min04Result.etherChanges.length > 0) {
                  const min04Applied = applyTriggeredResult(finalState, min04Result);
                  finalState = { ...finalState, players: min04Applied.players, log: [...min04Applied.logs, ...finalState.log] };
                }
              }
              return finalState;
            });
          }
        }

        // Retro-metamorphosis detected (CER-06 Myrmidons)
        if (oldM.isMetamorphosed && !newM.isMetamorphosed) {
          // Clear dedup ref so re-metamorphose can trigger effects again
          metamorphoseTriggeredRef.current.delete(newM.id);

          const trigResult = onMortalRetroMetamorphosed(gameState.players);
          if (trigResult.etherChanges.length > 0) {
            setGameState(gs => {
              if (!gs) return gs;
              const applied = applyTriggeredResult(gs, trigResult);
              let finalState = { ...gs, players: applied.players, log: [...applied.logs, ...gs.log] };
              // Chain APO-05/MIN-04
              for (const change of trigResult.etherChanges) {
                const apo05Result = onOutOfCycleEtherGenerated(finalState.players, change.playerIndex, 'CER-06');
                if (apo05Result.etherChanges.length > 0) {
                  const apo05Applied = applyTriggeredResult(finalState, apo05Result);
                  finalState = { ...finalState, players: apo05Applied.players, log: [...apo05Applied.logs, ...finalState.log] };
                }
                const min04Result = onMortalEffectGeneratedEther(finalState.players, change.playerIndex, 'CER-06');
                if (min04Result.etherChanges.length > 0) {
                  const min04Applied = applyTriggeredResult(finalState, min04Result);
                  finalState = { ...finalState, players: min04Applied.players, log: [...min04Applied.logs, ...finalState.log] };
                }
              }
              return finalState;
            });
          }
        }
      }
    }
  }, [gameState, reactionWindow]);

  // === Victory detection for all players (multiplayer sync) ===
  useEffect(() => {
    if (!gameState?.gameOver || winners.length > 0) return;
    const victorious = gameState.players.filter(p => p.metamorphosedCount >= 10);
    if (victorious.length > 0) {
      setWinners(victorious);
    }
  }, [gameState?.gameOver, winners.length]);


  useEffect(() => {
    if (!pendingEffect || pendingEffect.sourceMortalCode !== 'MIN-01' || pendingEffect.type !== 'none') return;
    if (!gameState) return;

    const pi = pendingEffect.sourcePlayerIndex;
    const player = gameState.players[pi];
    const isNotFirst = player.metamorphosesThisTurn > 1;
    const cardsPerEnemy = isNotFirst ? 2 : 1;

    // Determine which enemies need choice vs auto-discard BEFORE updating state
    const queueEntries: { playerId: string; count: number }[] = [];
    const autoDiscardPlayerIndices: number[] = [];

    for (let i = 0; i < gameState.players.length; i++) {
      if (i === pi) continue;
      const p = gameState.players[i];
      const totalCards = p.hand.length + p.reactions.length;
      const discardCount = Math.min(cardsPerEnemy, totalCards);
      if (discardCount === 0) continue;

      if (totalCards > discardCount) {
        queueEntries.push({ playerId: p.id, count: discardCount });
      } else {
        autoDiscardPlayerIndices.push(i);
      }
    }

    setGameState(prev => {
      if (!prev) return prev;
      let totalDiscarded = 0;
      const newLog = [...prev.log];
      const allDiscarded: SpellCard[] = [];

      const updatedPlayers = prev.players.map((p, i) => {
        if (i === pi || !autoDiscardPlayerIndices.includes(i)) return p;
        const allPlayerCards = [...p.hand, ...p.reactions];
        allDiscarded.push(...allPlayerCards);
        totalDiscarded += allPlayerCards.length;
        newLog.unshift({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: p.name,
          action: 'Défausse forcée',
          detail: `a défaussé ${allPlayerCards.length} carte(s) (Grenouilles)`,
        });
        return { ...p, hand: [], reactions: [] };
      });

      if (queueEntries.length > 0) {
        return {
          ...prev,
          players: updatedPlayers,
          discardPile: [...allDiscarded, ...prev.discardPile],
          log: newLog,
          forcedDiscardQueue: {
            entries: queueEntries,
            reason: 'Grenouilles',
            sourcePlayerIndex: pi,
            etherBonusPerCard: isNotFirst,
            totalDiscarded,
          },
        };
      }

      let finalPlayers = updatedPlayers;
      if (isNotFirst && totalDiscarded > 0) {
        finalPlayers = updatedPlayers.map((p, i) =>
          i === pi ? { ...p, ether: p.ether + totalDiscarded } : p
        );
        newLog.unshift({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: prev.players[pi].name,
          action: 'Grenouilles',
          detail: `a gagné ${totalDiscarded} Éther (autant que de cartes défaussées)`,
        });
      }

      return {
        ...prev,
        players: finalPlayers,
        discardPile: [...allDiscarded, ...prev.discardPile],
        log: newLog,
      };
    });

    if (queueEntries.length === 0) {
      // Triggered effects: forced discard (VEN-05 Fontaine, NEP-01 Banc de poissons)
      setGameState(gs => {
        if (!gs) return gs;
        let finalState = gs;
        for (let idx = 0; idx < gs.players.length; idx++) {
          if (idx === pi) continue;
          const trigResult = onForcedDiscard(finalState.players, idx, true);
          if (trigResult.etherChanges.length > 0) {
            const applied = applyTriggeredResult(finalState, trigResult);
            finalState = { ...finalState, players: applied.players, log: [...applied.logs, ...finalState.log] };
          }
        }
        return finalState === gs ? gs : finalState;
      });

      toast.success(`Grenouilles : chaque ennemi défausse ${cardsPerEnemy} carte(s)${isNotFirst ? ' + Éther gagné' : ''}`, {
        style: { background: 'hsl(200 40% 20%)', border: '1px solid hsl(200 50% 40%)', color: 'white', fontSize: '16px' },
      });
    }

    setPendingEffect(null);
  }, [pendingEffect, gameState]);

  // === Forced discard queue finalization (Grenouilles) ===
  const prevForcedDiscardQueueRef = useRef<import('@/types/game').ForcedDiscardQueueState | null>(null);
  useEffect(() => {
    const prevQueue = prevForcedDiscardQueueRef.current;
    const currentQueue = gameState?.forcedDiscardQueue ?? null;
    prevForcedDiscardQueueRef.current = currentQueue;

    if (prevQueue && !currentQueue) {
      // Queue just cleared — trigger forced discard effects
      const pi = prevQueue.sourcePlayerIndex;
      setGameState(gs => {
        if (!gs) return gs;
        let finalState = gs;
        for (let idx = 0; idx < gs.players.length; idx++) {
          if (idx === pi) continue;
          const trigResult = onForcedDiscard(finalState.players, idx, true);
          if (trigResult.etherChanges.length > 0) {
            const applied = applyTriggeredResult(finalState, trigResult);
            finalState = { ...finalState, players: applied.players, log: [...applied.logs, ...finalState.log] };
          }
        }
        return finalState === gs ? gs : finalState;
      });
      toast.success(`${prevQueue.reason} terminé${prevQueue.etherBonusPerCard ? ' + Éther gagné' : ''}`, {
        style: { background: 'hsl(200 40% 20%)', border: '1px solid hsl(200 50% 40%)', color: 'white', fontSize: '16px' },
      });
    }
  }, [gameState?.forcedDiscardQueue]);

  const handleForcedDiscardChoice = useCallback((cardIds: string[]) => {
    setGameState(prev => {
      if (!prev || !prev.forcedDiscardQueue) return prev;
      const queue = prev.forcedDiscardQueue;
      const entry = queue.entries[0];
      if (!entry) return prev;

      const playerIdx = prev.players.findIndex(p => p.id === entry.playerId);
      if (playerIdx === -1) return prev;
      const player = prev.players[playerIdx];

      const discardedFromHand = player.hand.filter(c => cardIds.includes(c.id));
      const discardedFromReactions = player.reactions.filter(c => cardIds.includes(c.id));
      const allDiscarded = [...discardedFromHand, ...discardedFromReactions];

      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== playerIdx) return p;
        return {
          ...p,
          hand: p.hand.filter(c => !cardIds.includes(c.id)),
          reactions: p.reactions.filter(c => !cardIds.includes(c.id)),
        };
      });

      const newLog = [{
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        playerName: player.name,
        action: 'Défausse forcée',
        detail: `a défaussé ${allDiscarded.length} carte(s) (${queue.reason})`,
      }, ...prev.log];

      const remainingEntries = queue.entries.slice(1);
      const newTotalDiscarded = queue.totalDiscarded + allDiscarded.length;

      if (remainingEntries.length === 0) {
        let finalPlayers = updatedPlayers;
        if (queue.etherBonusPerCard && newTotalDiscarded > 0) {
          finalPlayers = updatedPlayers.map((p, i) =>
            i === queue.sourcePlayerIndex ? { ...p, ether: p.ether + newTotalDiscarded } : p
          );
          newLog.unshift({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: prev.players[queue.sourcePlayerIndex].name,
            action: queue.reason,
            detail: `a gagné ${newTotalDiscarded} Éther (autant que de cartes défaussées)`,
          });
        }
        return {
          ...prev,
          players: finalPlayers,
          discardPile: [...allDiscarded, ...prev.discardPile],
          log: newLog,
          forcedDiscardQueue: null,
        };
      }

      return {
        ...prev,
        players: updatedPlayers,
        discardPile: [...allDiscarded, ...prev.discardPile],
        log: newLog,
        forcedDiscardQueue: {
          ...queue,
          entries: remainingEntries,
          totalDiscarded: newTotalDiscarded,
        },
      };
    });
  }, []);

  // === BAC-03 (Mouettes): Steal a card from a god ===
  const resolveStealCard = useCallback((targetPlayerId: string, cardId: string) => {
    if (!pendingEffect) return;
    setGameState(prev => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const targetPlayer = prev.players.find(p => p.id === targetPlayerId);
      if (!targetPlayer) return prev;
      const card = targetPlayer.hand.find(c => c.id === cardId);
      if (!card) return prev;

      const updatedPlayers = prev.players.map(p => {
        if (p.id === targetPlayerId) {
          return { ...p, hand: p.hand.filter(c => c.id !== cardId) };
        }
        if (p.id === prev.players[pi].id) {
          return { ...p, hand: [...p.hand, card] };
        }
        return p;
      });

      return {
        ...prev,
        players: updatedPlayers,
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: prev.players[pi].name,
          action: pendingEffect.sourceMortalName,
          detail: `a volé ${card.name} à ${targetPlayer.name}`,
        }, ...prev.log],
      };
    });
    setPendingEffect(null);
  }, [pendingEffect]);

  // === BAC-02 (Dauphins): Metamorphose extra mortal at +6 cost ===
  const resolveMetamorphoseExtra = useCallback((mortalId: string) => {
    if (!pendingEffect) return;
    const extraCost = pendingEffect.extraMetamorphoseCostAdded || 6;

    let effectToTrigger: PendingEffect | null = null;

    setGameState(prev => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      const player = prev.players[pi];
      const mortal = player.mortals.find(m => m.id === mortalId);
      if (!mortal) return prev;
      if (mortal.isMetamorphosed || mortal.status === 'retired' || mortal.status === 'incapacite') return prev;

      const totalCost = mortal.cost + extraCost;
      if (player.ether < totalCost) {
        toast.error(`Pas assez d'Éther ! (${totalCost} requis, ${player.ether} disponible)`);
        return prev;
      }

      const updatedMortals = player.mortals.map(m =>
        m.id === mortalId ? { ...m, isMetamorphosed: true } : m
      );
      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          ether: p.ether - totalCost,
          mortals: updatedMortals,
          metamorphosedCount: updatedMortals.filter(m => m.isMetamorphosed).length,
          metamorphosesThisTurn: p.metamorphosesThisTurn + 1,
        };
      });

      const newState = {
        ...prev,
        players: updatedPlayers,
        log: [{
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: player.name,
          action: pendingEffect.sourceMortalName,
          detail: `a métamorphosé ${mortal.nameRecto} → ${mortal.nameVerso} via Dauphins (coût: ${totalCost} Éther)`,
        }, ...prev.log],
      };

      // Check for on-metamorphose effect on the newly metamorphosed mortal
      const metamorphosedMortal = updatedMortals.find(m => m.id === mortalId)!;
      const updatedPlayer = updatedPlayers[pi];
      effectToTrigger = getMetamorphoseEffect(metamorphosedMortal, updatedPlayer, newState);

      return newState;
    });

    // If the extra metamorphose has an on-metamorphose effect, trigger it
    if (effectToTrigger) {
      if ((effectToTrigger as PendingEffect).conditionNotMet && (effectToTrigger as PendingEffect).type === 'none') {
        toast.info((effectToTrigger as PendingEffect).conditionNotMet);
        setPendingEffect(null);
      } else {
        setPendingEffect(effectToTrigger);
      }
    } else {
      setPendingEffect(null);
    }
    toast.success('Mortel métamorphosé via Dauphins !', {
      style: { background: 'hsl(280 40% 20%)', border: '1px solid hsl(280 50% 40%)', color: 'white', fontSize: '16px' },
    });
  }, [pendingEffect]);

  // === BAC-04 (Quatre Colombes): Move incapacitations ===
  const resolveMoveIncapacitations = useCallback((moves: { fromMortalId: string; toMortalId: string; fromPlayerId: string; toPlayerId: string }[]) => {
    if (!pendingEffect) return;
    if (moves.length === 0) {
      setPendingEffect(null);
      return;
    }

    setGameState(prev => {
      if (!prev) return prev;
      const pi = pendingEffect.sourcePlayerIndex;
      let updatedPlayers = [...prev.players];
      const newLog = [...prev.log];

      for (const move of moves) {
        // Heal the source mortal
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id !== move.fromPlayerId) return p;
          return {
            ...p,
            mortals: p.mortals.map(m =>
              m.id === move.fromMortalId ? { ...m, status: 'normal' as const } : m
            ),
          };
        });
        // Incapacitate the target mortal
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id !== move.toPlayerId) return p;
          return {
            ...p,
            mortals: p.mortals.map(m =>
              m.id === move.toMortalId ? { ...m, status: 'incapacite' as const } : m
            ),
          };
        });

        const fromMortal = prev.players.find(p => p.id === move.fromPlayerId)?.mortals.find(m => m.id === move.fromMortalId);
        const toMortal = prev.players.find(p => p.id === move.toPlayerId)?.mortals.find(m => m.id === move.toMortalId);
        newLog.unshift({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: prev.players[pi].name,
          action: 'Quatre Colombes',
          detail: `a déplacé l'incapacité de ${fromMortal?.nameVerso || 'un mortel'} vers ${toMortal?.nameVerso || 'un mortel'}`,
        });
      }

      return { ...prev, players: updatedPlayers, log: newLog };
    });
    setPendingEffect(null);
    toast.success(`${moves.length} incapacité(s) déplacée(s) !`, {
      style: { background: 'hsl(280 40% 20%)', border: '1px solid hsl(280 50% 40%)', color: 'white', fontSize: '16px' },
    });
  }, [pendingEffect]);

  return {
    gameState,
    setGameState,
    currentPlayerIndex,
    gameStarted,
    setGameStarted,
    interactionMode,
    winners,
    discardRequired,
    pendingReactionCard,
    pendingEffect,
    reactionWindow,
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
    toggleActivateMode,
    togglePlaceReactionMode,
    handleToggleReactionWindow,
    resolveEffect,
    cancelEffect,
    cancelDiscard,
    handleTargetMortalClick,
    healAllOwnMortals,
    selectChoice,
    resolveGodDiscard,
    resolveCardDiscard,
    resolvePayDrawDiscard,
    initiatePayDraw,
    resolveReactionDiscard,
    resolveGlane,
    resolveSelectGod,
    resolvePlaySpellAtDiscount,
    resolvePayMultipleEnemyDiscard,
    resolveStealCard,
    resolveMetamorphoseExtra,
    resolveMoveIncapacitations,
    handleReactionReady,
    handleReactionPass,
    handleReactionActivate,
    handleForcedDiscardChoice,
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
