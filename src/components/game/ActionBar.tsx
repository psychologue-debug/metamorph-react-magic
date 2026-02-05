import { GameState } from '@/types/game';
import { motion } from 'framer-motion';
import { Play, SkipForward, Sparkles, RotateCcw, Hand } from 'lucide-react';

interface ActionBarProps {
  gameState: GameState;
  onNextPhase: () => void;
  onEndTurn: () => void;
  onMetamorphose: () => void;
  onToggleReactionWindow: () => void;
}

const ActionBar = ({ gameState, onNextPhase, onEndTurn, onMetamorphose, onToggleReactionWindow }: ActionBarProps) => {
  const isMainPhase = gameState.phase === 'principale';
  const activePlayer = gameState.players[gameState.activePlayerIndex];

  return (
    <motion.div
      className="flex items-center gap-2 p-3 rounded-xl border border-border/50"
      style={{
        background: `linear-gradient(90deg, hsl(var(--card) / 0.9), hsl(var(--secondary) / 0.7))`,
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Phase info */}
      <div className="flex items-center gap-2 pr-3 border-r border-border/50">
        <span className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">
          Tour de
        </span>
        <span className="text-xs font-display font-bold text-foreground">
          {activePlayer.name}
        </span>
      </div>

      {/* Action buttons */}
      {isMainPhase && (
        <>
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-display font-semibold transition-all"
            style={{
              background: `linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))`,
              color: 'hsl(var(--primary-foreground))',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMetamorphose}
          >
            <Sparkles className="w-3 h-3" />
            Métamorphoser
          </motion.button>

          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-display font-semibold border border-divine/30 text-foreground transition-all"
            style={{
              background: `hsl(var(--divine) / 0.1)`,
            }}
            whileHover={{ scale: 1.05, background: 'hsl(var(--divine) / 0.2)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Hand className="w-3 h-3 text-divine" />
            Jouer un Sort
          </motion.button>
        </>
      )}

      <div className="flex-1" />

      <motion.button
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-display border border-reaction/30 text-reaction transition-all"
        style={{ background: 'hsl(var(--reaction) / 0.08)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleReactionWindow}
      >
        <RotateCcw className="w-3 h-3" />
        Réaction
      </motion.button>

      <motion.button
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-display text-foreground transition-all"
        style={{
          background: 'hsl(var(--secondary))',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNextPhase}
      >
        <Play className="w-3 h-3" />
        Phase suivante
      </motion.button>

      <motion.button
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-display font-semibold text-foreground transition-all border border-border/50"
        style={{
          background: 'hsl(var(--muted))',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEndTurn}
      >
        <SkipForward className="w-3 h-3" />
        Fin du Tour
      </motion.button>
    </motion.div>
  );
};

export default ActionBar;
