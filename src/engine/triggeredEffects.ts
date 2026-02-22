// === Triggered Effects Engine ===
// Passive mortal effects that fire in response to game events.

import { Player, GameState, GameLogEntry, SpellCard } from '@/types/game';

export interface TriggeredResult {
  etherChanges: { playerIndex: number; amount: number; reason: string; mortalName: string }[];
  drawCards: { playerIndex: number; count: number; reason: string; mortalName: string }[];
}

function findActiveEffect(
  players: Player[],
  mortalCode: string
): { playerIndex: number; mortalName: string } | null {
  for (let i = 0; i < players.length; i++) {
    const mortal = players[i].mortals.find(
      m => m.code === mortalCode && m.isMetamorphosed && m.status !== 'incapacite' && m.status !== 'retired'
    );
    if (mortal) return { playerIndex: i, mortalName: mortal.nameVerso };
  }
  return null;
}

/** Triggered when any mortal is metamorphosed */
export function onMortalMetamorphosed(
  players: Player[],
  mortalCode: string,
  mortalType: string | undefined,
  ownerPlayerIndex: number
): TriggeredResult {
  const result: TriggeredResult = { etherChanges: [], drawCards: [] };

  // VEN-03 (Fontaine intarissable): +1 ether when any mortal is metamorphosed
  const ven03 = findActiveEffect(players, 'VEN-03');
  if (ven03) {
    result.etherChanges.push({
      playerIndex: ven03.playerIndex, amount: 1,
      reason: 'mortel métamorphosé', mortalName: ven03.mortalName,
    });
  }

  // NEP-03 (Naïade des mers): +1 ether + draw 1 when a vegetal mortal is metamorphosed
  if (mortalType === 'vegetal') {
    const nep03 = findActiveEffect(players, 'NEP-03');
    if (nep03) {
      result.etherChanges.push({
        playerIndex: nep03.playerIndex, amount: 1,
        reason: 'mortel végétal métamorphosé', mortalName: nep03.mortalName,
      });
      result.drawCards.push({
        playerIndex: nep03.playerIndex, count: 1,
        reason: 'mortel végétal métamorphosé', mortalName: nep03.mortalName,
      });
    }
  }

  // MIN-05 (Phoenix): +4 ether when the owner metamorphoses beyond the first this turn
  const min05 = findActiveEffect(players, 'MIN-05');
  if (min05 && min05.playerIndex === ownerPlayerIndex) {
    if (players[ownerPlayerIndex].metamorphosesThisTurn > 1) {
      result.etherChanges.push({
        playerIndex: min05.playerIndex, amount: 4,
        reason: 'métamorphose supplémentaire ce tour', mortalName: min05.mortalName,
      });
    }
  }

  return result;
}

/** Triggered when any mortal is incapacitated */
export function onMortalIncapacitated(players: Player[]): TriggeredResult {
  const result: TriggeredResult = { etherChanges: [], drawCards: [] };

  // VEN-02 (Fleuve Alphée): +1 ether when any mortal is incapacitated
  const ven02 = findActiveEffect(players, 'VEN-02');
  if (ven02) {
    result.etherChanges.push({
      playerIndex: ven02.playerIndex, amount: 1,
      reason: 'mortel incapacité', mortalName: ven02.mortalName,
    });
  }

  return result;
}

/** Triggered when ether is destroyed */
export function onEtherDestroyed(players: Player[]): TriggeredResult {
  const result: TriggeredResult = { etherChanges: [], drawCards: [] };

  // DIA-05 (Mouettes de Diane): +2 ether when ether is destroyed
  const dia05 = findActiveEffect(players, 'DIA-05');
  if (dia05) {
    result.etherChanges.push({
      playerIndex: dia05.playerIndex, amount: 2,
      reason: 'Éther détruit', mortalName: dia05.mortalName,
    });
  }

  return result;
}

/** Triggered when a reaction card is activated */
export function onReactionPlayed(players: Player[]): TriggeredResult {
  const result: TriggeredResult = { etherChanges: [], drawCards: [] };

  // MIN-07 (Araignée): +1 ether when a reaction is played
  const min07 = findActiveEffect(players, 'MIN-07');
  if (min07) {
    result.etherChanges.push({
      playerIndex: min07.playerIndex, amount: 1,
      reason: 'réaction jouée', mortalName: min07.mortalName,
    });
  }

  return result;
}

/** Apply triggered result to game state */
export function applyTriggeredResult(
  state: GameState,
  result: TriggeredResult
): { players: Player[]; logs: GameLogEntry[]; deck: SpellCard[]; discardPile: SpellCard[] } {
  let players = state.players.map(p => ({ ...p }));
  const logs: GameLogEntry[] = [];
  let deck = [...state.deck];
  let discardPile = [...state.discardPile];

  for (const change of result.etherChanges) {
    players = players.map((p, i) =>
      i === change.playerIndex ? { ...p, ether: p.ether + change.amount } : p
    );
    logs.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      playerName: players[change.playerIndex].name,
      action: change.mortalName,
      detail: `+${change.amount} Éther (${change.reason})`,
    });
  }

  for (const draw of result.drawCards) {
    const drawnCards: SpellCard[] = [];
    for (let i = 0; i < draw.count; i++) {
      if (deck.length === 0 && discardPile.length > 0) {
        deck = [...discardPile].sort(() => Math.random() - 0.5);
        discardPile = [];
      }
      const card = deck.pop();
      if (card) drawnCards.push(card);
    }
    if (drawnCards.length > 0) {
      players = players.map((p, i) =>
        i === draw.playerIndex ? { ...p, hand: [...p.hand, ...drawnCards] } : p
      );
      logs.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        playerName: players[draw.playerIndex].name,
        action: draw.mortalName,
        detail: `+${drawnCards.length} carte(s) (${draw.reason})`,
      });
    }
  }

  return { players, logs, deck, discardPile };
}
