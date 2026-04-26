// === Metamorphose Effects Engine ===
// Determines what effect triggers when a mortal is metamorphosed
// and what targeting/interaction is needed.

import { Mortal, Player, GameState } from '@/types/game';
import { canBeIncapacitated, canBeRemovedFromGame } from './mortalStatuses';
import { generateUUID } from '@/lib/uuid';

const crypto = { randomUUID: generateUUID } as const;

export type EffectTargetType =
  | 'enemy_mortal_incapacitate'    // Select an enemy mortal to incapacitate
  | 'enemy_mortal_remove'          // Select an enemy metamorphosed mortal to remove from game
  | 'mortal_heal'                  // Select an incapacitated mortal to heal
  | 'retro_own_mortal'             // Select one of your own metamorphosed mortals to retrometamorphose
  | 'retro_enemy_mortal'           // Select an enemy metamorphosed mortal to retrometamorphose
  | 'generate_destroy_ether'       // Generate X ether then click enemy reservoirs to destroy Y
  | 'steal_ether_each_god'         // Steal up to N ether from each enemy god
  | 'steal_ether_total'            // Steal N ether total from any combination of enemies
  | 'steal_card_from_god'          // Select a god then steal one card from their hand
  | 'metamorphose_extra'           // Pick own mortal to metamorphose at extra cost
  | 'move_incapacitations'         // Move incapacitations from one mortal to another
  | 'choice'                       // Player must choose between multiple sub-effects
  | 'select_god_discard_all'       // Select a god who discards all cards
  | 'discard_cards_then_effect'    // Discard N cards (hand+reactions) then chain effect
  | 'pay_draw_discard'             // Pay ether, draw cards, discard cards
  | 'discard_own_reaction_then_enemy' // Discard own reaction, then enemy discards one
  | 'select_from_discard'          // Select a card from the discard pile
  | 'select_enemy_god'             // Select an enemy god for a targeted effect
  | 'play_spell_at_discount'       // Pick a spell from hand to play at reduced cost
  | 'pay_multiple_enemy_discard'   // Pay a multiple of N ether, each enemy discards that many cards
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
  etherStealTotal?: number;
  // For metamorphose_extra
  extraMetamorphoseCostAdded?: number;
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
  // For play_spell_at_discount
  spellDiscount?: number;
  // If set, cancelling this effect refunds the spell that triggered it
  // (returns the card to the player's hand, refunds ether, removes it from discard)
  spellRefund?: { cardId: string; cost: number };
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

    // APO-01 (Mydas Âne): Target god can't draw next turn
    case 'APO-01':
      return {
        effectId: crypto.randomUUID(),
        type: 'select_enemy_god',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Le dieu ennemi désigné ne pourra en aucune façon piocher lors de son prochain tour.',
        maxTargets: 1,
      };

    // APO-02 (Memnonides): Discard up to 2 cards to incapacitate up to 2 enemy mortals
    case 'APO-02': {
      const hasCards = player.hand.length + player.reactions.length > 0;
      const hasIncapTarget = gameState.players.some((p, i) =>
        i !== playerIndex && p.mortals.some(m => canBeIncapacitated(m, p, gameState))
      );
      if (!hasCards || !hasIncapTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Défaussez jusqu\'à 2 cartes pour incapaciter jusqu\'à 2 mortels ennemis.',
          maxTargets: 0,
          conditionNotMet: !hasCards ? 'Aucune carte à défausser !' : 'Aucune cible possible !',
          optional: true,
        };
      }
      const maxDiscard = Math.min(2, player.hand.length + player.reactions.length);
      const choices: PendingEffect['choices'] = [];
      choices.push({
        label: 'Ne rien défausser',
        effect: { effectId: crypto.randomUUID(), type: 'none', sourcePlayerIndex: playerIndex, sourceMortalCode: mortal.code, sourceMortalName: mortal.nameVerso, description: 'Pas d\'effet.', maxTargets: 0 },
      });
      if (maxDiscard >= 1) {
        choices.push({
          label: 'Défausser 1 → Incapaciter 1',
          effect: { effectId: crypto.randomUUID(), type: 'discard_cards_then_effect', sourcePlayerIndex: playerIndex, sourceMortalCode: mortal.code, sourceMortalName: mortal.nameVerso, description: 'Défaussez 1 carte.', maxTargets: 0, cardsToDiscard: 1, includeReactions: true, thenEffect: { effectId: crypto.randomUUID(), type: 'enemy_mortal_incapacitate', sourcePlayerIndex: playerIndex, sourceMortalCode: mortal.code, sourceMortalName: mortal.nameVerso, description: 'Incapacitez 1 mortel ennemi.', maxTargets: 1 } },
        });
      }
      if (maxDiscard >= 2) {
        choices.push({
          label: 'Défausser 2 → Incapaciter 2',
          effect: { effectId: crypto.randomUUID(), type: 'discard_cards_then_effect', sourcePlayerIndex: playerIndex, sourceMortalCode: mortal.code, sourceMortalName: mortal.nameVerso, description: 'Défaussez 2 cartes.', maxTargets: 0, cardsToDiscard: 2, includeReactions: true, thenEffect: { effectId: crypto.randomUUID(), type: 'enemy_mortal_incapacitate', sourcePlayerIndex: playerIndex, sourceMortalCode: mortal.code, sourceMortalName: mortal.nameVerso, description: 'Incapacitez jusqu\'à 2 mortels ennemis.', maxTargets: 2, optional: true } },
        });
      }
      return { effectId: crypto.randomUUID(), type: 'choice', sourcePlayerIndex: playerIndex, sourceMortalCode: mortal.code, sourceMortalName: mortal.nameVerso, description: 'Défaussez jusqu\'à 2 cartes pour incapaciter autant de mortels ennemis.', maxTargets: 0, choices, optional: true };
    }

    // BAC-02 (Dauphins): Optional extra metamorphose at +6 cost
    case 'BAC-02': {
      // Check if player has any non-metamorphosed mortals (other than BAC-02 itself)
      const hasNonMetamorphosed = player.mortals.some(
        m => !m.isMetamorphosed && m.status !== 'retired' && m.status !== 'incapacite' && m.code !== 'BAC-02'
      );
      if (!hasNonMetamorphosed) {
        return null; // No mortal to metamorphose
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'choice',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Voulez-vous métamorphoser un autre mortel en payant 6 Éther de plus que son coût ?',
        maxTargets: 0,
        optional: true,
        choices: [
          {
            label: 'Oui — Métamorphoser un mortel (+6)',
            effect: {
              effectId: crypto.randomUUID(),
              type: 'metamorphose_extra' as EffectTargetType,
              sourcePlayerIndex: playerIndex,
              sourceMortalCode: mortal.code,
              sourceMortalName: mortal.nameVerso,
              description: 'Choisissez un mortel à métamorphoser (coût + 6 Éther).',
              maxTargets: 1,
              extraMetamorphoseCostAdded: 6,
            },
          },
          {
            label: 'Non — Passer',
            effect: {
              effectId: crypto.randomUUID(),
              type: 'none',
              sourcePlayerIndex: playerIndex,
              sourceMortalCode: mortal.code,
              sourceMortalName: mortal.nameVerso,
              description: 'Effet ignoré.',
              maxTargets: 0,
            },
          },
        ],
      };
    }

    // CER-03 (Hiboux): Draw 2, discard 1
    case 'CER-03':
      return {
        effectId: crypto.randomUUID(),
        type: 'pay_draw_discard',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Piochez 2 cartes puis défaussez 1 carte.',
        maxTargets: 0,
        drawCards: 2,
        discardCards: 1,
      };

    // CER-09 (Pivert): Target god can't draw
    case 'CER-09':
      return {
        effectId: crypto.randomUUID(),
        type: 'select_enemy_god',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Le dieu ennemi désigné ne piochera pas au début de son prochain tour.',
        maxTargets: 1,
      };

    // DIA-03 (Atalante/Lion): Target god discards 2 cards + loses 2 ether
    case 'DIA-03':
      return {
        effectId: crypto.randomUUID(),
        type: 'select_enemy_god',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Un dieu ennemi défausse 2 cartes et perd 2 Éther.',
        maxTargets: 1,
      };

    // DIA-06 (Hermaphrodite): Play a spell at -10 cost
    case 'DIA-06': {
      // Check if player has any spells in hand (sortilege type)
      const hasSpells = player.hand.some(c => c.type === 'sortilege');
      if (!hasSpells) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Jouez un sort en réduisant son coût de 10.',
          maxTargets: 0,
          conditionNotMet: 'Aucun sortilège en main !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'choice',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Voulez-vous jouer un sort à coût réduit de 10 ?',
        maxTargets: 0,
        optional: true,
        choices: [
          {
            label: 'Oui — Jouer un sort (-10)',
            effect: {
              effectId: crypto.randomUUID(),
              type: 'play_spell_at_discount' as any,
              sourcePlayerIndex: playerIndex,
              sourceMortalCode: mortal.code,
              sourceMortalName: mortal.nameVerso,
              description: 'Choisissez un sortilège à jouer (coût réduit de 10).',
              maxTargets: 0,
              spellDiscount: 10,
            },
          },
          {
            label: 'Non — Passer',
            effect: {
              effectId: crypto.randomUUID(),
              type: 'none',
              sourcePlayerIndex: playerIndex,
              sourceMortalCode: mortal.code,
              sourceMortalName: mortal.nameVerso,
              description: 'Effet ignoré.',
              maxTargets: 0,
            },
          },
        ],
      };
    }

    // CER-05 (Monstre de Gila): Pay a multiple of 3 ether, each enemy discards that many cards
    case 'CER-05': {
      if (player.ether < 3) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Payez un multiple de 3 Éther pour que chaque dieu ennemi défausse autant de cartes.',
          maxTargets: 0,
          conditionNotMet: 'Pas assez d\'Éther (minimum 3) !',
          optional: true,
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'pay_multiple_enemy_discard' as any,
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Payez un multiple de 3 Éther pour que chaque dieu ennemi défausse autant de cartes.',
        maxTargets: 0,
        optional: true,
      };
    }

    // BAC-03 (Mouettes): Steal 3 ether total + steal a card from a god
    case 'BAC-03': {
      return {
        effectId: crypto.randomUUID(),
        type: 'steal_ether_total' as EffectTargetType,
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Volez 3 Éther de n\'importe quel(s) réservoir(s) ennemi(s).',
        maxTargets: 0,
        etherStealTotal: 3,
        thenEffect: {
          effectId: crypto.randomUUID(),
          type: 'steal_card_from_god' as EffectTargetType,
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Volez une carte à un dieu.',
          maxTargets: 1,
        },
      };
    }

    // BAC-04 (Quatre Colombes): Move up to 4 incapacitations
    case 'BAC-04': {
      const hasIncap = gameState.players.some(p =>
        p.mortals.some(m => m.isMetamorphosed && m.status === 'incapacite')
      );
      if (!hasIncap) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Déplacez jusqu\'à 4 incapacités d\'un mortel à un autre.',
          maxTargets: 0,
          conditionNotMet: 'Aucun mortel incapacité !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'move_incapacitations' as EffectTargetType,
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Déplacez jusqu\'à 4 incapacités d\'un mortel à un autre.',
        maxTargets: 4,
      };
    }

    // BAC-05 (Arbre à Myrrhe): If BAC-08 + BAC-06 metamorphosed, incapacitate up to 2
    case 'BAC-05': {
      const arbresOk = player.mortals.some(
        m => m.code === 'BAC-08' && m.isMetamorphosed && m.status !== 'incapacite'
      );
      const tournesolOk = player.mortals.some(
        m => m.code === 'BAC-06' && m.isMetamorphosed && m.status !== 'incapacite'
      );
      if (!arbresOk || !tournesolOk) return null;

      const hasIncapTarget = gameState.players.some(p =>
        p.mortals.some(m => canBeIncapacitated(m, p, gameState))
      );
      if (!hasIncapTarget) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Incapacitez jusqu\'à 2 mortels.',
          maxTargets: 2,
          conditionNotMet: 'Aucune cible possible !',
        };
      }
      return {
        effectId: crypto.randomUUID(),
        type: 'enemy_mortal_incapacitate',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: 'Incapacitez jusqu\'à 2 mortels.',
        maxTargets: 2,
        optional: true,
      };
    }

    // MIN-01 (Grenouilles): All enemies discard 1 (or 2 if not first + gain ether)
    case 'MIN-01': {
      const isNotFirst = player.metamorphosesThisTurn > 1;
      const cardsPerEnemy = isNotFirst ? 2 : 1;
      return {
        effectId: crypto.randomUUID(),
        type: 'none',
        sourcePlayerIndex: playerIndex,
        sourceMortalCode: mortal.code,
        sourceMortalName: mortal.nameVerso,
        description: isNotFirst
          ? 'Chaque dieu ennemi se défausse de 2 cartes. Vous gagnez autant d\'Éther que de cartes défaussées.'
          : 'Chaque dieu ennemi se défausse d\'une carte.',
        maxTargets: 0,
      };
    }

    // MIN-08 (Ours): If not first metamorphose this turn, remove a metamorphosed mortal from game
    case 'MIN-08': {
      const isNotFirst8 = player.metamorphosesThisTurn > 1;
      if (!isNotFirst8) return null;
      const hasRemoveTarget8 = gameState.players.some(p =>
        p.mortals.some(m => m.isMetamorphosed && canBeRemovedFromGame(m, p, gameState))
      );
      if (!hasRemoveTarget8) {
        return {
          effectId: crypto.randomUUID(),
          type: 'none',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Retirez du jeu un mortel métamorphosé.',
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
        description: 'Retirez du jeu un mortel métamorphosé.',
        maxTargets: 1,
      };
    }

    default:
      return null;
  }
}
