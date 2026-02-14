import { useState } from 'react';
import { GameState, Player, Mortal } from '@/types/game';
import { PendingEffect } from '@/engine/metamorphoseEffects';
import { canBeIncapacitated, canBeRemovedFromGame, isMortalInvulnerable } from '@/engine/mortalStatuses';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, X, Minus, Check } from 'lucide-react';

interface TargetingModalProps {
  effect: PendingEffect;
  gameState: GameState;
  onResolve: (result: TargetingResult) => void;
  onCancel?: () => void;
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

const TargetingModal = ({ effect, gameState, onResolve, onCancel }: TargetingModalProps) => {
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

  return null;
};

// === Sub-components ===

function ModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
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
                <span className="text-muted-foreground ml-2">({enemy.ether} Éther)</span>
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

        <div className="flex justify-end">
          <motion.button
            className="px-6 py-2 rounded-lg font-display font-semibold text-sm"
            style={{
              background: remaining === 0
                ? 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))'
                : 'hsl(var(--muted))',
              color: remaining === 0 ? 'white' : 'hsl(var(--muted-foreground))',
            }}
            whileHover={remaining === 0 ? { scale: 1.05 } : {}}
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
            disabled={remaining > 0}
          >
            {remaining === 0 ? 'Confirmer' : `Encore ${remaining} à répartir`}
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

export default TargetingModal;
