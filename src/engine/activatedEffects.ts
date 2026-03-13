// === Activated Effects Engine ===
// Determines what happens when a player manually activates a metamorphosed mortal's effect.

import { Mortal, Player, GameState } from '@/types/game';
import { PendingEffect } from './metamorphoseEffects';
import { canBeIncapacitated, canBeRetroMetamorphosed, canBeRemovedFromGame } from './mortalStatuses';
import { generateUUID } from '@/lib/uuid';

const crypto = { randomUUID: generateUUID } as const;

/** List of mortal codes that have manually activated effects */
export const ACTIVATABLE_MORTALS = [
  'APO-06', 'VEN-01', 'VEN-09', 'BAC-01', 'BAC-10', 'MIN-02', 'MIN-08',
  'DIA-02', 'DIA-08', 'DIA-10', 'NEP-02', 'NEP-05', 'NEP-06', 'NEP-10',
  'CER-01', 'CER-07', 'CER-10',
];

export function hasActivatedEffect(mortal: Mortal): boolean {
  return ACTIVATABLE_MORTALS.includes(mortal.code);
}

export interface ActivationResult {
  type: 'immediate' | 'pending' | 'error';
  // For immediate: state transformation
  applyState?: (prev: GameState, playerIndex: number) => GameState;
  logMessage?: string;
  // For pending: effect to show + optional pre-apply
  effect?: PendingEffect;
  preApplyState?: (prev: GameState, playerIndex: number) => GameState;
  preLogMessage?: string;
  // Error
  errorMessage?: string;
}

