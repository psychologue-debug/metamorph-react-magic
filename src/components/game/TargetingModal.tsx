import { useState, useEffect } from 'react';
import { GameState, Player, Mortal, SpellCard, DIVINITIES } from '@/types/game';
import { PendingEffect } from '@/engine/metamorphoseEffects';
import { canBeIncapacitated, canBeRemovedFromGame, isMortalInvulnerable } from '@/engine/mortalStatuses';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, X, Minus, Check, Zap } from 'lucide-react';

interface TargetingModalProps {
  effect: PendingEffect;
  gameState: GameState;
  onResolve: (result: TargetingResult) => void;
  onCancel?: () => void;
  onGodDiscard?: (targetPlayerId: string) => void;
  onCardDiscard?: (cardIds: string[]) => void;
  onPayDrawDiscard?: (discardCardIds: string[]) => void;
  onInitiatePayDraw?: () => void;
  onReactionDiscard?: (ownReactionId: string, enemyPlayerId: string, enemyReactionId: string) => void;
  onGlane?: (cardId: string) => void;
  onSelectGod?: (targetPlayerId: string) => void;
  onPlaySpellAtDiscount?: (cardId: string) => void;
  onPayMultipleEnemyDiscard?: (multiplier: number) => void;
  onStealCard?: (targetPlayerId: string, cardId: string) => void;
  onMetamorphoseExtra?: (mortalId: string) => void;
  onMoveIncapacitations?: (moves: { fromMortalId: string; toMortalId: string; fromPlayerId: string; toPlayerId: string }[]) => void;
}

export interface TargetingResult {
  effectId: string;
  type: PendingEffect['type'];
  sourceMortalCode: string;
  // For mortal targeting
  targetMortals?: { playerId: string; mortalId: string }[];
  // For ether destruction
  etherDestroyed?: { playerId: string; amount: number }[];
  // For ether steal
  etherStolen?: { playerId: string; amount: number }[];
}

