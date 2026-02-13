// === Game Event Bus ===
// Central event system for mortal effects and triggers

export type GameEventType =
  | 'mortal_metamorphosed'
  | 'mortal_retrometamorphosed'
  | 'mortal_incapacitated'
  | 'mortal_healed'
  | 'mortal_removed'
  | 'ether_generated'
  | 'ether_destroyed'
  | 'ether_stolen'
  | 'card_drawn'
  | 'card_discarded'
  | 'card_played'
  | 'reaction_played'
  | 'reaction_placed'
  | 'cycle_start'
  | 'turn_start'
  | 'turn_end';

export interface GameEvent {
  type: GameEventType;
  sourcePlayerId: string;
  targetPlayerId?: string;
  mortalId?: string;
  mortalCode?: string;
  cardId?: string;
  amount?: number;
  isOutsideCycle?: boolean; // For ether generated outside normal cycle
  isOutsideDrawPhase?: boolean; // For cards drawn outside draw phase
  isFromEnemy?: boolean; // For tracking enemy-triggered effects
}

type EventListener = (event: GameEvent) => void;

class GameEventBus {
  private listeners: Map<GameEventType, EventListener[]> = new Map();

  on(type: GameEventType, listener: EventListener): () => void {
    const list = this.listeners.get(type) || [];
    list.push(listener);
    this.listeners.set(type, list);
    return () => {
      const updated = this.listeners.get(type) || [];
      this.listeners.set(type, updated.filter(l => l !== listener));
    };
  }

  emit(event: GameEvent): void {
    const listeners = this.listeners.get(event.type) || [];
    for (const listener of listeners) {
      listener(event);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const gameEventBus = new GameEventBus();
