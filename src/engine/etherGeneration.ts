// === Ether Generation Engine ===
// Handles modified ether generation at cycle start based on mortal effects

import { Player, GameState, GameLogEntry } from '@/types/game';

interface EtherGenerationResult {
  updatedPlayers: Player[];
  logs: GameLogEntry[];
}

/**
 * Calculate ether generation for all players at cycle start.
 * 
 * Special mortal effects:
 * - DIA-01 (Alcyon): Generates 0 instead of 3 if owner has 3+ metamorphosed mortals
 * - DIA-04 (Deux serpents): Generates +1 per enemy god at cycle start
 * - NEP-04 (Ecueil): Generates +1 per mineral mortal metamorphosed in the entire game
 * - CER-02 (Bêtes sauvages): Generates 1 per own Animal mortal non-incapacitated
 * - CER-04 (Lac): Own vegetal mortals generate +1
 */
export function calculateCycleEtherGeneration(
  gameState: GameState
): EtherGenerationResult {
  const logs: GameLogEntry[] = [];
  const enemyCount = gameState.players.length - 1;
  const stolenFromEnemy: { ownerIndex: number; amount: number; mortalName: string }[] = [];

  let updatedPlayers = gameState.players.map((player, playerIdx) => {
    let etherGain = 0;
    const bonusDetails: string[] = [];

    // Check if CER-04 (Lac) is active for this player
    const lacActive = player.mortals.some(
      m => m.code === 'CER-04' && m.isMetamorphosed && m.status !== 'incapacite'
    );

    for (const mortal of player.mortals) {
      if (mortal.status === 'incapacite') continue;
      if (mortal.status === 'retired') continue;

      if (mortal.isMetamorphosed) {
        let production = mortal.etherProduction;

        // DIA-01 (Alcyon): 0 if 3+ metamorphosed
        if (mortal.code === 'DIA-01') {
          const metamorphosedCount = player.mortals.filter(m => m.isMetamorphosed).length;
          if (metamorphosedCount >= 3) {
            production = 0;
            bonusDetails.push('Alcyon: 0 (3+ métamorphosés)');
          }
        }

        // DIA-04 (Deux serpents): +1 per enemy god
        if (mortal.code === 'DIA-04') {
          production += enemyCount;
          if (enemyCount > 0) {
            bonusDetails.push(`Deux serpents: +${enemyCount} (${enemyCount} ennemis)`);
          }
        }

        // NEP-04 (Ecueil): +1 per mineral metamorphosed in entire game
        if (mortal.code === 'NEP-04') {
          let mineralCount = 0;
          for (const p of gameState.players) {
            for (const m of p.mortals) {
              if (m.isMetamorphosed && m.type === 'mineral' && m.status !== 'incapacite' && m.id !== mortal.id) {
                mineralCount++;
              }
            }
          }
          production += mineralCount;
          if (mineralCount > 0) {
            bonusDetails.push(`Ecueil: +${mineralCount} (${mineralCount} minéraux)`);
          }
        }

        // CER-02 (Bêtes sauvages): 1 per own Animal non-incapacitated
        if (mortal.code === 'CER-02') {
          const animalCount = player.mortals.filter(
            m => m.type === 'animal' && m.isMetamorphosed && m.status !== 'incapacite' && m.id !== mortal.id
          ).length;
          production = animalCount; // Replaces base production
          if (animalCount > 0) {
            bonusDetails.push(`Bêtes sauvages: ${animalCount} (${animalCount} animaux)`);
          }
        }

        // MIN-03 (Perdrie): ether is stolen from richest enemy god instead of generated
        if (mortal.code === 'MIN-03' && production > 0) {
          stolenFromEnemy.push({ ownerIndex: playerIdx, amount: production, mortalName: mortal.nameVerso });
          bonusDetails.push(`Perdrie: vole ${production} Éther`);
        } else {
          // CER-04 (Lac) bonus: vegetal mortals +1 (not Lac itself)
          if (lacActive && mortal.type === 'vegetal' && mortal.code !== 'CER-04') {
            production += 1;
          }
          etherGain += production;
        }
      } else {
        // Non-metamorphosed: base recto production (2)
        etherGain += mortal.etherProductionRecto;
      }
    }

    if (bonusDetails.length > 0) {
      logs.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        playerName: player.name,
        action: 'Effets de génération',
        detail: bonusDetails.join(' | '),
      });
    }

    return { ...player, ether: player.ether + etherGain };
  });

  return { updatedPlayers, logs };
}

/**
 * Get the effective ether production displayed for a mortal (for UI).
 * Takes into account conditional effects like DIA-01, DIA-04, NEP-04, CER-02, CER-04.
 */
export function getEffectiveEtherProduction(
  mortal: import('@/types/game').Mortal,
  owner: Player,
  gameState: GameState
): number {
  if (!mortal.isMetamorphosed) return mortal.etherProductionRecto;
  if (mortal.status === 'incapacite' || mortal.status === 'retired') return 0;

  let production = mortal.etherProduction;

  // DIA-01 (Alcyon): 0 if 3+ metamorphosed
  if (mortal.code === 'DIA-01') {
    const metamorphosedCount = owner.mortals.filter(m => m.isMetamorphosed).length;
    if (metamorphosedCount >= 3) return 0;
  }

  // DIA-04 (Deux serpents): +1 per enemy god
  if (mortal.code === 'DIA-04') {
    production += gameState.players.length - 1;
  }

  // NEP-04 (Ecueil): +1 per mineral metamorphosed
  if (mortal.code === 'NEP-04') {
    let mineralCount = 0;
    for (const p of gameState.players) {
      for (const m of p.mortals) {
        if (m.isMetamorphosed && m.type === 'mineral' && m.status !== 'incapacite' && m.id !== mortal.id) {
          mineralCount++;
        }
      }
    }
    production += mineralCount;
  }

  // CER-02 (Bêtes sauvages): 1 per own Animal non-incapacitated
  if (mortal.code === 'CER-02') {
    production = owner.mortals.filter(
      m => m.type === 'animal' && m.isMetamorphosed && m.status !== 'incapacite' && m.id !== mortal.id
    ).length;
  }

  // CER-04 (Lac) bonus for vegetal mortals
  if (mortal.type === 'vegetal' && mortal.code !== 'CER-04') {
    const lacActive = owner.mortals.some(
      m => m.code === 'CER-04' && m.isMetamorphosed && m.status !== 'incapacite'
    );
    if (lacActive) production += 1;
  }

  return production;
}