export function getActivatedEffect(
  mortal: Mortal,
  player: Player,
  gameState: GameState
): ActivationResult | null {
  const playerIndex = gameState.players.findIndex(p => p.id === player.id);

  switch (mortal.code) {

    // ===== BAC-10 (Corneille): Retro self → generate 8 ether =====
    case 'BAC-10': {
      return {
        type: 'immediate',
        applyState: (prev, pi) => ({
          ...prev,
          players: prev.players.map((pl, i) => i !== pi ? pl : {
            ...pl,
            ether: pl.ether + 12,
            mortals: pl.mortals.map(m => m.id === mortal.id ? { ...m, isMetamorphosed: false, status: 'normal' as const } : m),
            metamorphosedCount: pl.mortals.filter(m => m.id !== mortal.id && m.isMetamorphosed).length,
          }),
        }),
        logMessage: `a rétromorphosé ${mortal.nameVerso} et généré 12 Éther`,
      };
    }

    // ===== MIN-02 (Hyacinthe): Retro self → extra metamorphosis this turn =====
    case 'MIN-02': {
      return {
        type: 'immediate',
        applyState: (prev, pi) => ({
          ...prev,
          players: prev.players.map((pl, i) => i !== pi ? pl : {
            ...pl,
            mortals: pl.mortals.map(m => m.id === mortal.id ? { ...m, isMetamorphosed: false, status: 'normal' as const } : m),
            metamorphosedCount: pl.mortals.filter(m => m.id !== mortal.id && m.isMetamorphosed).length,
            maxMetamorphosesThisTurn: pl.maxMetamorphosesThisTurn + 1,
          }),
        }),
        logMessage: `a rétromorphosé ${mortal.nameVerso} pour gagner une métamorphose supplémentaire`,
      };
    }

    // ===== CER-10 (Encens): Retro self → take last discard card =====
    case 'CER-10': {
      if (gameState.discardPile.length === 0) {
        return { type: 'error', errorMessage: 'La défausse est vide' };
      }
      const lastCard = gameState.discardPile[0];
      return {
        type: 'immediate',
        applyState: (prev, pi) => ({
          ...prev,
          players: prev.players.map((pl, i) => i !== pi ? pl : {
            ...pl,
            mortals: pl.mortals.map(m => m.id === mortal.id ? { ...m, isMetamorphosed: false, status: 'normal' as const } : m),
            metamorphosedCount: pl.mortals.filter(m => m.id !== mortal.id && m.isMetamorphosed).length,
            hand: [...pl.hand, prev.discardPile[0]],
          }),
          discardPile: prev.discardPile.slice(1),
        }),
        logMessage: `a rétromorphosé ${mortal.nameVerso} et récupéré ${lastCard.name} de la défausse`,
      };
    }

    // ===== CER-01 (Lynx): Retro self → retro enemy mortal =====
    case 'CER-01': {
      const hasTarget = gameState.players.some((p, i) =>
        i !== playerIndex && p.mortals.some(m =>
          m.isMetamorphosed && canBeRetroMetamorphosed(m, p, gameState)
        )
      );
      if (!hasTarget) {
        return { type: 'error', errorMessage: 'Aucun mortel ennemi ne peut être rétromorphosé' };
      }
      return {
        type: 'pending',
        preApplyState: (prev, pi) => ({
          ...prev,
          players: prev.players.map((pl, i) => i !== pi ? pl : {
            ...pl,
            mortals: pl.mortals.map(m => m.id === mortal.id ? { ...m, isMetamorphosed: false, status: 'normal' as const } : m),
            metamorphosedCount: pl.mortals.filter(m => m.id !== mortal.id && m.isMetamorphosed).length,
          }),
        }),
        preLogMessage: `a rétromorphosé ${mortal.nameVerso}`,
        effect: {
          effectId: crypto.randomUUID(),
          type: 'retro_enemy_mortal',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Rétromorphosez un mortel ennemi.',
          maxTargets: 1,
        },
      };
    }

    // ===== DIA-08 (Taureaux): Retire self → generate 3 + destroy 3 =====
    case 'DIA-08': {
      return {
        type: 'pending',
        preApplyState: (prev, pi) => ({
          ...prev,
          players: prev.players.map((pl, i) => i !== pi ? pl : {
            ...pl,
            mortals: pl.mortals.map(m => m.id === mortal.id ? { ...m, status: 'retired' as const } : m),
          }),
        }),
        preLogMessage: `a retiré ${mortal.nameVerso} du jeu`,
        effect: {
          effectId: crypto.randomUUID(),
          type: 'generate_destroy_ether',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Générez 3 Éther et détruisez 3 Éther.',
          maxTargets: 0,
          etherGenerate: 3,
          etherDestroy: 3,
        },
      };
    }

    // ===== MIN-08 (Ours): Retire self + pay 7 → retire enemy metamorphosed mortal =====
    case 'MIN-08': {
      if (player.ether < 7) {
        return { type: 'error', errorMessage: 'Pas assez d\'Éther (7 requis)' };
      }
      const hasRemoveTarget = gameState.players.some((p, i) =>
        i !== playerIndex && p.mortals.some(m =>
          m.isMetamorphosed && canBeRemovedFromGame(m, p, gameState)
        )
      );
      if (!hasRemoveTarget) {
        return { type: 'error', errorMessage: 'Aucun mortel ennemi métamorphosé ne peut être retiré du jeu' };
      }
      return {
        type: 'pending',
        preApplyState: (prev, pi) => ({
          ...prev,
          players: prev.players.map((pl, i) => i !== pi ? pl : {
            ...pl,
            ether: pl.ether - 7,
            mortals: pl.mortals.map(m => m.id === mortal.id ? { ...m, status: 'retired' as const } : m),
          }),
        }),
        preLogMessage: `a retiré ${mortal.nameVerso} du jeu et payé 7 Éther`,
        effect: {
          effectId: crypto.randomUUID(),
          type: 'enemy_mortal_remove',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Retirez du jeu un mortel ennemi déjà métamorphosé.',
          maxTargets: 1,
        },
      };
    }

    // ===== CER-07 (Arbre aux fruits noirs): Pay 9 heal OR pay 14 incapacitate =====
    case 'CER-07': {
      const canAffordHeal = player.ether >= 9;
      const canAffordIncap = player.ether >= 14;
      if (!canAffordHeal && !canAffordIncap) {
        return { type: 'error', errorMessage: 'Pas assez d\'Éther (9 minimum)' };
      }
      const hasHealTarget = gameState.players.some(p =>
        p.mortals.some(m => m.isMetamorphosed && m.status === 'incapacite')
      );
      const hasIncapTarget = gameState.players.some(p =>
        p.mortals.some(m => canBeIncapacitated(m, p, gameState))
      );

      const choices: PendingEffect['choices'] = [];
      if (canAffordHeal && hasHealTarget) {
        choices.push({
          label: 'Lever une incapacité (9 Éther)',
          effect: {
            effectId: crypto.randomUUID(),
            type: 'mortal_heal',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Cliquez sur le mortel dont vous voulez lever l\'incapacité.',
            maxTargets: 1,
            etherCostToActivate: 9,
          },
        });
      }
      if (canAffordIncap && hasIncapTarget) {
        choices.push({
          label: 'Incapaciter un mortel (14 Éther)',
          effect: {
            effectId: crypto.randomUUID(),
            type: 'enemy_mortal_incapacitate',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Cliquez sur le mortel à incapaciter.',
            maxTargets: 1,
            etherCostToActivate: 14,
          },
        });
      }

      if (choices.length === 0) {
        return { type: 'error', errorMessage: 'Aucune cible disponible' };
      }
      if (choices.length === 1) {
        return { type: 'pending', effect: choices[0].effect };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'choice',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Choisissez votre effet.',
          maxTargets: 1,
          choices,
        },
      };
    }

    // ===== APO-06 (Flûte de Pan): Retro own animal → +6 ether + draw 1 =====
    case 'APO-06': {
      const ownAnimals = player.mortals.filter(m =>
        m.id !== mortal.id && m.type === 'animal' && m.isMetamorphosed &&
        canBeRetroMetamorphosed(m, player, gameState)
      );
      if (ownAnimals.length === 0) {
        return { type: 'error', errorMessage: 'Aucun mortel Animal métamorphosé à rétromorphoser' };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'retro_own_mortal',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Rétromorphosez un de vos mortels de type Animal. Vous générerez 6 Éther et piocherez 1 carte.',
          maxTargets: 1,
          filterType: 'animal',
          thenGenerate: 6,
          thenDraw: 1,
        },
      };
    }

    // ===== VEN-01 (Rossignol): Retro own mortal → heal incapacitation =====
    case 'VEN-01': {
      const ownRetroable = player.mortals.filter(m =>
        m.id !== mortal.id && m.isMetamorphosed &&
        canBeRetroMetamorphosed(m, player, gameState)
      );
      if (ownRetroable.length === 0) {
        return { type: 'error', errorMessage: 'Aucun mortel métamorphosé à rétromorphoser' };
      }
      const hasHealTarget = gameState.players.some(p =>
        p.mortals.some(m => m.isMetamorphosed && m.status === 'incapacite')
      );
      if (!hasHealTarget) {
        return { type: 'error', errorMessage: 'Aucun mortel incapacité à guérir' };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'retro_own_mortal',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Rétromorphosez un de vos mortels pour lever une incapacité.',
          maxTargets: 1,
          thenEffect: {
            effectId: crypto.randomUUID(),
            type: 'mortal_heal',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Cliquez sur le mortel dont vous voulez lever l\'incapacité.',
            maxTargets: 1,
          },
        },
      };
    }

    // ===== DIA-02 (Adonis fleur): Retro own mortal → destroy 5 ether =====
    case 'DIA-02': {
      const ownRetroable = player.mortals.filter(m =>
        m.id !== mortal.id && m.isMetamorphosed &&
        canBeRetroMetamorphosed(m, player, gameState)
      );
      if (ownRetroable.length === 0) {
        return { type: 'error', errorMessage: 'Aucun mortel métamorphosé à rétromorphoser' };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'retro_own_mortal',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Rétromorphosez un de vos mortels. Ensuite, détruisez 5 Éther.',
          maxTargets: 1,
          thenEffect: {
            effectId: crypto.randomUUID(),
            type: 'generate_destroy_ether',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Détruisez 5 Éther sur les réservoirs ennemis.',
            maxTargets: 0,
            etherGenerate: 0,
            etherDestroy: 5,
          },
        },
      };
    }

    // ===== BAC-01 (Lycaon): Retro self → target god discards all cards =====
    case 'BAC-01': {
      const hasTarget = gameState.players.some((p, i) =>
        i !== playerIndex && (p.hand.length > 0 || p.reactions.length > 0)
      );
      if (!hasTarget) {
        return { type: 'error', errorMessage: 'Aucun dieu ennemi n\'a de cartes' };
      }
      return {
        type: 'pending',
        preApplyState: (prev, pi) => ({
          ...prev,
          players: prev.players.map((pl, i) => i !== pi ? pl : {
            ...pl,
            mortals: pl.mortals.map(m => m.id === mortal.id ? { ...m, isMetamorphosed: false, status: 'normal' as const } : m),
            metamorphosedCount: pl.mortals.filter(m => m.id !== mortal.id && m.isMetamorphosed).length,
          }),
        }),
        preLogMessage: `a rétromorphosé ${mortal.nameVerso}`,
        effect: {
          effectId: crypto.randomUUID(),
          type: 'select_god_discard_all',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Choisissez un dieu : il défaussera toutes ses cartes (main et réactions).',
          maxTargets: 1,
        },
      };
    }

    // ===== DIA-10 (Héron): Discard 4 cards → retro self + retro enemy =====
    case 'DIA-10': {
      const totalCards = player.hand.length + player.reactions.length;
      if (totalCards < 4) {
        return { type: 'error', errorMessage: `Pas assez de cartes (${totalCards}/4 disponibles)` };
      }
      const hasTarget = gameState.players.some((p, i) =>
        i !== playerIndex && p.mortals.some(m =>
          m.isMetamorphosed && canBeRetroMetamorphosed(m, p, gameState)
        )
      );
      if (!hasTarget) {
        return { type: 'error', errorMessage: 'Aucun mortel ennemi ne peut être rétromorphosé' };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'discard_cards_then_effect',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Défaussez 4 cartes (main ou réactions posées). Ensuite, le Héron et un mortel ennemi seront rétromorphosés.',
          maxTargets: 0,
          cardsToDiscard: 4,
          includeReactions: true,
          retroSelfMortalId: mortal.id,
          thenEffect: {
            effectId: crypto.randomUUID(),
            type: 'retro_enemy_mortal',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Rétromorphosez un mortel ennemi.',
            maxTargets: 1,
          },
        },
      };
    }

    // ===== NEP-02 (Île de Périmèle): Pay 3 → draw 1, discard 1 =====
    case 'NEP-02': {
      if (player.ether < 3) {
        return { type: 'error', errorMessage: 'Pas assez d\'Éther (3 requis)' };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'pay_draw_discard',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Payez 3 Éther, piochez 1 carte, puis défaussez 1 carte.',
          maxTargets: 0,
          etherCostToActivate: 3,
          drawCards: 1,
          discardCards: 1,
        },
      };
    }

    // ===== NEP-05 (Cygne): Pay 6 → draw 1, discard 2, optionally heal =====
    case 'NEP-05': {
      if (player.ether < 6) {
        return { type: 'error', errorMessage: 'Pas assez d\'Éther (6 requis)' };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'pay_draw_discard',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Payez 6 Éther, piochez 1 carte, défaussez 2 cartes. Ensuite, vous pourrez lever une incapacité.',
          maxTargets: 0,
          etherCostToActivate: 6,
          drawCards: 1,
          discardCards: 2,
          thenEffect: {
            effectId: crypto.randomUUID(),
            type: 'mortal_heal',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Vous pouvez lever une incapacité.',
            maxTargets: 1,
            optional: true,
          },
        },
      };
    }

    // ===== NEP-06 (Laurier): Discard own reaction → enemy discards reaction =====
    case 'NEP-06': {
      if (player.reactions.length === 0) {
        return { type: 'error', errorMessage: 'Vous n\'avez aucune réaction posée' };
      }
      const enemyHasReaction = gameState.players.some((p, i) =>
        i !== playerIndex && p.reactions.length > 0
      );
      if (!enemyHasReaction) {
        return { type: 'error', errorMessage: 'Aucun dieu ennemi n\'a de réaction posée' };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'discard_own_reaction_then_enemy',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Défaussez une de vos réactions, puis un dieu ennemi défaussera une réaction.',
          maxTargets: 0,
        },
      };
    }

    // ===== NEP-10 (Leucothée et Palémon): Discard 7 cards → incapacitate =====
    case 'NEP-10': {
      const totalCards = player.hand.length + player.reactions.length;
      if (totalCards < 7) {
        return { type: 'error', errorMessage: `Pas assez de cartes (${totalCards}/7 disponibles)` };
      }
      const hasIncapTarget = gameState.players.some(p =>
        p.mortals.some(m => canBeIncapacitated(m, p, gameState))
      );
      if (!hasIncapTarget) {
        return { type: 'error', errorMessage: 'Aucun mortel ne peut être incapacité' };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'discard_cards_then_effect',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Défaussez 7 cartes (main ou réactions posées). Ensuite, incapacitez un mortel.',
          maxTargets: 0,
          cardsToDiscard: 7,
          includeReactions: true,
          thenEffect: {
            effectId: crypto.randomUUID(),
            type: 'enemy_mortal_incapacitate',
            sourcePlayerIndex: playerIndex,
            sourceMortalCode: mortal.code,
            sourceMortalName: mortal.nameVerso,
            description: 'Incapacitez un mortel.',
            maxTargets: 1,
          },
        },
      };
    }

    // ===== VEN-04 (Oiseaux): Passive, always active =====
    case 'VEN-04': {
      return { type: 'error', errorMessage: 'Cet effet est passif et toujours actif tant que les Oiseaux sont métamorphosés' };
    }

    // ===== VEN-09 (Pins): Discard 2 cards → generate 1 ether (repeatable) =====
    case 'VEN-09': {
      const totalCards = player.hand.length + player.reactions.length;
      if (totalCards < 2) {
        return { type: 'error', errorMessage: `Pas assez de cartes (${totalCards}/2 disponibles)` };
      }
      return {
        type: 'pending',
        effect: {
          effectId: crypto.randomUUID(),
          type: 'discard_cards_then_effect',
          sourcePlayerIndex: playerIndex,
          sourceMortalCode: mortal.code,
          sourceMortalName: mortal.nameVerso,
          description: 'Défaussez 2 cartes pour générer 1 Éther.',
          maxTargets: 0,
          cardsToDiscard: 2,
          includeReactions: true,
          thenGenerate: 1,
        },
      };
    }

    default:
      return null;
  }
}
