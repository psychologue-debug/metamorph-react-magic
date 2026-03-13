import { SpellCard } from '@/types/game';
import { generateUUID } from '@/lib/uuid';

// Spell card templates from CSV data
export interface SpellTemplate {
  name: string;
  type: 'sortilege' | 'reaction';
  quantity: number;
  cost: number;
  targets: string;
  activationCondition?: string;
  effect: string;
  comment?: string;
}

export const SPELL_TEMPLATES: SpellTemplate[] = [
  {
    name: 'Torpeur',
    type: 'sortilege',
    quantity: 5,
    cost: 11,
    targets: 'un mortel ennemi déjà métamorphosé',
    effect: 'Incapacitez un mortel ennemi',
    comment: 'Le joueur actif doit cliquer sur le mortel qu\'il veut incapaciter.',
  },
  {
    name: 'Doute',
    type: 'sortilege',
    quantity: 3,
    cost: 3,
    targets: 'un mortel propre',
    effect: 'Rétromorphosez un de vos mortels',
  },
  {
    name: 'Règne',
    type: 'sortilege',
    quantity: 6,
    cost: 2,
    targets: '',
    effect: 'Jusqu\'à la fin de votre tour, aucune réaction ne peut être jouée',
  },
  {
    name: 'Parade',
    type: 'reaction',
    quantity: 4,
    cost: 6,
    targets: 'un mortel ennemi',
    activationCondition: 'Quand un mortel ayant un effet au moment de sa métamorphose vient d\'être métamorphosé',
    effect: 'L\'effet de métamorphose du mortel qui vient d\'être métamorphosé n\'a pas lieu (mais le mortel reste bien métamorphosé)',
  },
  {
    name: 'Catabolisme',
    type: 'sortilege',
    quantity: 5,
    cost: 2,
    targets: 'Des dieux ennemis',
    effect: 'Détruisez jusqu\'à 5 éther',
    comment: 'Le joueur clique sur les réservoirs des dieux pour répartir la destruction (max 5 clics total).',
  },
  {
    name: 'Sursaut',
    type: 'sortilege',
    quantity: 2,
    cost: 0,
    targets: '',
    effect: 'Générez 20 Ether dans votre réservoir. A la fin de votre tour, tout votre Ether sera détruit (0 dans le réservoir)',
  },
  {
    name: 'Glane',
    type: 'sortilege',
    quantity: 2,
    cost: 12,
    targets: 'Une carte de la défausse',
    effect: 'Prenez une carte de la défausse et mettez-la dans votre main',
    comment: 'Toutes les cartes de la défausse s\'affichent et le joueur clique sur celle qu\'il veut.',
  },
  {
    name: 'Rage',
    type: 'sortilege',
    quantity: 5,
    cost: 10,
    targets: '',
    activationCondition: 'Avoir déjà métamorphosé un mortel propre pendant ce tour',
    effect: 'Vous pouvez métamorphoser un mortel supplémentaire pendant ce tour.',
  },
  {
    name: 'Katadesmos',
    type: 'sortilege',
    quantity: 2,
    cost: 14,
    targets: 'un dieu ennemi',
    effect: 'Jusqu\'à la fin de son prochain tour, le dieu ennemi désigné ne pourra en aucune façon métamorphoser ses mortels',
    comment: 'Il faut cliquer sur l\'image du Dieu qu\'on veut cibler.',
  },
  {
    name: 'Manne',
    type: 'sortilege',
    quantity: 2,
    cost: 7,
    targets: '',
    effect: 'Piochez 4 cartes et défaussez-en 2',
    comment: 'Les deux cartes défaussées peuvent être des sortilèges dans la main ou des réactions posées.',
  },
  {
    name: 'Résistance',
    type: 'reaction',
    quantity: 4,
    cost: 9,
    targets: 'un mortel ennemi',
    activationCondition: 'Un dieu ennemi a désigné un de ses mortels à métamorphoser et a payé le coût.',
    effect: 'Le mortel n\'est finalement pas métamorphosé. Le coût de métamorphose est remboursé au dieu.',
    comment: 'Chaque métamorphose déclenche une fenêtre de réaction pour TOUS les joueurs ayant des réactions posées.',
  },
  {
    name: 'Anabolisme',
    type: 'sortilege',
    quantity: 6,
    cost: 0,
    targets: 'Soi-même',
    effect: 'Générez 1 Ether dans votre réservoir.',
  },
  {
    name: 'Sommeil',
    type: 'sortilege',
    quantity: 1,
    cost: 26,
    targets: 'un dieu ennemi',
    effect: 'Le dieu ennemi désigné sautera son prochain tour.',
    comment: 'Ses mortels généreront quand même de l\'Ether et il piochera, mais il ne pourra faire aucune action.',
  },
  {
    name: 'Pharmaka',
    type: 'sortilege',
    quantity: 2,
    cost: 24,
    targets: 'un mortel métamorphosé ennemi',
    effect: 'Rétromorphosez un mortel ennemi',
    comment: 'Le mortel retourne sur la face recto, perd ses effets, et devra être re-métamorphosé.',
  },
  {
    name: 'Compassion',
    type: 'reaction',
    quantity: 5,
    cost: 8,
    targets: 'un mortel propre',
    activationCondition: 'Un mortel propre est ciblé par un effet ennemi',
    effect: 'Protégez votre mortel : l\'effet ennemi est annulé (coûts restent payés).',
    comment: 'Fenêtre "Votre mortel X est ciblé. Voulez-vous réagir ?" avec vérification du coût.',
  },
  {
    name: 'Éveil',
    type: 'sortilege',
    quantity: 4,
    cost: 8,
    targets: 'un mortel propre incapacité',
    effect: 'Levez l\'incapacité d\'un de vos mortels.',
  },
  {
    name: 'Turbulence',
    type: 'sortilege',
    quantity: 2,
    cost: 13,
    targets: 'Les réactions posées',
    activationCondition: 'Il faut qu\'il y ait au moins une réaction posée par un dieu',
    effect: 'Tous les dieux défaussent leurs réactions posées.',
  },
  {
    name: 'Métabolisme',
    type: 'sortilege',
    quantity: 3,
    cost: 3,
    targets: 'Défausse (Anabolisme + Catabolisme)',
    activationCondition: 'Il doit y avoir au moins une carte Anabolisme et une carte Catabolisme dans la défausse',
    effect: 'Prenez une carte Anabolisme et une carte Catabolisme dans la défausse.',
  },
  {
    name: 'Éon',
    type: 'sortilege',
    quantity: 3,
    cost: 8,
    targets: '',
    effect: 'Le cycle se termine à la fin de votre tour. C\'est désormais le nouveau point de départ du cycle.',
    comment: 'La condition de victoire et la génération d\'Éther ont désormais lieu à la fin du tour de ce dieu.',
  },
  {
    name: 'Sursis',
    type: 'reaction',
    quantity: 1,
    cost: 10,
    targets: 'un mortel ennemi',
    activationCondition: 'Un dieu ennemi a désigné son dernier mortel non-métamorphosé et a payé le coût',
    effect: 'Le mortel n\'est finalement pas métamorphosé. Le coût reste payé. Il sera métamorphosé automatiquement au début du prochain cycle.',
    comment: 'Sursis peut être joué même si un effet empêche les réactions. Aucune réaction ne peut réagir à Sursis.',
  },
];

// Create a full deck from templates
export function createDeck(): SpellCard[] {
  const deck: SpellCard[] = [];
  for (const template of SPELL_TEMPLATES) {
    for (let i = 0; i < template.quantity; i++) {
      deck.push({
        id: `spell-${template.name}-${i}-${generateUUID().slice(0, 6)}`,
        name: template.name,
        type: template.type,
        cost: template.cost,
        quantity: template.quantity,
        description: template.effect,
        targets: template.targets,
        activationCondition: template.activationCondition,
        comment: template.comment,
      });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
