// === Metamorphose Effects Engine ===
// Determines what effect triggers when a mortal is metamorphosed
// and what targeting/interaction is needed.

import { Mortal, Player, GameState } from '@/types/game';
import { canBeIncapacitated, canBeRemovedFromGame } from './mortalStatuses';

export type EffectTargetType =
  | 'enemy_mortal_incapacitate'    // Select an enemy mortal to incapacitate
  | 'enemy_mortal_remove'          // Select an enemy metamorphosed mortal to remove from game
  | 'mortal_heal'                  // Select an incapacitated mortal to heal
  | 'retro_own_mortal'             // Select one of your own metamorphosed mortals to retrometamorphose
  | 'retro_enemy_mortal'           // Select an enemy metamorphosed mortal to retrometamorphose
  | 'generate_destroy_ether'       // Generate X ether then click enemy reservoirs to destroy Y
  | 'steal_ether_each_god'         // Steal up to N ether from each enemy god
  | 'choice'                       // Player must choose between multiple sub-effects
  | 'select_god_discard_all'       // Select a god who discards all cards
  | 'discard_cards_then_effect'    // Discard N cards (hand+reactions) then chain effect
  | 'pay_draw_discard'             // Pay ether, draw cards, discard cards
  | 'discard_own_reaction_then_enemy' // Discard own reaction, then enemy discards one
  | 'select_from_discard'          // Select a card from the discard pile
  | 'select_enemy_god'             // Select an enemy god for a targeted effect
  | 'none';                        // No targeting needed / no effect

export interface PendingEffect {
  effectId: string;
  type: EffectTargetType;
  sourcePlayerIndex: number;
  sourceMortalCode: string;
  sourceMortalName: string;
  description: string;
  // For incapacitate/remove targeting
  maxTargets: number;
  // For ether effects
  etherGenerate?: number;
  etherDestroy?: number;
  etherStealPerGod?: number;
  // Whether the effect is optional (player can skip)
  optional?: boolean;
  // Condition description (shown when effect can't fire)
  conditionNotMet?: string;
  // For choice effects: sub-options the player can pick
  choices?: { label: string; effect: PendingEffect }[];
  // Whether healing targets own mortals only
  healOwnOnly?: boolean;
  // === Activation system fields ===
  // Chain another effect after this one resolves
  thenEffect?: PendingEffect;
  // Pay ether when this effect activates
  etherCostToActivate?: number;
  // Filter for retro_own_mortal (e.g. 'animal')
  filterType?: string;
  // Generate ether after retro resolves
  thenGenerate?: number;
  // Draw cards after retro resolves
  thenDraw?: number;
  // For discard_cards_then_effect: how many cards to discard
  cardsToDiscard?: number;
  // Can discard from reactions too
  includeReactions?: boolean;
  // Also retro this mortal (by id) as part of effect
  retroSelfMortalId?: string;
  // For pay_draw_discard
  drawCards?: number;
  discardCards?: number;
  fromMetamorphose?: boolean;
}

/**
 * Determine what effect triggers when a mortal is metamorphosed.
 * Returns null if no effect or PendingEffect if interaction is needed.
 */
