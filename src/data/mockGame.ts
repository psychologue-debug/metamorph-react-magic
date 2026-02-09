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

    // Deal 2 cards from deck
    const hand: SpellCard[] = [];
    for (let j = 0; j < 2; j++) {
      const card = deck.pop();
      if (card) hand.push(card);
    }

    return {
      id: `player-${i}`,
      name: div.name,
      divinity: divId,
      divinityName: div.name,
      avatar: div.name.charAt(0),
      ether: 10,
      mortals,
      hand,
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

  return {
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
}
