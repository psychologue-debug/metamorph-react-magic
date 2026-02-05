import { GameState, Player, Mortal, SpellCard, DivinityId, DIVINITIES } from '@/types/game';

const ROMAN_NAMES = [
  'Lucius', 'Gaius', 'Marcus', 'Quintus', 'Titus',
  'Aulus', 'Publius', 'Servius', 'Decimus', 'Gnaeus',
  'Cornelia', 'Claudia', 'Livia', 'Flavia', 'Aurelia',
  'Tullia', 'Valeria', 'Octavia', 'Lucretia', 'Porcia',
];

const MORTAL_NAMES = [
  'Arachné', 'Narcisse', 'Daphné', 'Actéon', 'Callisto',
  'Io', 'Syrinx', 'Lycaon', 'Philémon', 'Baucis',
];

const SPELL_NAMES: { name: string; cost: number; type: 'sortilege' | 'reaction'; description: string; targets: any[]; triggerCondition?: string }[] = [
  { name: 'Boule de Feu', cost: 5, type: 'sortilege', description: 'Inflige 2 blessures à un Mortel ciblé', targets: ['mortel'] },
  { name: 'Vent Divin', cost: 3, type: 'sortilege', description: 'Déplace un Mortel adverse vers un autre emplacement', targets: ['mortel'] },
  { name: 'Bénédiction', cost: 4, type: 'sortilege', description: 'Protège un de vos Mortels pendant 1 tour', targets: ['mortel'] },
  { name: 'Pillage d\'Éther', cost: 2, type: 'sortilege', description: 'Volez 3 Éther à un adversaire', targets: ['joueur'] },
  { name: 'Égide d\'Athéna', cost: 0, type: 'reaction', description: 'Bloque une attaque visant vos Mortels', targets: ['mortel'], triggerCondition: 'Quand un adversaire cible un de vos Mortels' },
  { name: 'Intervention Divine', cost: 0, type: 'reaction', description: 'Annule l\'action d\'un sort adverse', targets: ['sort'], triggerCondition: 'Quand un adversaire joue un Sortilège' },
  { name: 'Ruse de Mercure', cost: 0, type: 'reaction', description: 'Redirige un sort vers un autre joueur', targets: ['joueur'], triggerCondition: 'Quand vous êtes ciblé par un sort' },
  { name: 'Oracle', cost: 3, type: 'sortilege', description: 'Regardez les 3 prochaines cartes du deck', targets: ['deck'] },
  { name: 'Résurrection', cost: 8, type: 'sortilege', description: 'Récupérez un Mortel de la défausse', targets: ['defausse'] },
  { name: 'Tempête', cost: 6, type: 'sortilege', description: 'Inflige 1 blessure à tous les Mortels d\'un joueur', targets: ['joueur'] },
];

function createMortals(): Mortal[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `mortal-${crypto.randomUUID().slice(0, 8)}`,
    name: MORTAL_NAMES[i],
    value: Math.floor(Math.random() * 3) + 1,
    cost: Math.floor(Math.random() * 5) + 2,
    isMetamorphosed: i < Math.floor(Math.random() * 3), // Some pre-metamorphosed for demo
    position: i,
  }));
}

function createHand(): SpellCard[] {
  const hand: SpellCard[] = [];
  for (let i = 0; i < 2; i++) {
    const template = SPELL_NAMES[Math.floor(Math.random() * SPELL_NAMES.length)];
    hand.push({
      id: `spell-${crypto.randomUUID().slice(0, 8)}`,
      ...template,
    });
  }
  return hand;
}

function createReactions(): SpellCard[] {
  const reactions = SPELL_NAMES.filter(s => s.type === 'reaction');
  const count = Math.random() > 0.5 ? 1 : Math.random() > 0.3 ? 2 : 0;
  return Array.from({ length: count }, () => {
    const template = reactions[Math.floor(Math.random() * reactions.length)];
    return {
      id: `reaction-${crypto.randomUUID().slice(0, 8)}`,
      ...template,
      isRevealed: false,
    };
  });
}

export function createMockGameState(playerCount: number = 4): GameState {
  const divinities: DivinityId[] = ['jupiter', 'mars', 'venus', 'minerva', 'neptune', 'apollo', 'diana'];
  
  const players: Player[] = Array.from({ length: playerCount }, (_, i) => {
    const divId = divinities[i % divinities.length];
    const div = DIVINITIES[divId];
    const mortals = createMortals();
    return {
      id: `player-${i}`,
      name: ROMAN_NAMES[i],
      divinity: divId,
      divinityName: div.name,
      avatar: div.name.charAt(0),
      ether: Math.floor(Math.random() * 15) + 5,
      mortals,
      hand: createHand(),
      reactions: createReactions(),
      totalMortalValue: mortals.reduce((sum, m) => sum + m.value, 0),
      metamorphosedCount: mortals.filter(m => m.isMetamorphosed).length,
    };
  });

  return {
    players,
    activePlayerIndex: 0,
    phase: 'principale',
    cycleStartPlayerIndex: 0,
    cycleActive: true,
    turnCount: 3,
    reactionWindowActive: false,
    reactionTimeRemaining: 20,
    currentCard: null,
    discardPile: [],
    deckCount: 42,
    log: [
      { id: '1', timestamp: Date.now() - 30000, playerName: players[0].name, action: 'Pioche', detail: 'a pioché 2 cartes' },
      { id: '2', timestamp: Date.now() - 20000, playerName: players[1].name, action: 'Métamorphose', detail: 'a métamorphosé Narcisse (coût: 6 Éther)' },
      { id: '3', timestamp: Date.now() - 10000, playerName: players[0].name, action: 'Sort', detail: 'a joué Boule de Feu sur Daphné' },
    ],
  };
}