export function getMetamorphoseEffect(
  mortal: Mortal,
  player: Player,
  gameState: GameState
): PendingEffect | null {
  if (!mortal.effectOnMetamorphose) return null;

  const playerIndex = gameState.players.findIndex(p => p.id === player.id);

  switch (mortal.code) {
    // APO-03 (Épervier): Generate 7 ether, destroy 3
    case 'APO-03':
      return {
        effectId: crypto.randomUUID(),
        type: 'generate_destroy_ether',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Générez 7 Éther. Détruisez 3 Éther sur les réservoirs ennemis.',
        maxTargets: 0,
        etherGenerate: 7,
        etherDestroy: 3,
      };

    // APO-04 (Serpent doré): Steal up to 4 ether from each god
    case 'APO-04':
      return {
        effectId: crypto.randomUUID(),
        type: 'steal_ether_each_god',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Volez jusqu\'à 4 Éther à chaque Dieu ennemi.',
        maxTargets: 0,
        etherStealPerGod: 4,
      };

    // VEN-10 (Statue d'Anaxarète): Incapacitate an enemy mortal
    case 'VEN-10': {
      const hasValidTarget = gameState.players.some((p, i) =>
        i !== playerIndex && p.mortals.some(m =>
          canBeIncapacitated(m, p, gameState)
        )
      );
      if (!hasValidTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Incapacitez un mortel ennemi.',
          maxTargets: 1,
          conditionNotMet: 'Aucune cible possible !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'enemy_mortal_incapacitate',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Incapacitez un mortel ennemi.',
        maxTargets: 1,
      };
    }

    // BAC-06 (Tournesol): If BAC-08 (Arbres) is metamorphosed, choose: incapacitate OR heal
    case 'BAC-06': {
      const arbresMetamorphosed = player.mortals.some(
        m => m.code === 'BAC-08' && m.isMetamorphosed && m.status !== 'incapacite'
      );
      if (!arbresMetamorphosed) return null; // Condition not met

      const hasIncapTarget = gameState.players.some(p =>
        p.mortals.some(m => canBeIncapacitated(m, p, gameState))
      );
      const hasHealTarget = gameState.players.some(p =>
        p.mortals.some(m => m.isMetamorphosed && m.status === 'incapacite')
      );

      if (!hasIncapTarget && !hasHealTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Aucune cible possible.',
          maxTargets: 1,
          conditionNotMet: 'Aucune cible possible !',
        };
      }

      const choices: PendingEffect['choices'] = [];
      if (hasIncapTarget) {
        choices.push({
          label: 'Incapaciter un mortel',
          effect: {
            effectId: crypto.randomUUID(),
            type: 'enemy_mortal_incapacitate',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Cliquez sur le mortel à incapaciter.',
            maxTargets: 1,
          },
        });
      }
      if (hasHealTarget) {
        choices.push({
          label: 'Lever une incapacité',
          effect: {
            effectId: crypto.randomUUID(),
            type: 'mortal_heal',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Cliquez sur le mortel dont vous voulez lever l\'incapacité.',
            maxTargets: 1,
          },
        });
      }

      // If only one option, skip choice
      if (choices.length === 1) return choices[0].effect;

      return {
        effectId: crypto.randomUUID(),
        type: 'choice',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Choisissez entre incapaciter un mortel ou lever une incapacité.',
        maxTargets: 1,
        choices,
      };
    }

    // BAC-07 (Statue de Battus): Incapacitate a mortal (any)
    case 'BAC-07': {
      const hasTarget = gameState.players.some(p =>
        p.mortals.some(m => canBeIncapacitated(m, p, gameState))
      );
      if (!hasTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Incapacitez un mortel.',
          maxTargets: 1,
          conditionNotMet: 'Aucune cible possible !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'enemy_mortal_incapacitate',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Incapacitez un mortel.',
        maxTargets: 1,
      };
    }

    // NEP-07 (Monstre marin): Remove a metamorphosed mortal from game
    case 'NEP-07': {
      const hasRemoveTarget = gameState.players.some(p =>
        p.mortals.some(m =>
          m.isMetamorphosed && canBeRemovedFromGame(m, p, gameState)
        )
      );
      if (!hasRemoveTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Retirez du jeu un mortel déjà métamorphosé.',
          maxTargets: 1,
          conditionNotMet: 'Aucune cible possible !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'enemy_mortal_remove',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Retirez du jeu un mortel déjà métamorphosé.',
        maxTargets: 1,
      };
    }

    // VEN-06 (Biche): If VEN-07 (Cerf) is metamorphosed, remove enemy metamorphosed mortal
    case 'VEN-06': {
      const cerfMetamorphosed = player.mortals.some(
        m => m.code === 'VEN-07' && m.isMetamorphosed && m.status !== 'incapacite'
      );
      if (!cerfMetamorphosed) return null; // Condition not met, no effect
      const hasRemoveTarget = gameState.players.some((p, i) =>
        i !== playerIndex && p.mortals.some(m =>
          m.isMetamorphosed && canBeRemovedFromGame(m, p, gameState)
        )
      );
      if (!hasRemoveTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Retirez du jeu un mortel ennemi déjà métamorphosé.',
          maxTargets: 1,
          conditionNotMet: 'Aucune cible possible !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'enemy_mortal_remove',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Retirez du jeu un mortel ennemi déjà métamorphosé.',
        maxTargets: 1,
        optional: true,
      };
    }

    // VEN-07 (Cerf): If VEN-06 (Biche) is metamorphosed, remove enemy metamorphosed mortal
    case 'VEN-07': {
      const bicheMetamorphosed = player.mortals.some(
        m => m.code === 'VEN-06' && m.isMetamorphosed && m.status !== 'incapacite'
      );
      if (!bicheMetamorphosed) return null;
      const hasRemoveTarget = gameState.players.some((p, i) =>
        i !== playerIndex && p.mortals.some(m =>
          m.isMetamorphosed && canBeRemovedFromGame(m, p, gameState)
        )
      );
      if (!hasRemoveTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Retirez du jeu un mortel ennemi déjà métamorphosé.',
          maxTargets: 1,
          conditionNotMet: 'Aucune cible possible !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'enemy_mortal_remove',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Retirez du jeu un mortel ennemi déjà métamorphosé.',
        maxTargets: 1,
        optional: true,
      };
    }

    // NEP-08 (Aigle): Destroy 4 ether
    case 'NEP-08':
      return {
        effectId: crypto.randomUUID(),
        type: 'generate_destroy_ether',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Détruisez 4 Éther sur les réservoirs ennemis.',
        maxTargets: 0,
        etherGenerate: 0,
        etherDestroy: 4,
      };

    // MIN-10 (Statue de Aglaure): Incapacitate 1 enemy mortal (or 2 if not first metamorphosis this turn)
    case 'MIN-10': {
      const isNotFirst = player.metamorphosesThisTurn > 1; // Already incremented
      const maxTargets = isNotFirst ? 2 : 1;
      const hasValidTarget = gameState.players.some((p, i) =>
        i !== playerIndex && p.mortals.some(m =>
          canBeIncapacitated(m, p, gameState)
        )
      );
      if (!hasValidTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: `Incapacitez ${maxTargets > 1 ? 'jusqu\'à 2 mortels ennemis' : 'un mortel ennemi'}.`,
          maxTargets,
          conditionNotMet: 'Aucune cible possible !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'enemy_mortal_incapacitate',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: `Incapacitez ${maxTargets > 1 ? 'jusqu\'à 2 mortels ennemis' : 'un mortel ennemi'}.`,
        maxTargets,
      };
    }

    // MIN-09 (Chouette de Minerve): Heal one incapacitated mortal (or all own if not first metamorphosis)
    case 'MIN-09': {
      const isNotFirst = player.metamorphosesThisTurn > 1;
      if (isNotFirst) {
        // Heal ALL own incapacitated mortals automatically
        const hasOwnIncap = player.mortals.some(m => m.isMetamorphosed && m.status === 'incapacite');
        if (!hasOwnIncap) {
          // Still try to heal one anywhere
          const hasAnyIncap = gameState.players.some(p =>
            p.mortals.some(m => m.isMetamorphosed && m.status === 'incapacite')
          );
          if (!hasAnyIncap) {
            return {
              effectId: crypto.randomUUID(),
              type: 'none',
              sourcePlayerIndex: playerIndex,
              sourceMortalCode: mortal.code,
              sourceMortalName: mortal.nameVerso,
              description: 'Levez toutes les incapacités de vos mortels.',
              maxTargets: 0,
              conditionNotMet: 'Aucun mortel incapacité !',
            };
          }
        }
        // Auto-heal all own mortals
        return {
          effectId: crypto.randomUUID(),
          type: 'mortal_heal',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Toutes les incapacités de vos mortels sont levées !',
          maxTargets: 99, // All own
          healOwnOnly: true,
          autoHealAll: true,
        } as PendingEffect & { autoHealAll: boolean };
      }

      // First metamorphosis: heal one mortal anywhere
      const hasHealTarget = gameState.players.some(p =>
        p.mortals.some(m => m.isMetamorphosed && m.status === 'incapacite')
      );
      if (!hasHealTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Levez une incapacité.',
          maxTargets: 1,
          conditionNotMet: 'Aucun mortel incapacité !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'mortal_heal',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Cliquez sur le mortel dont vous voulez lever l\'incapacité.',
        maxTargets: 1,
      };
    }

    // DIA-09 (Pierres): Choose: incapacitate 1 mortal OR lift incapacitation OR destroy 4 ether
    case 'DIA-09': {
      const hasIncapTarget = gameState.players.some(p =>
        p.mortals.some(m => canBeIncapacitated(m, p, gameState))
      );
      const hasHealTarget = gameState.players.some(p =>
        p.mortals.some(m => m.isMetamorphosed && m.status === 'incapacite')
      );

      const choices: PendingEffect['choices'] = [];
      if (hasIncapTarget) {
        choices.push({
          label: 'Incapaciter un mortel',
          effect: {
            effectId: crypto.randomUUID(),
            type: 'enemy_mortal_incapacitate',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Cliquez sur le mortel à incapaciter.',
            maxTargets: 1,
          },
        });
      }
      if (hasHealTarget) {
        choices.push({
          label: 'Lever une incapacité',
          effect: {
            effectId: crypto.randomUUID(),
            type: 'mortal_heal',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Cliquez sur le mortel dont vous voulez lever l\'incapacité.',
            maxTargets: 1,
          },
        });
      }
      // Destroy 4 ether is always available (even if enemies have 0)
      choices.push({
        label: 'Détruire 4 Éther',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'generate_destroy_ether',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Détruisez 4 Éther sur les réservoirs ennemis.',
          maxTargets: 0,
          etherGenerate: 0,
          etherDestroy: 4,
        },
      });

      if (choices.length === 1) return choices[0].effect;

      return {
        effectId: crypto.randomUUID(),
        type: 'choice',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Choisissez votre effet.',
        maxTargets: 1,
        choices,
      };
    }

    default:
      return null;
  }
}
