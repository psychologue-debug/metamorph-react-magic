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
    const mortalContributions: string[] = [];

    // Check if CER-04 (Lac) is active for this player
    const lacActive = player.mortals.some(
      m => m.code === 'CER-04' && m.isMetamorphosed && m.status !== 'incapacite'
    );

    for (const mortal of player.mortals) {
      if (mortal.status === 'incapacite') {
        mortalContributions.push(`${mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto}: 0 (incapacité)`);
        continue;
      }
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

        // DIA-04 (Deux serpents): always generates 3 for Diane
        // (enemies each get +1, handled separately after main loop)
        if (mortal.code === 'DIA-04') {
          production = 3;
          bonusDetails.push(`Deux serpents: 3 (fixe) + 1 par ennemi`);
        }

        // NEP-04 (Ecueil): +1 per mineral metamorphosed in entire game (incapacitated count too)
        if (mortal.code === 'NEP-04') {
          let mineralCount = 0;
          for (const p of gameState.players) {
            for (const m of p.mortals) {
              if (m.isMetamorphosed && m.type === 'mineral' && m.id !== mortal.id) {
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
          mortalContributions.push(`${mortal.nameVerso}: vole ${production}`);
          bonusDetails.push(`Perdrie: vole ${production} Éther`);
        } else {
          // CER-04 (Lac) bonus: vegetal mortals +1 (not Lac itself)
          if (lacActive && mortal.type === 'vegetal' && mortal.code !== 'CER-04') {
            production += 1;
          }
          mortalContributions.push(`${mortal.nameVerso}: ${production}`);
          etherGain += production;
        }
      } else {
        // Non-metamorphosed: base recto production (2)
        mortalContributions.push(`${mortal.nameRecto}: ${mortal.etherProductionRecto}`);
        etherGain += mortal.etherProductionRecto;
      }
    }

    // Log per-mortal contributions
    logs.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      playerName: player.name,
      action: 'Génération cycle',
      detail: `+${etherGain} Éther — ${mortalContributions.join(', ')}`,
    });

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

  // DIA-04 (Deux serpents): give +1 ether to each enemy god
  for (let pIdx = 0; pIdx < updatedPlayers.length; pIdx++) {
    const p = updatedPlayers[pIdx];
    const hasDIA04 = p.mortals.some(
      m => m.code === 'DIA-04' && m.isMetamorphosed && m.status !== 'incapacite'
    );
    if (hasDIA04) {
      updatedPlayers = updatedPlayers.map((ep, i) => {
        if (i === pIdx) return ep;
        return { ...ep, ether: ep.ether + 1 };
      });
      logs.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        playerName: 'Système',
        action: 'Deux serpents',
        detail: `Chaque dieu ennemi reçoit +1 Éther (compensation)`,
      });
    }
  }

  // MIN-03 (Perdrie): steal ether from richest enemy god
  for (const steal of stolenFromEnemy) {
    // Find richest enemy
    let richestIdx = -1;
    let richestEther = -1;
    for (let i = 0; i < updatedPlayers.length; i++) {
      if (i === steal.ownerIndex) continue;
      if (updatedPlayers[i].ether > richestEther) {
        richestEther = updatedPlayers[i].ether;
        richestIdx = i;
      }
    }
    if (richestIdx >= 0) {
      const actualSteal = Math.min(steal.amount, updatedPlayers[richestIdx].ether);
      if (actualSteal > 0) {
        updatedPlayers = updatedPlayers.map((p, i) => {
          if (i === steal.ownerIndex) return { ...p, ether: p.ether + actualSteal };
          if (i === richestIdx) return { ...p, ether: p.ether - actualSteal };
          return p;
        });
        logs.push({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          playerName: updatedPlayers[steal.ownerIndex].name,
          action: steal.mortalName,
          detail: `a volé ${actualSteal} Éther à ${updatedPlayers[richestIdx].name}`,
        });
      }
    }
  }

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

  // DIA-04 (Deux serpents): always generates 3 for Diane
  if (mortal.code === 'DIA-04') {
    production = 3;
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
