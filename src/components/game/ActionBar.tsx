import { GameState } from '@/types/game';
import { motion } from 'framer-motion';
import { SkipForward, MousePointerClick } from 'lucide-react';

interface ActionBarProps {
  gameState: GameState;
  isOwnTurn?: boolean;
  reactionWindowActive?: boolean;
  onEndTurn: () => void;
}

const ActionBar = ({
  gameState,
  isOwnTurn = true,
  reactionWindowActive = false,
  onEndTurn,
}: ActionBarProps) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isSleeping = activePlayer.skipNextTurn;
  const disabled = !isOwnTurn || isSleeping || reactionWindowActive;

  return (
    <motion.div
      className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-border/50"
      style={{
        background: `linear-gradient(90deg, hsl(var(--card) / 0.9), hsl(var(--secondary) / 0.7))`,
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isOwnTurn && (
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-display font-bold" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          ⏳ Tour de {activePlayer.name}
        </div>
      )}
      {isSleeping && isOwnTurn && (
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-display font-bold" style={{ background: 'hsl(260 40% 20%)', color: 'hsl(260 70% 80%)', border: '1px solid hsl(260 50% 40%)' }}>
          💤 Tour sauté
        </div>
      )}
      {isOwnTurn && !isSleeping && !reactionWindowActive && (
        <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-display text-muted-foreground">
          <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-divine" />
          <span className="hidden sm:inline">Cliquez un mortel ou une carte pour choisir une action</span>
          <span className="sm:hidden">Cliquez un mortel ou une carte</span>
        </div>
      )}

      <div className="flex-1 min-w-0" />

      <motion.button
        className={`flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-display font-semibold text-foreground transition-all border border-border/50 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
        style={{ background: 'hsl(var(--muted))' }}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={disabled ? undefined : onEndTurn}
      >
        <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Fin du Tour</span>
        <span className="sm:hidden">Fin</span>
      </motion.button>
    </motion.div>
  );
};

export default ActionBar;
