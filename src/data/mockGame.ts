import { GameState, Player, SpellCard, DivinityId, DIVINITIES } from '@/types/game';
import { createMortalsForGod } from './mortals';
import { createDeck } from './spellCards';

const GOD_NAMES: Record<DivinityId, string> = {
  apollon: 'Apollon',
  venus: 'Vénus',
  bacchus: 'Bacchus',
  minerve: 'Minerve',
  diane: 'Diane',
  neptune: 'Neptune',
  ceres: 'Cérès',
};

export function createMockGameState(playerCount: number = 4): GameState {
  const divinities: DivinityId[] = ['apollon', 'venus', 'bacchus', 'minerve', 'diane', 'neptune', 'ceres'];
  const deck = createDeck();

  const players: Player[] = Array.from({ length: playerCount }, (_, i) => {
    const divId = divinities[i % divinities.length];
    const div = DIVINITIES[divId];
    const mortals = createMortalsForGod(divId);

    return {
      id: `player-${i}`,
      name: div.name,
      divinity: divId,
      divinityName: div.name,
      avatar: div.name.charAt(0),
      ether: 10,
      mortals,
      hand: [] as SpellCard[], // Start with 0 cards
      reactions: [],
      metamorphosedCount: 0,
      cannotDraw: false,
      cannotMetamorphose: false,
      skipNextTurn: false,
      metamorphosesThisTurn: 0,
      maxMetamorphosesThisTurn: 1,
      sursautActive: false,
    };
  });

  const state: GameState = {
    players,
    activePlayerIndex: 0,
    phase: 'principale',
    cycleStartPlayerIndex: 0,
    cycleActive: true,
    turnCount: 1,
    reactionWindowActive: false,
    reactionTimeRemaining: 20,
    reactionsBlocked: false,
    currentCard: null,
    discardPile: [],
    deck,
    log: [
      { id: '1', timestamp: Date.now() - 10000, playerName: players[0].name, action: 'Début', detail: 'La partie commence !' },
    ],
  };

  // First player draws 2 cards at game start
  const drawnCards: SpellCard[] = [];
  for (let j = 0; j < 2; j++) {
    const card = state.deck.pop();
    if (card) drawnCards.push(card);
  }
  state.players[0].hand = drawnCards;
  if (drawnCards.length > 0) {
    state.log.unshift({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      playerName: state.players[0].name,
      action: 'Pioche',
      detail: `a pioché ${drawnCards.length} cartes`,
    });
  }

  return state;
}
