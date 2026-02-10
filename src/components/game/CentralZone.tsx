import { GameState } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Layers, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CentralZoneProps {
  gameState: GameState;
}

const CentralZone = ({ gameState }: CentralZoneProps) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const [showDiscard, setShowDiscard] = useState(false);

  return (
    <>
      {/* Top-left info panel */}
      <div className="absolute top-2 left-2 z-20 flex items-start gap-2">
        {/* Game info card */}
        <div className="rounded-xl p-3 min-w-[160px]"
          style={{
            background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--secondary) / 0.9))`,
            backdropFilter: 'blur(8px)',
            border: '1px solid hsl(var(--border) / 0.3)',
          }}
        >
          {/* Cycle indicator */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-ether" />
            <span className="font-display text-xs text-muted-foreground">
              Cycle {gameState.turnCount}
            </span>
          </div>

          {/* Active player name */}
          <motion.h2
            className="font-display text-sm font-bold text-foreground mb-2"
            key={activePlayer.name}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
          >
            🏛 {activePlayer.name}
          </motion.h2>

          {/* Deck + Discard row */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">{gameState.deck.length} cartes</span>
            </div>
            <button
              className="flex items-center gap-1 hover:text-ether transition-colors cursor-pointer"
              onClick={() => setShowDiscard(!showDiscard)}
              title="Voir la défausse"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">{gameState.discardPile.length} défausse</span>
            </button>
          </div>
        </div>

        {/* Reaction timer (shown next to info when active) */}
        {gameState.reactionWindowActive && (
          <motion.div
            className="rounded-xl p-3 flex items-center gap-2"
            style={{
              background: 'hsl(var(--card) / 0.95)',
              border: '1px solid hsl(var(--reaction) / 0.4)',
              boxShadow: '0 0 20px hsl(var(--reaction) / 0.2)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Clock className="w-4 h-4 text-reaction" />
            </motion.div>
            <span className="font-display text-lg font-bold text-reaction">
              {gameState.reactionTimeRemaining}s
            </span>
          </motion.div>
        )}
      </div>

      {/* Discard pile modal */}
      <AnimatePresence>
        {showDiscard && (
          <motion.div
            className="absolute top-16 left-2 z-30 rounded-xl p-3 max-w-xs max-h-60 overflow-y-auto"
            style={{
              background: 'hsl(var(--card) / 0.98)',
              border: '1px solid hsl(var(--border) / 0.4)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-xs font-bold text-foreground">Défausse</h3>
              <button onClick={() => setShowDiscard(false)} className="text-muted-foreground text-xs hover:text-foreground">✕</button>
            </div>
            {gameState.discardPile.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">Aucune carte défaussée</p>
            ) : (
              <div className="space-y-1">
                {gameState.discardPile.map((card, i) => (
                  <div key={`${card.id}-${i}`} className="text-[10px] p-1.5 rounded bg-secondary/50">
                    <span className="font-display font-bold text-foreground">{card.name}</span>
                    <span className="text-muted-foreground ml-1">({card.cost}⚡)</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CentralZone;
