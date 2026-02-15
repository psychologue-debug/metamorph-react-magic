// === Reaction Window ===
// Hot-seat reaction intervention UI with timer.

import { Player, GameState, ReactionWindowState } from '@/types/game';
import { canActivateReaction } from '@/engine/reactionEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Shield, Clock, X, Check } from 'lucide-react';

interface ReactionWindowProps {
  gameState: GameState;
  reactionWindow: ReactionWindowState;
  onPass: (playerId: string) => void;
  onActivate: (playerId: string, cardId: string) => void;
  onReady: (playerId: string) => void;
}

const REACTION_TIMER_SECONDS = 10;

const ReactionWindow = ({
  gameState,
  reactionWindow,
  onPass,
  onActivate,
  onReady,
}: ReactionWindowProps) => {
  const [timeLeft, setTimeLeft] = useState(REACTION_TIMER_SECONDS);
  const [choosing, setChoosing] = useState(false);

  const currentReactorId = reactionWindow.reactorQueue[reactionWindow.currentReactorIndex];
  const currentReactor = gameState.players.find(p => p.id === currentReactorId);

  // Timer countdown
  useEffect(() => {
    if (choosing || (reactionWindow.phase !== 'asking' && reactionWindow.phase !== 'choosing')) return;
    setTimeLeft(REACTION_TIMER_SECONDS);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-pass on timeout
          if (currentReactorId) {
            onPass(currentReactorId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reactionWindow.currentReactorIndex, reactionWindow.phase, currentReactorId, onPass, choosing]);

  // Reset choosing state when reactor changes
  useEffect(() => {
    setChoosing(false);
  }, [reactionWindow.currentReactorIndex]);

  const handleYes = useCallback(() => {
    setChoosing(true);
  }, []);

  const handleSelectCard = useCallback((cardId: string) => {
    if (!currentReactor) return;
    const card = currentReactor.reactions.find(c => c.id === cardId);
    if (!card) return;

    const check = canActivateReaction(card, reactionWindow.trigger, currentReactor, gameState);
    if (!check.valid) {
      toast.error(check.reason || 'Conditions non remplies', {
        style: { background: 'hsl(0 70% 20%)', border: '1px solid hsl(0 70% 40%)', color: 'white', fontSize: '16px' },
      });
      return;
    }

    onActivate(currentReactorId, cardId);
  }, [currentReactor, currentReactorId, reactionWindow.trigger, gameState, onActivate]);

  if (!currentReactor) return null;

  // Trigger description
  const triggerDesc = (() => {
    const source = gameState.players.find(p => p.id === reactionWindow.trigger.sourcePlayerId);
    if (reactionWindow.trigger.type === 'metamorphose') {
      const mortal = source?.mortals.find(m => m.id === reactionWindow.trigger.targetMortalId);
      let desc = `${source?.name} a métamorphosé ${mortal?.nameVerso || 'un mortel'}`;
      if (reactionWindow.trigger.effectDescription) {
        desc += `. ${reactionWindow.trigger.effectDescription}`;
      }
      return desc;
    }
    if (reactionWindow.trigger.cardName) {
      return `${source?.name} a joué ${reactionWindow.trigger.cardName}`;
    }
    return `${source?.name} a effectué une action`;
  })();

  // Hot-seat: show "ready" screen before revealing reaction cards
  if (reactionWindow.phase === 'waiting_ready') {
    return (
      <motion.div
        className="fixed inset-0 z-[100000] flex items-center justify-center"
        style={{ background: 'hsla(0 0% 0% / 0.85)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="rounded-2xl p-8 max-w-md w-full mx-4 text-center"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--reaction) / 0.4)',
            boxShadow: '0 0 40px hsl(var(--reaction) / 0.3)',
          }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--reaction))' }} />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Fenêtre de Réaction
          </h2>
          <p className="text-muted-foreground font-body mb-2">{triggerDesc}</p>
          <p className="text-lg font-display text-foreground mb-6">
            C'est au tour de <strong style={{ color: `hsl(${currentReactor.divinity ? currentReactor.divinity : 'var(--foreground)'})` }}>{currentReactor.name}</strong> de réagir
          </p>
          <p className="text-sm text-muted-foreground mb-6 italic">
            Passez l'écran au joueur concerné, puis cliquez "Prêt"
          </p>
          <motion.button
            className="px-8 py-3 rounded-xl font-display text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--reaction)), hsl(var(--reaction) / 0.7))',
              color: 'white',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onReady(currentReactorId)}
          >
            Prêt
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100000] flex items-end justify-center pb-8"
      style={{ background: 'hsla(0 0% 0% / 0.6)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="rounded-2xl p-6 max-w-lg w-full mx-4"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--reaction) / 0.4)',
          boxShadow: '0 0 30px hsl(var(--reaction) / 0.2)',
        }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: 'hsl(var(--reaction))' }} />
            <span className="font-display text-lg font-bold text-foreground">{currentReactor.name}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={`font-display font-bold text-lg ${timeLeft <= 3 ? 'text-destructive' : 'text-foreground'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Trigger info */}
        <p className="text-sm text-muted-foreground font-body mb-4">{triggerDesc}</p>

        {!choosing ? (
          /* Ask Yes/No */
          <div>
            <p className="font-display text-base text-foreground mb-4">Voulez-vous activer une réaction ?</p>
            <div className="flex gap-3">
              <motion.button
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display text-base font-bold"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--reaction)), hsl(var(--reaction) / 0.7))',
                  color: 'white',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleYes}
              >
                <Check className="w-5 h-5" />
                OUI
              </motion.button>
              <motion.button
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display text-base font-bold border border-border/50 text-muted-foreground"
                style={{ background: 'hsl(var(--muted))' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onPass(currentReactorId)}
              >
                <X className="w-5 h-5" />
                NON
              </motion.button>
            </div>
          </div>
        ) : (
          /* Choose which reaction card */
          <div>
            <p className="font-display text-base text-foreground mb-3">Choisissez une réaction :</p>
            <div className="flex flex-col gap-2 mb-3">
              {currentReactor.reactions.map(card => (
                <motion.button
                  key={card.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border text-left"
                  style={{
                    background: 'hsl(var(--secondary))',
                    borderColor: 'hsl(var(--reaction) / 0.3)',
                  }}
                  whileHover={{ scale: 1.02, borderColor: 'hsl(var(--reaction) / 0.6)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectCard(card.id)}
                >
                  <div>
                    <span className="font-display font-bold text-foreground">{card.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({card.cost} Éther)</span>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </div>
                  <Shield className="w-5 h-5 shrink-0 ml-2" style={{ color: 'hsl(var(--reaction))' }} />
                </motion.button>
              ))}
            </div>
            <motion.button
              className="w-full px-4 py-2 rounded-xl font-display text-sm text-muted-foreground border border-border/30"
              style={{ background: 'hsl(var(--muted))' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setChoosing(false)}
            >
              Annuler
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReactionWindow;
