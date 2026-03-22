import { GameState } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CentralZoneProps {
  gameState: GameState;
}

const CentralZone = ({ gameState }: CentralZoneProps) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const [showDiscard, setShowDiscard] = useState(false);

  return (
    <div className="relative flex items-center gap-1.5 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1 sm:gap-2">
        <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-ether" />
        <span className="font-display text-xs sm:text-sm text-muted-foreground">
          C{gameState.turnCount}
        </span>
      </div>

      <div className="h-3 sm:h-4 w-px bg-border/40" />

      <motion.span
        className="font-display text-xs sm:text-sm font-bold text-foreground truncate max-w-[100px] sm:max-w-none"
        key={activePlayer.name}
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
      >
        🏛 {activePlayer.name}
      </motion.span>

      <div className="h-3 sm:h-4 w-px bg-border/40" />

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="flex items-center gap-0.5 sm:gap-1 bg-secondary/60 rounded-lg px-1.5 sm:px-2 py-0.5">
          <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-ether" />
          <span className="text-[10px] sm:text-xs font-display font-bold text-foreground">{gameState.deck.length}</span>
        </div>
        <button
          className="flex items-center gap-0.5 sm:gap-1 bg-secondary/60 rounded-lg px-1.5 sm:px-2 py-0.5 hover:bg-ether/20 transition-colors cursor-pointer"
          onClick={() => setShowDiscard(!showDiscard)}
        >
          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-ether" />
          <span className="text-[10px] sm:text-xs font-display font-bold text-foreground">{gameState.discardPile.length}</span>
        </button>
      </div>

      <AnimatePresence>
        {showDiscard && (
          <motion.div
            className="absolute top-full left-0 mt-2 z-30 rounded-xl p-4 max-w-sm max-h-72 overflow-y-auto"
            style={{
              background: 'hsl(var(--card) / 0.98)',
              border: '1px solid hsl(var(--border) / 0.4)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base font-bold text-foreground">Défausse</h3>
              <button onClick={() => setShowDiscard(false)} className="text-muted-foreground text-base hover:text-foreground">✕</button>
            </div>
            {gameState.discardPile.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucune carte défaussée</p>
            ) : (
              <div className="space-y-1.5">
                {gameState.discardPile.map((card, i) => (
                  <div key={`${card.id}-${i}`} className="text-sm p-2 rounded bg-secondary/50">
                    <span className="font-display font-bold text-foreground">{card.name}</span>
                    <span className="text-muted-foreground ml-1">({card.cost}⚡)</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CentralZone;
