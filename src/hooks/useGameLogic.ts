import { useState, useCallback } from 'react';
import { GameState, Player, SpellCard, TurnPhase } from '@/types/game';
import { createMockGameState } from '@/data/mockGame';
import { toast } from 'sonner';

export type InteractionMode = 'idle' | 'metamorphosing' | 'playing_spell';

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('idle');

  const startGame = useCallback((playerCount: number) => {
    const state = createMockGameState(playerCount);
    setGameState(state);
    setCurrentPlayerIndex(0);
    setGameStarted(true);
  }, []);

  const handleEndTurn = useCallback(() => {
    setInteractionMode('idle');
    setGameState((prev) => {
      if (!prev) return prev;
      const currentPlayer = prev.players[prev.activePlayerIndex];
      const nextPlayerIdx = (prev.activePlayerIndex + 1) % prev.players.length;
      const isNewCycle = nextPlayerIdx === prev.cycleStartPlayerIndex;

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

      // Generate ether at start of new cycle for ALL players
      if (isNewCycle) {
        updatedPlayers = updatedPlayers.map((p) => {
          let etherGain = 0;
          for (const m of p.mortals) {
            if (m.status === 'incapacite') continue;
            etherGain += m.isMetamorphosed ? m.etherProduction : m.etherProductionRecto;
          }
          return { ...p, ether: p.ether + etherGain };
        });
        newLog.unshift({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: 'Système',
          action: 'Nouveau Cycle',
          detail: `Cycle ${prev.turnCount + 1} — Éther généré pour tous les dieux`,
        });
      }

      // Draw 2 cards for next player at start of their turn
      const drawnCards: SpellCard[] = [];
      if (!updatedPlayers[nextPlayerIdx].cannotDraw) {
        for (let i = 0; i < 2; i++) {
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
        log: newLog,
      };
    });
    setCurrentPlayerIndex((prev) => {
      if (!gameState) return prev;
      return (gameState.activePlayerIndex + 1) % gameState.players.length;
    });
  }, [gameState]);

  const handleMortalClick = useCallback((mortalId: string) => {
    if (interactionMode !== 'metamorphosing') return;

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
      if (player.ether < mortal.cost) {
        toast.error(`Pas assez d'Éther (coût: ${mortal.cost}, disponible: ${player.ether})`);
        return prev;
      }

      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        const updatedMortals = p.mortals.map((m) =>
          m.id === mortalId ? { ...m, isMetamorphosed: true } : m
        );
        return {
          ...p,
          ether: p.ether - mortal.cost,
          mortals: updatedMortals,
          metamorphosedCount: updatedMortals.filter((m) => m.isMetamorphosed).length,
          metamorphosesThisTurn: p.metamorphosesThisTurn + 1,
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
            action: 'Métamorphose',
            detail: `a métamorphosé ${mortal.nameRecto} → ${mortal.nameVerso} (coût: ${mortal.cost} Éther)`,
          },
          ...prev.log,
        ],
      };
    });
    setInteractionMode('idle');
  }, [interactionMode]);

  const handleCardClick = useCallback((cardId: string) => {
    if (interactionMode !== 'playing_spell') return;

    setGameState((prev) => {
      if (!prev) return prev;
      const player = prev.players[prev.activePlayerIndex];
      const card = player.hand.find((c) => c.id === cardId);
      if (!card) return prev;

      // Check cost
      if (player.ether < card.cost) {
        toast.error(`Pas assez d'Éther (coût: ${card.cost})`);
        return prev;
      }

      // Check activation conditions
      const condCheck = checkActivationCondition(card, player, prev);
      if (!condCheck.valid) {
        toast.error(condCheck.reason || 'Conditions non remplies');
        return prev;
      }

      // Reaction → place face down
      if (card.type === 'reaction') {
        if (player.reactions.length >= 2) {
          toast.error('Maximum 2 réactions posées');
          return prev;
        }
        const updatedPlayers = prev.players.map((p, i) => {
          if (i !== prev.activePlayerIndex) return p;
          return {
            ...p,
            hand: p.hand.filter((c) => c.id !== cardId),
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
      }

      // Sortilege → pay cost and resolve
      let updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        return {
          ...p,
          ether: p.ether - card.cost,
          hand: p.hand.filter((c) => c.id !== cardId),
        };
      });

      let reactionsBlocked = prev.reactionsBlocked;

      // Basic effect resolution
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
      }
      // TODO: implement targeting effects (Torpeur, Catabolisme, etc.)

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
            detail: `a joué ${card.name} (coût: ${card.cost} Éther) — ${card.description}`,
          },
          ...prev.log,
        ],
      };
    });
    setInteractionMode('idle');
  }, [interactionMode]);

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

  return {
    gameState,
    currentPlayerIndex,
    gameStarted,
    interactionMode,
    startGame,
    handleEndTurn,
    handleMortalClick,
    handleCardClick,
    toggleMetamorphoseMode,
    toggleSpellMode,
    handleToggleReactionWindow,
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

  // Reactions with conditions: always valid to place face down
  if (card.type === 'reaction') return { valid: true };

  return { valid: true };
}

export function canPlayCard(card: SpellCard, player: Player, gameState: GameState): boolean {
  if (player.ether < card.cost) return false;
  const check = checkActivationCondition(card, player, gameState);
  return check.valid;
}
