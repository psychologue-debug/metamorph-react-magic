// === Cost Modifier Pipeline ===
// Computes effective costs for metamorphosis and spells based on active mortal effects

import { Player, GameState, Mortal, SpellCard } from '@/types/game';

/**
 * Get the effective metamorphosis cost for a mortal, applying all active modifiers.
 * 
 * Active modifiers:
 * - APO-07 (Fleuve Marsyas): Own other mortals cost -1 (permanent, while metamorphosed)
 * - DIA-07 (Grande Ours): ALL enemy mortals cost +1 (permanent, while metamorphosed)
 */
export function getEffectiveMetamorphosisCost(
  mortal: Mortal,
  owner: Player,
  gameState: GameState
): number {
  let cost = mortal.cost;

  // APO-07: Fleuve Marsyas — own other mortals cost -1
  const fleuveMarysas = owner.mortals.find(
    m => m.code === 'APO-07' && m.isMetamorphosed && m.status !== 'incapacite' && m.id !== mortal.id
  );
  if (fleuveMarysas) {
    cost -= 1;
  }

  // DIA-07: Grande Ours — ALL enemy mortals cost +1
  for (const player of gameState.players) {
    if (player.id === owner.id) continue;
    const grandeOurs = player.mortals.find(
      m => m.code === 'DIA-07' && m.isMetamorphosed && m.status !== 'incapacite'
    );
    if (grandeOurs) {
      cost += 1;
    }
  }

  return Math.max(0, cost);
}

/**
 * Get the effective spell/reaction cost, applying all active modifiers.
 * 
 * Active modifiers:
 * - BAC-09 (Trois chauve-souris): Cards cost -1 (permanent, while metamorphosed)
 */
export function getEffectiveCardCost(
  card: SpellCard,
  owner: Player
): number {
  let cost = card.cost;

  // BAC-09: Trois chauve-souris — cards cost -1
  const chauveSouris = owner.mortals.find(
    m => m.code === 'BAC-09' && m.isMetamorphosed && m.status !== 'incapacite'
  );
  if (chauveSouris) {
    cost -= 1;
  }

  return Math.max(0, cost);
}

/**
 * Get cost modifier summary for display purposes (shows what modifiers are active).
 */
export function getCostModifiers(
  mortal: Mortal,
  owner: Player,
  gameState: GameState
): { total: number; modifiers: { source: string; amount: number }[] } {
  const modifiers: { source: string; amount: number }[] = [];

  const fleuveMarysas = owner.mortals.find(
    m => m.code === 'APO-07' && m.isMetamorphosed && m.status !== 'incapacite' && m.id !== mortal.id
  );
  if (fleuveMarysas) {
    modifiers.push({ source: 'Fleuve Marsyas', amount: -1 });
  }

  for (const player of gameState.players) {
    if (player.id === owner.id) continue;
    const grandeOurs = player.mortals.find(
      m => m.code === 'DIA-07' && m.isMetamorphosed && m.status !== 'incapacite'
    );
    if (grandeOurs) {
      modifiers.push({ source: `Grande Ours (${player.name})`, amount: 1 });
    }
  }

  const total = modifiers.reduce((sum, m) => sum + m.amount, 0);
  return { total, modifiers };
}
