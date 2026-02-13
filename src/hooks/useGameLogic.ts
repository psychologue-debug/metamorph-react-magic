import { useState, useCallback } from 'react';
import { GameState, Player, SpellCard, TurnPhase, DivinityId } from '@/types/game';
import { createMockGameState } from '@/data/mockGame';
import { toast } from 'sonner';

export type InteractionMode = 'idle' | 'metamorphosing' | 'playing_spell';

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('idle');
  const [winners, setWinners] = useState<Player[]>([]);
  const [discardRequired, setDiscardRequired] = useState(false);
  const [pendingReactionCard, setPendingReactionCard] = useState<SpellCard | null>(null);

  const startGame = useCallback((playerCount: number, selectedGods?: DivinityId[]) => {
    const state = createMockGameState(playerCount, selectedGods);
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
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.activePlayerIndex];

    // Check if hand > 2 → need to discard first
    if (currentPlayer.hand.length > 2) {
      setDiscardRequired(true);
      return;
    }

    setInteractionMode('idle');

    const nextPlayerIdx = (gameState.activePlayerIndex + 1) % gameState.players.length;
    const isNewCycle = nextPlayerIdx === gameState.cycleStartPlayerIndex;

    let updatedPlayers = gameState.players.map((p, i) => {
      if (i === gameState.activePlayerIndex) {
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

    let newDeck = [...gameState.deck];
    let newDiscardPile = [...gameState.discardPile];
    const newLog = [
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        playerName: currentPlayer.name,
        action: 'Fin du Tour',
        detail: 'a terminé son tour',
      },
      ...gameState.log,
    ];

    // Check victory at end of cycle
    if (isNewCycle) {
      const cycleWinners = updatedPlayers.filter((p) => p.metamorphosedCount >= 10);
      if (cycleWinners.length > 0) {
        setWinners(cycleWinners);
        setGameState({
          ...gameState,
          players: updatedPlayers,
          log: newLog,
        });
        return;
      }

      // Generate ether at start of new cycle
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
        detail: `Cycle ${gameState.turnCount + 1} — Éther généré pour tous les dieux`,
      });
    }

    // Draw 2 cards for next player
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

    setGameState({
      ...gameState,
      players: updatedPlayers,
      activePlayerIndex: nextPlayerIdx,
      phase: 'principale' as TurnPhase,
      reactionsBlocked: false,
      turnCount: isNewCycle ? gameState.turnCount + 1 : gameState.turnCount,
      deck: newDeck,
      log: newLog,
    });
    setCurrentPlayerIndex(nextPlayerIdx);
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
        toast.error(`Pas assez d'Éther ! (coût: ${mortal.cost}, disponible: ${player.ether})`, {
          style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '18px' },
        });
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

      // If it's a reaction card, show dialog instead of directly placing
      if (card.type === 'reaction') {
        setPendingReactionCard(card);
        return prev;
      }

      // Check cost
      if (player.ether < card.cost) {
        toast.error(`Pas assez d'Éther ! (coût: ${card.cost}, disponible: ${player.ether})`, {
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

    if (player.ether < card.cost) {
      toast.error(`Pas assez d'Éther ! (coût: ${card.cost}, disponible: ${player.ether})`, {
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
          ether: p.ether - card.cost,
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

  return {
    gameState,
    currentPlayerIndex,
    gameStarted,
    interactionMode,
    winners,
    discardRequired,
    pendingReactionCard,
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
  if (player.ether < card.cost) return false;
  const check = checkActivationCondition(card, player, gameState);
  return check.valid;
}
