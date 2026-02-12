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
      <div className="absolute top-2 left-2 z-20 flex items-start gap-3">
        <div className="rounded-xl px-4 py-2 flex items-center gap-4 flex-wrap"
          style={{
            background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--secondary) / 0.9))`,
            backdropFilter: 'blur(8px)',
            border: '1px solid hsl(var(--border) / 0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-ether" />
            <span className="font-display text-base text-muted-foreground">
              Cycle {gameState.turnCount}
            </span>
          </div>

          <motion.h2
            className="font-display text-lg font-bold text-foreground"
            key={activePlayer.name}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
          >
            🏛 {activePlayer.name}
          </motion.h2>

          <div className="h-5 w-px bg-border/40" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-2.5 py-1">
              <Layers className="w-4 h-4 text-ether" />
              <span className="text-sm font-display font-bold text-foreground">{gameState.deck.length}</span>
              <span className="text-sm text-muted-foreground">pioche</span>
            </div>
            <button
              className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-2.5 py-1 hover:bg-ether/20 transition-colors cursor-pointer"
              onClick={() => setShowDiscard(!showDiscard)}
              title="Voir la défausse"
            >
              <Trash2 className="w-4 h-4 text-ether" />
              <span className="text-sm font-display font-bold text-foreground">{gameState.discardPile.length}</span>
              <span className="text-sm text-muted-foreground">défausse</span>
            </button>
          </div>
        </div>

        {gameState.reactionWindowActive && (
          <motion.div
            className="rounded-xl p-4 flex items-center gap-3"
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
              <Clock className="w-6 h-6 text-reaction" />
            </motion.div>
            <span className="font-display text-2xl font-bold text-reaction">
              {gameState.reactionTimeRemaining}s
            </span>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showDiscard && (
          <motion.div
            className="absolute top-20 left-2 z-30 rounded-xl p-4 max-w-sm max-h-72 overflow-y-auto"
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
    </>
  );
};

export default CentralZone;
