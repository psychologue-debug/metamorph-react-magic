// === Game Types for Métamorphoses ===

export type DivinityId = 
  | 'apollon' | 'venus' | 'bacchus' | 'minerve' 
  | 'diane' | 'neptune' | 'ceres';

export type TurnPhase = 'debut_tour' | 'pioche' | 'principale' | 'defausse' | 'fin_tour';

export type CardType = 'sortilege' | 'reaction';

export type TargetType = 'joueur' | 'mortel' | 'sort' | 'deck' | 'defausse' | 'dieu' | 'soi-meme';

export type MortalType = 'animal' | 'vegetal' | 'mineral';

export type MortalStatus = 'normal' | 'incapacite' | 'retired';

// === Event System ===
export type GameEventType =
  | 'ether_generated' | 'ether_destroyed' | 'ether_stolen'
  | 'card_drawn' | 'card_discarded' | 'card_played'
  | 'mortal_metamorphosed' | 'mortal_retrometamorphosed' | 'mortal_incapacitated' | 'mortal_healed'
  | 'cycle_start' | 'cycle_end'
  | 'turn_start' | 'turn_end'
  | 'reaction_placed' | 'reaction_triggered' | 'reaction_discarded'
  | 'phase_changed';

export interface GameEvent {
  type: GameEventType;
  playerId: string;
  targetPlayerId?: string;
  mortalId?: string;
  cardId?: string;
  amount?: number;
  detail?: string;
}

export interface MortalEffect {
  onMetamorphose?: string; // Effect code triggered on metamorphosis
  permanent?: string; // Effect code active permanently while metamorphosed
  description: string;
}

export interface Mortal {
  id: string;
  code: string; // e.g. "APO-01"
  god: DivinityId;
  nameRecto: string;
  nameVerso: string;
  type?: MortalType;
  cost: number; // Cost to metamorphose
  etherProduction: number; // Ether generated at cycle start (verso value)
  etherProductionRecto: number; // Ether generated when not metamorphosed (recto value)
  isMetamorphosed: boolean;
  status: MortalStatus;
  position: number; // 0-9 in the 2x5 grid
  effectOnMetamorphose?: string; // Natural language description
  effectPermanent?: string; // Natural language description (column H)
  imageRecto: string; // filename
  imageVerso: string; // filename
  comment?: string;
}

export interface SpellCard {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  quantity: number; // copies in starting deck
  description: string; // effect text
  targets: string; // natural language target description
  activationCondition?: string;
  comment?: string;
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
  metamorphosedCount: number;
  // Status effects
  cannotDraw: boolean;
  cannotMetamorphose: boolean;
  skipNextTurn: boolean;
  metamorphosesThisTurn: number;
  maxMetamorphosesThisTurn: number; // normally 1, Rage makes it 2
  sursautActive: boolean; // Ether destroyed at end of turn
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
  reactionsBlocked: boolean; // Règne effect
  currentCard: SpellCard | null;
  discardPile: SpellCard[];
  deck: SpellCard[];
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
  apollon: { name: 'Apollon', title: 'Dieu du Soleil', color: '35 85% 55%', power: 'Lumière : Révèle toutes les cartes Réaction' },
  venus: { name: 'Vénus', title: 'Déesse de l\'Amour', color: '330 60% 55%', power: 'Charme : Vole 1 carte à un adversaire' },
  bacchus: { name: 'Bacchus', title: 'Dieu du Vin', color: '280 50% 45%', power: 'Ivresse : Mélange les mortels d\'un adversaire' },
  minerve: { name: 'Minerve', title: 'Déesse de la Sagesse', color: '200 50% 50%', power: 'Stratégie : Piochez 2 cartes supplémentaires' },
  diane: { name: 'Diane', title: 'Déesse de la Chasse', color: '160 40% 45%', power: 'Flèche : Cible 2 Mortels simultanément' },
  neptune: { name: 'Neptune', title: 'Dieu des Mers', color: '195 70% 45%', power: 'Marée : Déplace un Mortel adverse' },
  ceres: { name: 'Cérès', title: 'Déesse des Moissons', color: '80 50% 40%', power: 'Récolte : Génère 3 Éther supplémentaires' },
};

export const PHASE_LABELS: Record<TurnPhase, string> = {
  debut_tour: 'Début du Tour',
  pioche: 'Pioche',
  principale: 'Phase Principale',
  defausse: 'Défausse',
  fin_tour: 'Fin du Tour',
};
