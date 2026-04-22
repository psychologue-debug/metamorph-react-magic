// === Mortal Status Engine ===
// Handles invulnerability checks and retired status logic

import { Mortal, Player, GameState } from '@/types/game';

/**
 * Check if a mortal is invulnerable (cannot be incapacitated, retro-metamorphosed, or removed).
 *
 * Sources of invulnerability:
 * - APO-08/09/10 combo: If all three (Deux arbres, Hyacinthe fleur, Cyprès) are metamorphosed,
 *   ALL owner's metamorphosed mortals become invulnerable.
 * - DIA-07 (Grande Ours): Self-invulnerable.
 * - MIN-06 (Soldats de Thèbes): Self-invulnerable.
 */
export function isMortalInvulnerable(
  mortal: Mortal,
  owner: Player,
  _gameState: GameState
): boolean {
  if (!mortal.isMetamorphosed) return false;
  if (mortal.status === 'retired') return false;

  // DIA-07 (Grande Ours): self-invulnerable
  if (mortal.code === 'DIA-07' && mortal.isMetamorphosed && mortal.status !== 'incapacite') {
    return true;
  }

  // MIN-06 (Soldats de Thèbes): self-invulnerable
  if (mortal.code === 'MIN-06' && mortal.isMetamorphosed && mortal.status !== 'incapacite') {
    return true;
  }

  // MIN-09 (Chouette de Minerve): cannot be retro-metamorphosed or removed (partial invulnerability)
  // Handled separately via canBeRetroMetamorphosed / canBeRemoved if needed
  // For full invulnerability check, MIN-09 is NOT fully invulnerable (can be incapacitated)

  // APO-08/09/10 combo: all three must be metamorphosed (incapacitation does NOT break invulnerability,
  // only "retired" / removed-from-game does).
  if (owner.divinity === 'apollon') {
    const apo08 = owner.mortals.find(m => m.code === 'APO-08');
    const apo09 = owner.mortals.find(m => m.code === 'APO-09');
    const apo10 = owner.mortals.find(m => m.code === 'APO-10');
    if (
      apo08?.isMetamorphosed && apo08.status !== 'retired' &&
      apo09?.isMetamorphosed && apo09.status !== 'retired' &&
      apo10?.isMetamorphosed && apo10.status !== 'retired'
    ) {
      // All owner's metamorphosed mortals are invulnerable
      return true;
    }
  }

  return false;
}

/**
 * Check if a mortal can be retro-metamorphosed.
 * Blocked by: invulnerability, MIN-09 (partial protection), retired status.
 */
export function canBeRetroMetamorphosed(
  mortal: Mortal,
  owner: Player,
  gameState: GameState
): boolean {
  if (!mortal.isMetamorphosed) return false;
  if (mortal.status === 'retired') return false;
  if (isMortalInvulnerable(mortal, owner, gameState)) return false;

  // MIN-09 (Chouette de Minerve): cannot be retro-metamorphosed
  if (mortal.code === 'MIN-09') return false;

  return true;
}

/**
 * Check if a mortal can be removed from the game.
 * Blocked by: invulnerability, MIN-09 (partial protection), already retired.
 */
export function canBeRemovedFromGame(
  mortal: Mortal,
  owner: Player,
  gameState: GameState
): boolean {
  if (mortal.status === 'retired') return false;
  if (isMortalInvulnerable(mortal, owner, gameState)) return false;

  // MIN-09: cannot be removed from game
  if (mortal.code === 'MIN-09') return false;

  return true;
}

/**
 * Check if a mortal can be incapacitated.
 * Blocked by: invulnerability, already incapacitated, not metamorphosed, retired.
 */
export function canBeIncapacitated(
  mortal: Mortal,
  owner: Player,
  gameState: GameState
): boolean {
  if (!mortal.isMetamorphosed) return false;
  if (mortal.status === 'incapacite') return false;
  if (mortal.status === 'retired') return false;
  if (isMortalInvulnerable(mortal, owner, gameState)) return false;

  // VEN-01 (Rossignol): immune to incapacitation
  if (mortal.code === 'VEN-01') {
    return false;
  }

  return true;
}

/**
 * Check if a mortal is retired (removed from game).
 * Retired mortals: greyed out, no ether, no effects, no interactions, still count as metamorphosed.
 */
export function isMortalRetired(mortal: Mortal): boolean {
  return mortal.status === 'retired';
}
