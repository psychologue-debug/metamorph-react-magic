import { GameState } from '@/types/game';
import { InteractionMode } from '@/hooks/useGameLogic';
import { motion } from 'framer-motion';
import { SkipForward, Sparkles, RotateCcw, Hand, X, Flame } from 'lucide-react';

interface ActionBarProps {
  gameState: GameState;
  interactionMode: InteractionMode;
  onEndTurn: () => void;
  onToggleMetamorphose: () => void;
  onToggleSpell: () => void;
  onToggleActivate: () => void;
  onToggleReactionWindow: () => void;
}

const ActionBar = ({
  gameState,
  interactionMode,
  onEndTurn,
  onToggleMetamorphose,
  onToggleSpell,
  onToggleActivate,
  onToggleReactionWindow,
}: ActionBarProps) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMetaMode = interactionMode === 'metamorphosing';
  const isSpellMode = interactionMode === 'playing_spell';
  const isActivateMode = interactionMode === 'activating_effect';

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
      {/* Turn info */}
      <div className="flex items-center gap-2 pr-3 border-r border-border/50">
        <span className="text-base font-display text-muted-foreground uppercase tracking-wider">Tour de</span>
        <span className="text-lg font-display font-bold text-foreground">{activePlayer.name}</span>
      </div>

      {/* Mode indicator */}
      {interactionMode !== 'idle' && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-base font-display font-semibold"
          style={{ background: 'hsl(var(--divine) / 0.15)', color: 'hsl(var(--divine))' }}
        >
          {isMetaMode ? '🎯 Choisissez un mortel à métamorphoser'
            : isActivateMode ? '⚡ Cliquez un mortel métamorphosé pour activer son effet'
            : '🃏 Choisissez un sort à jouer'}
        </div>
      )}

      {/* Action buttons */}
      <motion.button
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-display font-semibold transition-all ${
          isMetaMode ? 'ring-2 ring-ether' : ''
        }`}
        style={{
          background: isMetaMode
            ? `linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))`
            : `linear-gradient(135deg, hsl(var(--ether) / 0.8), hsl(var(--ether-dim) / 0.8))`,
          color: 'hsl(var(--primary-foreground))',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleMetamorphose}
      >
        {isMetaMode ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        {isMetaMode ? 'Annuler' : 'Métamorphoser'}
      </motion.button>

      <motion.button
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-display font-semibold border border-divine/30 text-foreground transition-all ${
          isSpellMode ? 'ring-2 ring-divine' : ''
        }`}
        style={{ background: isSpellMode ? 'hsl(var(--divine) / 0.2)' : 'hsl(var(--divine) / 0.1)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleSpell}
      >
        {isSpellMode ? <X className="w-5 h-5 text-divine" /> : <Hand className="w-5 h-5 text-divine" />}
        {isSpellMode ? 'Annuler' : 'Jouer un Sort'}
      </motion.button>

      <motion.button
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-display font-semibold border border-amber-500/30 text-foreground transition-all ${
          isActivateMode ? 'ring-2 ring-amber-500' : ''
        }`}
        style={{ background: isActivateMode ? 'hsl(30 60% 20% / 0.4)' : 'hsl(30 60% 20% / 0.15)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleActivate}
      >
        {isActivateMode ? <X className="w-5 h-5 text-amber-400" /> : <Flame className="w-5 h-5 text-amber-400" />}
        {isActivateMode ? 'Annuler' : 'Activer un Effet'}
      </motion.button>

      <div className="flex-1" />

      <motion.button
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-display border border-reaction/30 text-reaction transition-all"
        style={{ background: 'hsl(var(--reaction) / 0.08)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleReactionWindow}
      >
        <RotateCcw className="w-5 h-5" />
        Réaction
      </motion.button>

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