const TargetingModal = ({ effect, gameState, onResolve, onCancel, onGodDiscard, onCardDiscard, onPayDrawDiscard, onInitiatePayDraw, onReactionDiscard, onGlane, onSelectGod, onPlaySpellAtDiscount, onPayMultipleEnemyDiscard, onStealCard, onMetamorphoseExtra, onMoveIncapacitations }: TargetingModalProps) => {
  // No interaction needed
  if (effect.type === 'none') {
    return (
      <ModalWrapper>
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            {effect.sourceMortalName}
          </h2>
          <p className="text-muted-foreground mb-4">{effect.description}</p>
          <p className="text-lg text-yellow-400 font-display font-semibold mb-6">
            {effect.conditionNotMet}
          </p>
          <button
            className="px-6 py-2 rounded-lg font-display font-semibold"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
            onClick={() => onResolve({ effectId: effect.effectId, type: effect.type, sourceMortalCode: effect.sourceMortalCode })}
          >
            OK
          </button>
        </div>
      </ModalWrapper>
    );
  }

  if (effect.type === 'enemy_mortal_incapacitate' || effect.type === 'enemy_mortal_remove') {
    return (
      <MortalTargetingContent
        effect={effect}
        gameState={gameState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'generate_destroy_ether') {
    return (
      <EtherDestroyContent
        effect={effect}
        gameState={gameState}
        onResolve={onResolve}
      />
    );
  }

  if (effect.type === 'steal_ether_each_god') {
    return (
      <EtherStealContent
        effect={effect}
        gameState={gameState}
        onResolve={onResolve}
      />
    );
  }

  if (effect.type === 'select_god_discard_all' && onGodDiscard) {
    return (
      <GodSelectContent
        effect={effect}
        gameState={gameState}
        onSelect={onGodDiscard}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'discard_cards_then_effect' && onCardDiscard) {
    return (
      <CardDiscardContent
        effect={effect}
        gameState={gameState}
        onConfirm={onCardDiscard}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'pay_draw_discard' && onInitiatePayDraw && onPayDrawDiscard) {
    return (
      <PayDrawDiscardContent
        effect={effect}
        gameState={gameState}
        onInitiate={onInitiatePayDraw}
        onDiscard={onPayDrawDiscard}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'discard_own_reaction_then_enemy' && onReactionDiscard) {
    return (
      <ReactionDiscardContent
        effect={effect}
        gameState={gameState}
        onConfirm={onReactionDiscard}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'select_from_discard' && onGlane) {
    return (
      <SelectFromDiscardContent
        effect={effect}
        gameState={gameState}
        onSelect={onGlane}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'select_enemy_god' && onSelectGod) {
    return (
      <GodSelectContent
        effect={effect}
        gameState={gameState}
        onSelect={onSelectGod}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'play_spell_at_discount' && onPlaySpellAtDiscount) {
    return (
      <SpellDiscountContent
        effect={effect}
        gameState={gameState}
        onSelect={onPlaySpellAtDiscount}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'pay_multiple_enemy_discard' && onPayMultipleEnemyDiscard) {
    return (
      <PayMultipleDiscardContent
        effect={effect}
        gameState={gameState}
        onConfirm={onPayMultipleEnemyDiscard}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'steal_ether_total') {
    return (
      <StealEtherTotalContent
        effect={effect}
        gameState={gameState}
        onResolve={onResolve}
      />
    );
  }

  if (effect.type === 'steal_card_from_god' && onStealCard) {
    return (
      <StealCardFromGodContent
        effect={effect}
        gameState={gameState}
        onSteal={onStealCard}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'metamorphose_extra' && onMetamorphoseExtra) {
    return (
      <MetamorphoseExtraContent
        effect={effect}
        gameState={gameState}
        onSelect={onMetamorphoseExtra}
        onCancel={onCancel}
      />
    );
  }

  if (effect.type === 'move_incapacitations' && onMoveIncapacitations) {
    return (
      <MoveIncapacitationsContent
        effect={effect}
        gameState={gameState}
        onConfirm={onMoveIncapacitations}
      />
    );
  }

  return null;
};

// === Sub-components ===

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />
        <motion.div
          className="relative z-10 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 0 40px hsl(var(--ether) / 0.2)',
          }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MortalTargetingContent({
  effect,
  gameState,
  onResolve,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onResolve: (result: TargetingResult) => void;
  onCancel?: () => void;
}) {
  const [selectedTargets, setSelectedTargets] = useState<{ playerId: string; mortalId: string }[]>([]);
  const isRemove = effect.type === 'enemy_mortal_remove';

  const toggleTarget = (playerId: string, mortalId: string) => {
    const exists = selectedTargets.find(t => t.mortalId === mortalId);
    if (exists) {
      setSelectedTargets(prev => prev.filter(t => t.mortalId !== mortalId));
    } else if (selectedTargets.length < effect.maxTargets) {
      setSelectedTargets(prev => [...prev, { playerId, mortalId }]);
    }
  };

  const isValidTarget = (mortal: Mortal, owner: Player) => {
    if (isRemove) {
      return mortal.isMetamorphosed && canBeRemovedFromGame(mortal, owner, gameState);
    }
    return canBeIncapacitated(mortal, owner, gameState);
  };

  const enemyPlayers = gameState.players.filter((_, i) => i !== effect.sourcePlayerIndex);

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        <p className="text-sm font-display text-foreground mb-3">
          Cliquez sur {effect.maxTargets > 1 ? `jusqu'à ${effect.maxTargets} mortels` : 'un mortel'} :
        </p>

        <div className="space-y-4 mb-6">
          {enemyPlayers.map(enemy => {
            const validMortals = enemy.mortals.filter(m => isValidTarget(m, enemy));
            if (validMortals.length === 0) return null;
            return (
              <div key={enemy.id}>
                <h3 className="font-display text-sm font-semibold text-muted-foreground mb-2">
                  {enemy.name} ({enemy.ether} Éther)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {enemy.mortals.map(mortal => {
                    const valid = isValidTarget(mortal, enemy);
                    const selected = selectedTargets.some(t => t.mortalId === mortal.id);
                    const invulnerable = isMortalInvulnerable(mortal, enemy, gameState);
                    return (
                      <motion.button
                        key={mortal.id}
                        className={`relative rounded-full overflow-hidden border-2 transition-all ${
                          selected ? 'border-ether ring-2 ring-ether/50' :
                          valid ? 'border-border/50 hover:border-ether/50' :
                          'border-border/20 opacity-30 cursor-not-allowed'
                        }`}
                        style={{ width: 64, height: 64 }}
                        onClick={() => valid && toggleTarget(enemy.id, mortal.id)}
                        whileHover={valid ? { scale: 1.1 } : {}}
                        whileTap={valid ? { scale: 0.95 } : {}}
                        disabled={!valid}
                      >
                        <img
                          src={mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto}
                          alt={mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto}
                          className="w-full h-full object-cover"
                        />
                        {invulnerable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Shield className="w-5 h-5 text-yellow-400" />
                          </div>
                        )}
                        {selected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-ether/30">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        )}
                        {mortal.status === 'incapacite' && (
                          <div className="absolute bottom-0 left-0 right-0 text-center text-xs bg-black/60 text-white">⛓️</div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-end">
          {effect.optional && onCancel && (
            <button
              className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={onCancel}
            >
              Passer
            </button>
          )}
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: selectedTargets.length > 0
                ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))'
                : 'hsl(var(--muted))',
              color: selectedTargets.length > 0 ? 'white' : 'hsl(var(--muted-foreground))',
            }}
            whileHover={selectedTargets.length > 0 ? { scale: 1.05 } : {}}
            onClick={() => {
              if (selectedTargets.length === 0) return;
              onResolve({
                effectId: effect.effectId,
                type: effect.type,
                sourceMortalCode: effect.sourceMortalCode,
                targetMortals: selectedTargets,
              });
            }}
            disabled={selectedTargets.length === 0}
          >
            Confirmer
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function EtherDestroyContent({
  effect,
  gameState,
  onResolve,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onResolve: (result: TargetingResult) => void;
}) {
  const totalToDestroy = effect.etherDestroy || 0;
  const [destroyed, setDestroyed] = useState<Record<string, number>>({});
  const totalDestroyed = Object.values(destroyed).reduce((a, b) => a + b, 0);
  const remaining = totalToDestroy - totalDestroyed;

  const enemies = gameState.players.filter((_, i) => i !== effect.sourcePlayerIndex);

  const addDestroy = (playerId: string) => {
    if (remaining <= 0) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    const current = destroyed[playerId] || 0;
    if (current >= player.ether) return;
    setDestroyed(prev => ({ ...prev, [playerId]: current + 1 }));
  };

  const removeDestroy = (playerId: string) => {
    const current = destroyed[playerId] || 0;
    if (current <= 0) return;
    setDestroyed(prev => ({ ...prev, [playerId]: current - 1 }));
  };

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        {(effect.etherGenerate ?? 0) > 0 && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'hsl(var(--ether) / 0.1)', border: '1px solid hsl(var(--ether) / 0.3)' }}>
            <span className="font-display text-ether font-semibold">+{effect.etherGenerate} Éther généré automatiquement</span>
          </div>
        )}

        <p className="text-sm font-display text-foreground mb-3">
          Détruisez {totalToDestroy} Éther — restant : <span className="text-ether font-bold">{remaining}</span>
        </p>

        <div className="space-y-3 mb-6">
          {enemies.map(enemy => (
            <div key={enemy.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'hsl(var(--secondary) / 0.5)' }}>
              <div className="flex-1">
              <span className="font-display font-semibold text-foreground">{enemy.name}</span>
                <span className="text-muted-foreground ml-2">({enemy.ether} Éther — {enemy.metamorphosedCount}/10)</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-border/50"
                  style={{ background: 'hsl(var(--muted))' }}
                  onClick={() => removeDestroy(enemy.id)}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-foreground text-lg">−</span>
                </motion.button>
                <span className="w-8 text-center font-display font-bold text-lg text-foreground">
                  {destroyed[enemy.id] || 0}
                </span>
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-ether/50"
                  style={{ background: remaining > 0 ? 'hsl(var(--ether) / 0.2)' : 'hsl(var(--muted))' }}
                  onClick={() => addDestroy(enemy.id)}
                  whileTap={{ scale: 0.9 }}
                  disabled={remaining <= 0}
                >
                  <span className="text-foreground text-lg">+</span>
                </motion.button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          {remaining > 0 && (
            <span className="text-sm text-muted-foreground font-display">
              Encore {remaining} à répartir
            </span>
          )}
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: totalDestroyed > 0
                ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))'
                : 'hsl(var(--muted))',
              color: totalDestroyed > 0 ? 'white' : 'hsl(var(--muted-foreground))',
            }}
            whileHover={totalDestroyed > 0 ? { scale: 1.05 } : {}}
            onClick={() => {
              const etherDestroyed = Object.entries(destroyed)
                .filter(([_, amount]) => amount > 0)
                .map(([playerId, amount]) => ({ playerId, amount }));
              onResolve({
                effectId: effect.effectId,
                type: effect.type,
                sourceMortalCode: effect.sourceMortalCode,
                etherDestroyed,
              });
            }}
          >
            Détruire{totalDestroyed > 0 ? ` (${totalDestroyed})` : ''}
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function EtherStealContent({
  effect,
  gameState,
  onResolve,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onResolve: (result: TargetingResult) => void;
}) {
  const maxPerGod = effect.etherStealPerGod || 4;
  const [stolen, setStolen] = useState<Record<string, number>>({});

  const enemies = gameState.players.filter((_, i) => i !== effect.sourcePlayerIndex);

  const addSteal = (playerId: string) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    const current = stolen[playerId] || 0;
    if (current >= maxPerGod || current >= player.ether) return;
    setStolen(prev => ({ ...prev, [playerId]: current + 1 }));
  };

  const removeSteal = (playerId: string) => {
    const current = stolen[playerId] || 0;
    if (current <= 0) return;
    setStolen(prev => ({ ...prev, [playerId]: current - 1 }));
  };

  const totalStolen = Object.values(stolen).reduce((a, b) => a + b, 0);

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {enemies.map(enemy => {
            const current = stolen[enemy.id] || 0;
            const maxForThisGod = Math.min(maxPerGod, enemy.ether);
            return (
              <div key={enemy.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'hsl(var(--secondary) / 0.5)' }}>
                <div className="flex-1">
                  <span className="font-display font-semibold text-foreground">{enemy.name}</span>
                  <span className="text-muted-foreground ml-2">({enemy.ether} Éther)</span>
                  <span className="text-xs text-muted-foreground ml-1">max {maxForThisGod}</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-border/50"
                    style={{ background: 'hsl(var(--muted))' }}
                    onClick={() => removeSteal(enemy.id)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="text-foreground text-lg">−</span>
                  </motion.button>
                  <span className="w-8 text-center font-display font-bold text-lg text-foreground">
                    {current}
                  </span>
                  <motion.button
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-ether/50"
                    style={{ background: current < maxForThisGod ? 'hsl(var(--ether) / 0.2)' : 'hsl(var(--muted))' }}
                    onClick={() => addSteal(enemy.id)}
                    whileTap={{ scale: 0.9 }}
                    disabled={current >= maxForThisGod}
                  >
                    <span className="text-foreground text-lg">+</span>
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-display text-ether font-semibold">
            Total volé : +{totalStolen} Éther
          </span>
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
              color: 'white',
            }}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              const etherStolen = Object.entries(stolen)
                .filter(([_, amount]) => amount > 0)
                .map(([playerId, amount]) => ({ playerId, amount }));
              onResolve({
                effectId: effect.effectId,
                type: effect.type,
                sourceMortalCode: effect.sourceMortalCode,
                etherStolen,
              });
            }}
          >
            Confirmer
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// === God Selection (BAC-01 Lycaon) ===
function GodSelectContent({
  effect,
  gameState,
  onSelect,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onSelect: (playerId: string) => void;
  onCancel?: () => void;
}) {
  const enemies = gameState.players.filter((_, i) => i !== effect.sourcePlayerIndex);

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {enemies.map(enemy => {
            const totalCards = enemy.hand.length + enemy.reactions.length;
            const divinity = DIVINITIES[enemy.divinity];
            return (
              <motion.button
                key={enemy.id}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/50 transition-all"
                style={{ background: 'hsl(var(--secondary) / 0.5)' }}
                whileHover={{ scale: 1.02, borderColor: 'hsl(var(--ether) / 0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(enemy.id)}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 overflow-hidden"
                  style={{ borderColor: `hsl(${divinity.color})`, background: `hsl(${divinity.color} / 0.2)` }}
                >
                  {divinity.image ? (
                    <img src={divinity.image} alt={divinity.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-base font-bold text-foreground">{enemy.avatar}</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <span className="font-display font-semibold text-foreground">{enemy.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">({enemy.ether} Éther)</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {onCancel && (
          <div className="flex justify-end">
            <button
              className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={onCancel}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

// === Card Discard Selection (DIA-10, NEP-10) ===
function CardDiscardContent({
  effect,
  gameState,
  onConfirm,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onConfirm: (cardIds: string[]) => void;
  onCancel?: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const player = gameState.players[effect.sourcePlayerIndex];
  const required = effect.cardsToDiscard || 0;
  const includeReactions = effect.includeReactions ?? false;

  const availableCards: (SpellCard & { source: 'hand' | 'reaction' })[] = [
    ...player.hand.map(c => ({ ...c, source: 'hand' as const })),
    ...(includeReactions ? player.reactions.map(c => ({ ...c, source: 'reaction' as const })) : []),
  ];

  const toggleCard = (cardId: string) => {
    if (selectedIds.includes(cardId)) {
      setSelectedIds(prev => prev.filter(id => id !== cardId));
    } else if (selectedIds.length < required) {
      setSelectedIds(prev => [...prev, cardId]);
    }
  };

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        <p className="text-sm font-display text-foreground mb-3">
          Sélectionnez {required} carte(s) — sélectionné : <span className="text-ether font-bold">{selectedIds.length}/{required}</span>
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {availableCards.map(card => {
            const selected = selectedIds.includes(card.id);
            return (
              <motion.button
                key={card.id}
                className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                  selected ? 'border-ether ring-2 ring-ether/30' : 'border-border/50 hover:border-ether/40'
                }`}
                style={{ background: selected ? 'hsl(var(--ether) / 0.1)' : 'hsl(var(--secondary) / 0.5)', minWidth: '140px' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleCard(card.id)}
              >
                <div className="font-display text-sm font-bold text-foreground">{card.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{card.description}</div>
                <div className="text-xs text-muted-foreground/70 italic">{card.source === 'reaction' ? '(Réaction posée)' : '(Main)'}</div>
                {selected && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-4 h-4 text-ether" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={onCancel}
            >
              Annuler
            </button>
          )}
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: selectedIds.length === required
                ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))'
                : 'hsl(var(--muted))',
              color: selectedIds.length === required ? 'white' : 'hsl(var(--muted-foreground))',
            }}
            whileHover={selectedIds.length === required ? { scale: 1.05 } : {}}
            onClick={() => selectedIds.length === required && onConfirm(selectedIds)}
            disabled={selectedIds.length !== required}
          >
            Confirmer
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// === Pay/Draw/Discard (NEP-02, NEP-05) ===
function PayDrawDiscardContent({
  effect,
  gameState,
  onInitiate,
  onDiscard,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onInitiate: () => void;
  onDiscard: (cardIds: string[]) => void;
  onCancel?: () => void;
}) {
  const [phase, setPhase] = useState<'confirm' | 'discard'>('confirm');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const player = gameState.players[effect.sourcePlayerIndex];
  const discardCount = effect.discardCards || 0;

  // After initiating, switch to discard phase
  useEffect(() => {
    if (phase === 'discard') return;
    // We start in confirm phase
  }, [phase]);

  if (phase === 'confirm') {
    return (
      <ModalWrapper>
        <div className="text-center">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <Zap className="w-6 h-6 text-ether" />
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
          </div>
          <p className="text-muted-foreground mb-6">{effect.description}</p>
          <div className="flex gap-3 justify-center">
            {onCancel && (
              <button
                className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
                style={{ background: 'hsl(var(--muted))' }}
                onClick={onCancel}
              >
                Annuler
              </button>
            )}
            <motion.button
              className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
                color: 'white',
              }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                onInitiate();
                setPhase('discard');
              }}
            >
              Payer {effect.etherCostToActivate} Éther et piocher {effect.drawCards} carte(s)
            </motion.button>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  // Discard phase
  const toggleCard = (cardId: string) => {
    if (selectedIds.includes(cardId)) {
      setSelectedIds(prev => prev.filter(id => id !== cardId));
    } else if (selectedIds.length < discardCount) {
      setSelectedIds(prev => [...prev, cardId]);
    }
  };

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">Défaussez {discardCount} carte(s).</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {player.hand.map(card => {
            const selected = selectedIds.includes(card.id);
            return (
              <motion.button
                key={card.id}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selected ? 'border-ether ring-2 ring-ether/30' : 'border-border/50 hover:border-ether/40'
                }`}
                style={{ background: selected ? 'hsl(var(--ether) / 0.1)' : 'hsl(var(--secondary) / 0.5)', minWidth: '140px' }}
                whileHover={{ scale: 1.03 }}
                onClick={() => toggleCard(card.id)}
              >
                <div className="font-display text-sm font-bold text-foreground">{card.name}</div>
                <div className="text-xs text-muted-foreground">{card.description}</div>
                {selected && <Check className="w-4 h-4 text-ether absolute top-1 right-1" />}
              </motion.button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: selectedIds.length === discardCount
                ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))'
                : 'hsl(var(--muted))',
              color: selectedIds.length === discardCount ? 'white' : 'hsl(var(--muted-foreground))',
            }}
            onClick={() => selectedIds.length === discardCount && onDiscard(selectedIds)}
            disabled={selectedIds.length !== discardCount}
          >
            Confirmer la défausse
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// === Reaction Discard (NEP-06 Laurier) ===
function ReactionDiscardContent({
  effect,
  gameState,
  onConfirm,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onConfirm: (ownReactionId: string, enemyPlayerId: string, enemyReactionId: string) => void;
  onCancel?: () => void;
}) {
  const [ownReactionId, setOwnReactionId] = useState<string | null>(null);
  const [enemyTarget, setEnemyTarget] = useState<{ playerId: string; reactionId: string } | null>(null);
  const player = gameState.players[effect.sourcePlayerIndex];
  const enemies = gameState.players.filter((_, i) => i !== effect.sourcePlayerIndex && gameState.players[i].reactions.length > 0);

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        {/* Step 1: Select own reaction */}
        <p className="text-sm font-display text-foreground mb-2 font-semibold">1. Choisissez votre réaction à défausser :</p>
        <div className="flex gap-2 mb-4">
          {player.reactions.map(card => (
            <motion.button
              key={card.id}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                ownReactionId === card.id ? 'border-ether ring-2 ring-ether/30' : 'border-border/50 hover:border-ether/40'
              }`}
              style={{ background: ownReactionId === card.id ? 'hsl(var(--ether) / 0.1)' : 'hsl(var(--secondary) / 0.5)' }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setOwnReactionId(card.id)}
            >
              <div className="font-display text-sm font-bold text-foreground">{card.name}</div>
              <div className="text-xs text-muted-foreground">{card.description}</div>
            </motion.button>
          ))}
        </div>

        {/* Step 2: Select enemy reaction */}
        <p className="text-sm font-display text-foreground mb-2 font-semibold">2. Choisissez la réaction ennemie à défausser :</p>
        <div className="space-y-2 mb-6">
          {enemies.map(enemy => {
            const divinity = DIVINITIES[enemy.divinity];
            return (
              <div key={enemy.id}>
                <span className="font-display text-sm text-muted-foreground">{enemy.name}</span>
                <div className="flex gap-2 mt-1">
                  {enemy.reactions.map((card, idx) => {
                    const selected = enemyTarget?.playerId === enemy.id && enemyTarget?.reactionId === card.id;
                    return (
                      <motion.button
                        key={card.id}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selected ? 'border-reaction ring-2 ring-reaction/30' : 'border-border/50 hover:border-reaction/40'
                        }`}
                        style={{ background: selected ? 'hsl(var(--reaction) / 0.1)' : 'hsl(var(--secondary) / 0.5)' }}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => setEnemyTarget({ playerId: enemy.id, reactionId: card.id })}
                      >
                        <div className="font-display text-sm text-foreground">Réaction {idx + 1}</div>
                        <div className="text-xs text-muted-foreground">(face cachée)</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={onCancel}
            >
              Annuler
            </button>
          )}
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: ownReactionId && enemyTarget
                ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))'
                : 'hsl(var(--muted))',
              color: ownReactionId && enemyTarget ? 'white' : 'hsl(var(--muted-foreground))',
            }}
            whileHover={ownReactionId && enemyTarget ? { scale: 1.05 } : {}}
            onClick={() => ownReactionId && enemyTarget && onConfirm(ownReactionId, enemyTarget.playerId, enemyTarget.reactionId)}
            disabled={!ownReactionId || !enemyTarget}
          >
            Confirmer
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default TargetingModal;

// === Select from discard pile (Glane) ===
function SelectFromDiscardContent({
  effect,
  gameState,
  onSelect,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onSelect: (cardId: string) => void;
  onCancel?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        <p className="text-sm font-display text-foreground mb-3">
          Cliquez sur la carte que vous voulez récupérer :
        </p>

        <div className="flex flex-wrap gap-2 mb-6 max-h-[50vh] overflow-y-auto">
          {gameState.discardPile.map((card, i) => {
            const selected = selectedId === card.id;
            return (
              <motion.button
                key={`${card.id}-${i}`}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selected ? 'border-ether ring-2 ring-ether/30' : 'border-border/50 hover:border-ether/40'
                }`}
                style={{ background: selected ? 'hsl(var(--ether) / 0.1)' : 'hsl(var(--secondary) / 0.5)', minWidth: '140px' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedId(card.id)}
              >
                <div className="font-display text-sm font-bold text-foreground">{card.name}</div>
                <div className="text-xs text-muted-foreground">Coût: {card.cost} | {card.type === 'reaction' ? 'Réaction' : 'Sortilège'}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.description}</div>
                {selected && (
                  <div className="mt-1">
                    <Check className="w-4 h-4 text-ether" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={onCancel}
            >
              Annuler
            </button>
          )}
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: selectedId
                ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))'
                : 'hsl(var(--muted))',
              color: selectedId ? 'white' : 'hsl(var(--muted-foreground))',
            }}
            whileHover={selectedId ? { scale: 1.05 } : {}}
            onClick={() => selectedId && onSelect(selectedId)}
            disabled={!selectedId}
          >
            Confirmer
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// === SpellDiscountContent: Pick a spell from hand to play at reduced cost ===
function SpellDiscountContent({
  effect,
  gameState,
  onSelect,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onSelect: (cardId: string) => void;
  onCancel?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const player = gameState.players[effect.sourcePlayerIndex];
  const discount = effect.spellDiscount || 10;
  const spells = player.hand.filter(c => c.type === 'sortilege');

  return (
    <ModalWrapper>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          {effect.sourceMortalName}
        </h2>
        <p className="text-muted-foreground mb-4">{effect.description}</p>

        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto mb-4">
          {spells.map(card => {
            const reducedCost = Math.max(0, card.cost - discount);
            const canAfford = player.ether >= reducedCost;
            return (
              <motion.button
                key={card.id}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedId === card.id ? 'border-ether ring-1 ring-ether' : 'border-border/50'
                } ${!canAfford ? 'opacity-40' : ''}`}
                style={{ background: 'hsl(var(--card))' }}
                onClick={() => canAfford && setSelectedId(card.id)}
                whileHover={canAfford ? { scale: 1.02 } : {}}
                disabled={!canAfford}
              >
                <div className="font-display font-semibold text-sm text-foreground">{card.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.description}</div>
                <div className="text-xs mt-1">
                  <span className="line-through text-muted-foreground">{card.cost}</span>
                  {' → '}
                  <span className="text-ether font-bold">{reducedCost} Éther</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={onCancel}
            >
              Passer
            </button>
          )}
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: selectedId
                ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))'
                : 'hsl(var(--muted))',
              color: selectedId ? 'white' : 'hsl(var(--muted-foreground))',
            }}
            whileHover={selectedId ? { scale: 1.05 } : {}}
            onClick={() => selectedId && onSelect(selectedId)}
            disabled={!selectedId}
          >
            Jouer ce sort
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// === PayMultipleDiscardContent: Counter to pay multiples of 3 ===
function PayMultipleDiscardContent({
  effect,
  gameState,
  onConfirm,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onConfirm: (multiplier: number) => void;
  onCancel?: () => void;
}) {
  const [multiplier, setMultiplier] = useState(1);
  const player = gameState.players[effect.sourcePlayerIndex];
  const maxMultiplier = Math.floor(player.ether / 3);
  const cost = multiplier * 3;

  return (
    <ModalWrapper>
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          {effect.sourceMortalName}
        </h2>
        <p className="text-muted-foreground mb-4">{effect.description}</p>

        <div className="flex items-center justify-center gap-4 mb-4">
          <motion.button
            className="w-10 h-10 rounded-full flex items-center justify-center border border-border/50 font-bold text-foreground"
            style={{ background: 'hsl(var(--muted))' }}
            onClick={() => setMultiplier(m => Math.max(1, m - 1))}
            whileHover={{ scale: 1.1 }}
            disabled={multiplier <= 1}
          >
            −
          </motion.button>
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-ether">{multiplier}</div>
            <div className="text-sm text-muted-foreground">× 3 = <span className="text-ether font-bold">{cost} Éther</span></div>
          </div>
          <motion.button
            className="w-10 h-10 rounded-full flex items-center justify-center border border-border/50 font-bold text-foreground"
            style={{ background: 'hsl(var(--muted))' }}
            onClick={() => setMultiplier(m => Math.min(maxMultiplier, m + 1))}
            whileHover={{ scale: 1.1 }}
            disabled={multiplier >= maxMultiplier}
          >
            +
          </motion.button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Chaque dieu ennemi défaussera <span className="text-ether font-bold">{multiplier}</span> carte{multiplier > 1 ? 's' : ''}.
        </p>

        <div className="flex gap-3 justify-center">
          {onCancel && (
            <button
              className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={onCancel}
            >
              Passer
            </button>
          )}
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
              color: 'white',
            }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onConfirm(multiplier)}
          >
            Payer {cost} Éther
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// === StealEtherTotalContent: Steal N total ether from any enemies (BAC-03) ===
function StealEtherTotalContent({
  effect,
  gameState,
  onResolve,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onResolve: (result: TargetingResult) => void;
}) {
  const totalToSteal = effect.etherStealTotal || 3;
  const [stolen, setStolen] = useState<Record<string, number>>({});
  const totalStolen = Object.values(stolen).reduce((a, b) => a + b, 0);
  const remaining = totalToSteal - totalStolen;

  const enemies = gameState.players.filter((_, i) => i !== effect.sourcePlayerIndex);

  const addSteal = (playerId: string) => {
    if (remaining <= 0) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    const current = stolen[playerId] || 0;
    if (current >= player.ether) return;
    setStolen(prev => ({ ...prev, [playerId]: current + 1 }));
  };

  const removeSteal = (playerId: string) => {
    const current = stolen[playerId] || 0;
    if (current <= 0) return;
    setStolen(prev => ({ ...prev, [playerId]: current - 1 }));
  };

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        <p className="text-sm font-display text-foreground mb-3">
          Volez {totalToSteal} Éther — restant : <span className="text-ether font-bold">{remaining}</span>
        </p>

        <div className="space-y-3 mb-6">
          {enemies.map(enemy => (
            <div key={enemy.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'hsl(var(--secondary) / 0.5)' }}>
              <div className="flex-1">
                <span className="font-display font-semibold text-foreground">{enemy.name}</span>
                <span className="text-muted-foreground ml-2">({enemy.ether} Éther)</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-border/50"
                  style={{ background: 'hsl(var(--muted))' }}
                  onClick={() => removeSteal(enemy.id)}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-foreground text-lg">−</span>
                </motion.button>
                <span className="w-8 text-center font-display font-bold text-lg text-foreground">
                  {stolen[enemy.id] || 0}
                </span>
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-ether/50"
                  style={{ background: remaining > 0 ? 'hsl(var(--ether) / 0.2)' : 'hsl(var(--muted))' }}
                  onClick={() => addSteal(enemy.id)}
                  whileTap={{ scale: 0.9 }}
                  disabled={remaining <= 0}
                >
                  <span className="text-foreground text-lg">+</span>
                </motion.button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-display text-ether font-semibold">
            Total volé : +{totalStolen} Éther
          </span>
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
              color: 'white',
            }}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              const etherStolen = Object.entries(stolen)
                .filter(([_, amount]) => amount > 0)
                .map(([playerId, amount]) => ({ playerId, amount }));
              onResolve({
                effectId: effect.effectId,
                type: effect.type,
                sourceMortalCode: effect.sourceMortalCode,
                etherStolen,
              });
            }}
          >
            Confirmer
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// === StealCardFromGodContent: Pick a god, then pick a card from their hand (BAC-03) ===
function StealCardFromGodContent({
  effect,
  gameState,
  onSteal,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onSteal: (targetPlayerId: string, cardId: string) => void;
  onCancel?: () => void;
}) {
  const [selectedGod, setSelectedGod] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const enemies = gameState.players.filter((_, i) => i !== effect.sourcePlayerIndex && gameState.players[i].hand.length > 0);
  const selectedEnemy = selectedGod ? gameState.players.find(p => p.id === selectedGod) : null;

  if (enemies.length === 0) {
    return (
      <ModalWrapper>
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">{effect.sourceMortalName}</h2>
          <p className="text-muted-foreground mb-4">Aucun dieu ennemi n'a de cartes en main.</p>
          <button
            className="px-6 py-2 rounded-lg font-display font-semibold"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
            onClick={onCancel}
          >
            OK
          </button>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        {!selectedGod ? (
          <>
            <p className="text-sm font-display text-foreground mb-3">Choisissez un dieu à qui voler une carte :</p>
            <div className="space-y-2 mb-4">
              {enemies.map(enemy => {
                const divinity = DIVINITIES[enemy.divinity];
                return (
                  <motion.button
                    key={enemy.id}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/50"
                    style={{ background: 'hsl(var(--secondary) / 0.5)' }}
                    whileHover={{ scale: 1.02, borderColor: 'hsl(var(--ether) / 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGod(enemy.id)}
                  >
                    <div className="w-10 h-10 rounded-md overflow-hidden border-2" style={{ borderColor: `hsl(${divinity.color})` }}>
                      {divinity.image && <img src={divinity.image} alt={divinity.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-display font-semibold text-foreground">{enemy.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">({enemy.hand.length} cartes)</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-display text-foreground mb-3">Choisissez la carte à voler à {selectedEnemy?.name} :</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedEnemy?.hand.map(card => {
                const selected = selectedCard === card.id;
                return (
                  <motion.button
                    key={card.id}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${selected ? 'border-ether ring-2 ring-ether/30' : 'border-border/50 hover:border-ether/40'}`}
                    style={{ background: selected ? 'hsl(var(--ether) / 0.1)' : 'hsl(var(--secondary) / 0.5)', minWidth: '140px' }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setSelectedCard(card.id)}
                  >
                    <div className="font-display text-sm font-bold text-foreground">{card.name}</div>
                    <div className="text-xs text-muted-foreground">Coût: {card.cost} | {card.type === 'reaction' ? 'Réaction' : 'Sortilège'}</div>
                    <div className="text-xs text-muted-foreground mt-1">{card.description}</div>
                    {selected && <Check className="w-4 h-4 text-ether mt-1" />}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
                style={{ background: 'hsl(var(--muted))' }}
                onClick={() => { setSelectedGod(null); setSelectedCard(null); }}
              >
                Retour
              </button>
              <motion.button
                className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
                style={{
                  background: selectedCard ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))' : 'hsl(var(--muted))',
                  color: selectedCard ? 'white' : 'hsl(var(--muted-foreground))',
                }}
                whileHover={selectedCard ? { scale: 1.05 } : {}}
                onClick={() => selectedCard && selectedGod && onSteal(selectedGod, selectedCard)}
                disabled={!selectedCard}
              >
                Voler
              </motion.button>
            </div>
          </>
        )}
      </div>
    </ModalWrapper>
  );
}

// === MetamorphoseExtraContent: Pick own mortal to metamorphose at extra cost (BAC-02) ===
function MetamorphoseExtraContent({
  effect,
  gameState,
  onSelect,
  onCancel,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onSelect: (mortalId: string) => void;
  onCancel?: () => void;
}) {
  const player = gameState.players[effect.sourcePlayerIndex];
  const extraCost = effect.extraMetamorphoseCostAdded || 6;
  const availableMortals = player.mortals.filter(
    m => !m.isMetamorphosed && m.status !== 'retired' && m.status !== 'incapacite'
  );

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {availableMortals.map(mortal => {
            const totalCost = mortal.cost + extraCost;
            const canAfford = player.ether >= totalCost;
            return (
              <motion.button
                key={mortal.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${canAfford ? 'border-border/50 hover:border-ether/50' : 'border-border/20 opacity-40'}`}
                style={{ background: 'hsl(var(--secondary) / 0.5)' }}
                whileHover={canAfford ? { scale: 1.02 } : {}}
                whileTap={canAfford ? { scale: 0.98 } : {}}
                onClick={() => canAfford && onSelect(mortal.id)}
                disabled={!canAfford}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/50 shrink-0">
                  <img src={mortal.imageRecto} alt={mortal.nameRecto} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <span className="font-display font-semibold text-foreground">{mortal.nameRecto}</span>
                  <span className="text-muted-foreground text-sm ml-2">→ {mortal.nameVerso}</span>
                  <div className="text-xs mt-1">
                    <span className="text-muted-foreground">Coût base: {mortal.cost}</span>
                    <span className="text-ether ml-2">+ {extraCost} = <strong>{totalCost} Éther</strong></span>
                    {!canAfford && <span className="text-destructive ml-2">(insuffisant)</span>}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {onCancel && (
          <div className="flex justify-end">
            <button
              className="px-5 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={onCancel}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

// === MoveIncapacitationsContent: Move incapacitations between mortals (BAC-04) ===
function MoveIncapacitationsContent({
  effect,
  gameState,
  onConfirm,
}: {
  effect: PendingEffect;
  gameState: GameState;
  onConfirm: (moves: { fromMortalId: string; toMortalId: string; fromPlayerId: string; toPlayerId: string }[]) => void;
}) {
  const [moves, setMoves] = useState<{ fromMortalId: string; toMortalId: string; fromPlayerId: string; toPlayerId: string }[]>([]);
  const [phase, setPhase] = useState<'select_source' | 'select_target'>('select_source');
  const [currentSource, setCurrentSource] = useState<{ mortalId: string; playerId: string } | null>(null);
  const maxMoves = effect.maxTargets || 4;

  // Build list of incapacitated mortals that haven't been "healed" yet in this session
  const healedIds = new Set(moves.map(m => m.fromMortalId));
  const incapacitatedIds = new Set(moves.map(m => m.toMortalId));

  const allPlayers = gameState.players;

  const getEffectiveStatus = (mortal: Mortal) => {
    if (healedIds.has(mortal.id) && !incapacitatedIds.has(mortal.id)) return 'normal';
    if (incapacitatedIds.has(mortal.id)) return 'incapacite';
    return mortal.status;
  };

  const isValidSource = (mortal: Mortal) => {
    if (!mortal.isMetamorphosed) return false;
    const effectiveStatus = getEffectiveStatus(mortal);
    return effectiveStatus === 'incapacite';
  };

  const isValidTarget = (mortal: Mortal, owner: Player) => {
    if (!mortal.isMetamorphosed) return false;
    if (mortal.status === 'retired') return false;
    const effectiveStatus = getEffectiveStatus(mortal);
    if (effectiveStatus === 'incapacite') return false;
    // Check invulnerability
    return canBeIncapacitated(mortal, owner, gameState);
  };

  return (
    <ModalWrapper>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-ether" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{effect.sourceMortalName}</h2>
            <p className="text-muted-foreground text-sm">{effect.description}</p>
          </div>
        </div>

        <p className="text-sm font-display text-foreground mb-1">
          Déplacements : <span className="text-ether font-bold">{moves.length}/{maxMoves}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          {phase === 'select_source'
            ? 'Cliquez sur un mortel incapacité pour le libérer :'
            : 'Cliquez sur un mortel à incapaciter à la place :'}
        </p>

        <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
          {allPlayers.map(owner => {
            const relevantMortals = owner.mortals.filter(m => {
              if (phase === 'select_source') return isValidSource(m);
              return isValidTarget(m, owner);
            });
            if (relevantMortals.length === 0) return null;
            return (
              <div key={owner.id}>
                <h3 className="font-display text-xs font-semibold text-muted-foreground mb-1">{owner.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {owner.mortals.map(mortal => {
                    const valid = phase === 'select_source' ? isValidSource(mortal) : isValidTarget(mortal, owner);
                    const effectiveStatus = getEffectiveStatus(mortal);
                    return (
                      <motion.button
                        key={mortal.id}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          valid ? 'border-ether/50 hover:border-ether cursor-pointer' : 'border-border/20 opacity-30 cursor-not-allowed'
                        }`}
                        style={{ width: 56, height: 56 }}
                        onClick={() => {
                          if (!valid) return;
                          if (phase === 'select_source') {
                            setCurrentSource({ mortalId: mortal.id, playerId: owner.id });
                            setPhase('select_target');
                          } else if (currentSource) {
                            setMoves(prev => [...prev, {
                              fromMortalId: currentSource.mortalId,
                              toMortalId: mortal.id,
                              fromPlayerId: currentSource.playerId,
                              toPlayerId: owner.id,
                            }]);
                            setCurrentSource(null);
                            setPhase('select_source');
                          }
                        }}
                        whileHover={valid ? { scale: 1.1 } : {}}
                        disabled={!valid}
                      >
                        <img
                          src={mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto}
                          alt={mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto}
                          className="w-full h-full object-cover"
                        />
                        {effectiveStatus === 'incapacite' && (
                          <div className="absolute bottom-0 left-0 right-0 text-center text-xs bg-black/60 text-white">⛓️</div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Move log */}
        {moves.length > 0 && (
          <div className="mb-3 p-2 rounded-lg text-xs text-muted-foreground" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
            {moves.map((m, i) => {
              const fromMortal = allPlayers.flatMap(p => p.mortals).find(mo => mo.id === m.fromMortalId);
              const toMortal = allPlayers.flatMap(p => p.mortals).find(mo => mo.id === m.toMortalId);
              return <div key={i}>{i + 1}. {fromMortal?.nameVerso} → {toMortal?.nameVerso}</div>;
            })}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          {phase === 'select_target' && (
            <button
              className="px-4 py-2 rounded-lg font-display text-sm border border-border/50 text-muted-foreground"
              style={{ background: 'hsl(var(--muted))' }}
              onClick={() => { setPhase('select_source'); setCurrentSource(null); }}
            >
              Annuler la sélection
            </button>
          )}
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
              color: 'white',
            }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onConfirm(moves)}
          >
            Terminer {moves.length > 0 ? `(${moves.length} déplacement${moves.length > 1 ? 's' : ''})` : ''}
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}
