// === Game Types for Métamorphoses ===

export type DivinityId = 
  | 'jupiter' | 'mars' | 'venus' | 'minerva' 
  | 'neptune' | 'apollo' | 'diana';

export type TurnPhase = 'debut_tour' | 'pioche' | 'principale' | 'defausse' | 'fin_tour';

export type CardType = 'sortilege' | 'reaction';

export type TargetType = 'joueur' | 'mortel' | 'sort' | 'deck' | 'defausse';

export interface Mortal {
  id: string;
  name: string;
  value: number; // Éther generated when metamorphosed
  cost: number; // Cost to metamorphose
  isMetamorphosed: boolean;
  position: number; // 0-9 in the 2x5 grid
}

export interface SpellCard {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  targets: TargetType[];
  triggerCondition?: string; // For reaction cards
  isRevealed?: boolean;
}

export interface Player {
  id: string;
  name: string;
  divinity: DivinityId;
  divinityName: string;
  avatar: string;
  ether: number;
  mortals: Mortal[];
  hand: SpellCard[];
  reactions: SpellCard[]; // Face-down reaction cards (max 2)
  totalMortalValue: number;
  metamorphosedCount: number;
}

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  phase: TurnPhase;
  cycleStartPlayerIndex: number;
  cycleActive: boolean;
  turnCount: number;
  reactionWindowActive: boolean;
  reactionTimeRemaining: number;
  currentCard: SpellCard | null;
  discardPile: SpellCard[];
  deckCount: number;
  log: GameLogEntry[];
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  playerName: string;
  action: string;
  detail: string;
}

// Divinity data
export const DIVINITIES: Record<DivinityId, { name: string; title: string; color: string; power: string }> = {
  jupiter: { name: 'Jupiter', title: 'Roi des Dieux', color: '42 78% 55%', power: 'Foudre Divine : Inflige 3 dégâts à un Mortel adverse' },
  mars: { name: 'Mars', title: 'Dieu de la Guerre', color: '0 65% 50%', power: 'Fureur : Double les dégâts du prochain sort' },
  venus: { name: 'Vénus', title: 'Déesse de l\'Amour', color: '330 60% 55%', power: 'Charme : Vole 1 carte à un adversaire' },
  minerva: { name: 'Minerve', title: 'Déesse de la Sagesse', color: '200 50% 50%', power: 'Stratégie : Piochez 2 cartes supplémentaires' },
  neptune: { name: 'Neptune', title: 'Dieu des Mers', color: '195 70% 45%', power: 'Marée : Déplace un Mortel adverse' },
  apollo: { name: 'Apollon', title: 'Dieu du Soleil', color: '35 85% 55%', power: 'Lumière : Révèle toutes les cartes Réaction' },
  diana: { name: 'Diane', title: 'Déesse de la Chasse', color: '160 40% 45%', power: 'Flèche : Cible 2 Mortels simultanément' },
};

export const PHASE_LABELS: Record<TurnPhase, string> = {
  debut_tour: 'Début du Tour',
  pioche: 'Pioche',
  principale: 'Phase Principale',
  defausse: 'Défausse',
  fin_tour: 'Fin du Tour',
};
