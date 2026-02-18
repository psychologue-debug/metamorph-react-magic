import { GameState } from '@/types/game';
import { InteractionMode } from '@/hooks/useGameLogic';
import { motion } from 'framer-motion';
import { SkipForward, Sparkles, Hand, X, Flame } from 'lucide-react';

interface ActionBarProps {
  gameState: GameState;
  interactionMode: InteractionMode;
  onEndTurn: () => void;
  onToggleMetamorphose: () => void;
  onToggleSpell: () => void;
  onToggleActivate: () => void;
}

const ActionBar = ({
  gameState,
  interactionMode,
  onEndTurn,
  onToggleMetamorphose,
  onToggleSpell,
  onToggleActivate,
}: ActionBarProps) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMetaMode = interactionMode === 'metamorphosing';
  const isSpellMode = interactionMode === 'playing_spell';
  const isActivateMode = interactionMode === 'activating_effect';
  const isSleeping = activePlayer.skipNextTurn;

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border/50"
      style={{
        background: `linear-gradient(90deg, hsl(var(--card) / 0.9), hsl(var(--secondary) / 0.7))`,
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {isSleeping && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-base font-display font-bold" style={{ background: 'hsl(260 40% 20%)', color: 'hsl(260 70% 80%)', border: '1px solid hsl(260 50% 40%)' }}>
          💤 Tour sauté (Sommeil)
        </div>
      )}

      <motion.button
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-display font-semibold transition-all ${
          isMetaMode ? 'ring-2 ring-ether' : ''
        } ${isSleeping ? 'opacity-30 pointer-events-none' : ''}`}
        style={{
          background: isMetaMode
            ? `linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))`
            : `linear-gradient(135deg, hsl(var(--ether) / 0.8), hsl(var(--ether-dim) / 0.8))`,
          color: 'hsl(var(--primary-foreground))',
        }}
        whileHover={isSleeping ? {} : { scale: 1.05 }}
        whileTap={isSleeping ? {} : { scale: 0.95 }}
        onClick={isSleeping ? undefined : onToggleMetamorphose}
      >
        {isMetaMode ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        {isMetaMode ? 'Annuler' : 'Métamorphoser'}
      </motion.button>

      <motion.button
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-display font-semibold border border-divine/30 text-foreground transition-all ${
          isSpellMode ? 'ring-2 ring-divine' : ''
        } ${isSleeping ? 'opacity-30 pointer-events-none' : ''}`}
        style={{ background: isSpellMode ? 'hsl(var(--divine) / 0.2)' : 'hsl(var(--divine) / 0.1)' }}
        whileHover={isSleeping ? {} : { scale: 1.05 }}
        whileTap={isSleeping ? {} : { scale: 0.95 }}
        onClick={isSleeping ? undefined : onToggleSpell}
      >
        {isSpellMode ? <X className="w-5 h-5 text-divine" /> : <Hand className="w-5 h-5 text-divine" />}
        {isSpellMode ? 'Annuler' : 'Jouer un Sort'}
      </motion.button>

      <motion.button
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-display font-semibold border border-amber-500/30 text-foreground transition-all ${
          isActivateMode ? 'ring-2 ring-amber-500' : ''
        } ${isSleeping ? 'opacity-30 pointer-events-none' : ''}`}
        style={{ background: isActivateMode ? 'hsl(30 60% 20% / 0.4)' : 'hsl(30 60% 20% / 0.15)' }}
        whileHover={isSleeping ? {} : { scale: 1.05 }}
        whileTap={isSleeping ? {} : { scale: 0.95 }}
        onClick={isSleeping ? undefined : onToggleActivate}
      >
        {isActivateMode ? <X className="w-5 h-5 text-amber-400" /> : <Flame className="w-5 h-5 text-amber-400" />}
        {isActivateMode ? 'Annuler' : 'Activer un Effet'}
      </motion.button>

      <div className="flex-1" />

      <motion.button
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-display font-semibold text-foreground transition-all border border-border/50"
        style={{ background: 'hsl(var(--muted))' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEndTurn}
      >
        <SkipForward className="w-5 h-5" />
        Fin du Tour
      </motion.button>
    </motion.div>
  );
};

export default ActionBar;
