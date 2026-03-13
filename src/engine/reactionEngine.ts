// === Reaction Engine ===
// Validates and resolves reaction card activations during the reaction window.

import { SpellCard, Player, GameState, ReactionTrigger } from '@/types/game';
import { isMortalInvulnerable } from './mortalStatuses';
import { generateUUID } from '@/lib/uuid';

/**
 * Get list of player IDs who have face-down reactions and are not the source player.
 */
export function getEligibleReactors(
  trigger: ReactionTrigger,
  gameState: GameState
): string[] {
  return gameState.players
    .filter(p => p.id !== trigger.sourcePlayerId && p.reactions.length > 0)
    .map(p => p.id);
}

/**
 * Check if a specific reaction card can be activated given the trigger.
 */
export function canActivateReaction(
  card: SpellCard,
  trigger: ReactionTrigger,
  player: Player,
  gameState: GameState
): { valid: boolean; reason?: string } {
  // Règne blocks all reactions EXCEPT Sursis
  if (gameState.reactionsBlocked && card.name !== 'Sursis') {
    return { valid: false, reason: 'Règne est actif : aucune réaction ne peut être jouée' };
  }

  // Check cost
  if (player.ether < card.cost) {
    return { valid: false, reason: `Pas assez d'Éther (coût: ${card.cost}, disponible: ${player.ether})` };
  }

  switch (card.name) {
    case 'Parade': {
      // Trigger must be a metamorphosis AND the mortal must have an on-metamorphose effect
      if (trigger.type !== 'metamorphose') {
        return { valid: false, reason: 'Parade ne peut réagir qu\'à une métamorphose' };
      }
      // Check if the metamorphosed mortal has an effect
      const targetPlayer = gameState.players.find(p => p.id === trigger.sourcePlayerId);
      const mortal = targetPlayer?.mortals.find(m => m.id === trigger.targetMortalId);
      if (!mortal?.effectOnMetamorphose) {
        return { valid: false, reason: 'Ce mortel n\'a pas d\'effet de métamorphose à bloquer' };
      }
      return { valid: true };
    }

    case 'Résistance': {
      // Trigger must be a metamorphosis by an enemy
      if (trigger.type !== 'metamorphose') {
        return { valid: false, reason: 'Résistance ne peut réagir qu\'à une métamorphose' };
      }
      if (trigger.sourcePlayerId === player.id) {
        return { valid: false, reason: 'Résistance ne peut cibler que des métamorphoses ennemies' };
      }
      return { valid: true };
    }

    case 'Compassion': {
      // Trigger must target one of this player's mortals
      if (trigger.type !== 'spell_effect' && trigger.type !== 'mortal_effect') {
        return { valid: false, reason: 'Compassion protège contre les effets ennemis ciblant vos mortels' };
      }
      if (trigger.targetPlayerId !== player.id) {
        return { valid: false, reason: 'Aucun de vos mortels n\'est ciblé' };
      }
      return { valid: true };
    }

    case 'Sursis': {
      // Trigger must be metamorphosis of the LAST non-metamorphosed mortal of an enemy
      if (trigger.type !== 'metamorphose') {
        return { valid: false, reason: 'Sursis ne peut réagir qu\'à une métamorphose' };
      }
      if (trigger.sourcePlayerId === player.id) {
        return { valid: false, reason: 'Sursis ne peut cibler que des métamorphoses ennemies' };
      }
      const sourcePlayer = gameState.players.find(p => p.id === trigger.sourcePlayerId);
      if (!sourcePlayer) return { valid: false, reason: 'Joueur introuvable' };
      // Check if this was the last non-metamorphosed mortal
      const nonMetaCount = sourcePlayer.mortals.filter(
        m => !m.isMetamorphosed && m.status !== 'retired'
      ).length;
      if (nonMetaCount > 0) {
        return { valid: false, reason: 'Ce n\'est pas le dernier mortel non-métamorphosé' };
      }
      // Sursis bypasses Règne — already handled above
      return { valid: true };
    }

    default:
      return { valid: false, reason: 'Carte réaction inconnue' };
  }
}

/**
 * Apply the effect of a reaction card on the game state.
 * Returns the updated game state.
 */
export function resolveReaction(
  card: SpellCard,
  trigger: ReactionTrigger,
  reactorPlayer: Player,
  gameState: GameState
): {
  updatedState: GameState;
  blocksMetamorphoseEffect: boolean; // Parade
  cancelsMetamorphose: boolean; // Résistance, Sursis
  blocksSpellEffect: boolean; // Compassion
  logMessage: string;
} {
  let state = { ...gameState };
  let blocksMetamorphoseEffect = false;
  let cancelsMetamorphose = false;
  let blocksSpellEffect = false;
  let logMessage = '';

  // Pay cost and discard the reaction
  state = {
    ...state,
    players: state.players.map(p => {
      if (p.id !== reactorPlayer.id) return p;
      return {
        ...p,
        ether: p.ether - card.cost,
        reactions: p.reactions.filter(c => c.id !== card.id),
      };
    }),
    discardPile: [card, ...state.discardPile],
  };

  switch (card.name) {
    case 'Parade': {
      blocksMetamorphoseEffect = true;
      logMessage = `a joué Parade — l'effet de métamorphose est annulé`;
      break;
    }

    case 'Résistance': {
      cancelsMetamorphose = true;
      // Reverse metamorphosis on the target mortal
      const sourcePlayer = state.players.find(p => p.id === trigger.sourcePlayerId);
      if (sourcePlayer && trigger.targetMortalId) {
        state = {
          ...state,
          players: state.players.map(p => {
            if (p.id !== trigger.sourcePlayerId) return p;
            const updatedMortals = p.mortals.map(m =>
              m.id === trigger.targetMortalId
                ? { ...m, isMetamorphosed: false }
                : m
            );
            return {
              ...p,
              mortals: updatedMortals,
              metamorphosedCount: updatedMortals.filter(m => m.isMetamorphosed).length,
              // Refund metamorphosis cost
              ether: p.ether + (trigger.metamorphoseCost || 0),
            };
          }),
        };
      }
      logMessage = `a joué Résistance — la métamorphose est annulée, coût remboursé`;
      break;
    }

    case 'Compassion': {
      blocksSpellEffect = true;
      logMessage = `a joué Compassion — l'effet ennemi est annulé`;
      break;
    }

    case 'Sursis': {
      cancelsMetamorphose = true;
      // Reverse metamorphosis and set sursisTarget flag
      if (trigger.targetMortalId) {
        state = {
          ...state,
          players: state.players.map(p => {
            if (p.id !== trigger.sourcePlayerId) return p;
            const updatedMortals = p.mortals.map(m =>
              m.id === trigger.targetMortalId
                ? { ...m, isMetamorphosed: false, sursisTarget: true }
                : m
            );
            return {
              ...p,
              mortals: updatedMortals,
              metamorphosedCount: updatedMortals.filter(m => m.isMetamorphosed).length,
              ether: p.ether + (trigger.metamorphoseCost || 0),
            };
          }),
        };
      }
      logMessage = `a joué Sursis — la métamorphose est annulée, le mortel sera métamorphosé au prochain cycle`;
      break;
    }
  }

  return { updatedState: state, blocksMetamorphoseEffect, cancelsMetamorphose, blocksSpellEffect, logMessage };
}
