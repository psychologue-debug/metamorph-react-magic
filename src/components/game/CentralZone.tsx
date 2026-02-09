import { GameState, PHASE_LABELS } from '@/types/game';
import { motion } from 'framer-motion';
import { Clock, Layers, RotateCcw } from 'lucide-react';

interface CentralZoneProps {
  gameState: GameState;
}

const CentralZone = ({ gameState }: CentralZoneProps) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const phases = Object.entries(PHASE_LABELS);

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
      {/* Outer rotating ring */}
      <motion.div
        className="absolute w-52 h-52 rounded-full border border-ether/20 ring-rotate-slow"
        style={{
          borderStyle: 'dashed',
        }}
      >
        {/* Ring markers */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: 'hsl(var(--ether) / 0.5)',
              left: `${50 + 48 * Math.cos((deg * Math.PI) / 180)}%`,
              top: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </motion.div>

      {/* Middle rotating ring */}
      <motion.div
        className="absolute w-36 h-36 rounded-full border border-divine/20 ring-rotate-medium"
      >
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: 'hsl(var(--divine) / 0.6)',
              left: `${50 + 46 * Math.cos((deg * Math.PI) / 180)}%`,
              top: `${50 + 46 * Math.sin((deg * Math.PI) / 180)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </motion.div>

      {/* Inner rotating ring */}
      <motion.div
        className="absolute w-24 h-24 rounded-full border border-reaction/15 ring-rotate-fast"
      />

      {/* Center content */}
      <div className="relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center marble-texture"
        style={{
          background: `radial-gradient(circle, hsl(var(--card)) 0%, hsl(var(--background) / 0.9) 100%)`,
        }}
      >
        {/* Cycle indicator */}
        <div className="flex items-center gap-1 mb-1">
          <RotateCcw className="w-3 h-3 text-ether" />
          <span className="font-display text-[9px] text-muted-foreground">
            Cycle {gameState.turnCount}
          </span>
        </div>

        {/* Active player name */}
        <motion.h2
          className="font-display text-sm font-bold text-foreground text-center"
          key={activePlayer.name}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {activePlayer.name}
        </motion.h2>

        {/* Phase indicators */}
        <div className="flex gap-1 mt-2">
          {phases.map(([key, label]) => (
            <div
              key={key}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                key === gameState.phase
                  ? 'scale-125'
                  : 'opacity-30'
              }`}
              style={{
                background:
                  key === gameState.phase
                    ? key === 'principale' 
                      ? 'hsl(var(--ether))'
                      : key === 'debut_tour' || key === 'pioche'
                      ? 'hsl(var(--phase-debut))'
                      : 'hsl(var(--phase-defausse))'
                    : 'hsl(var(--muted-foreground))',
                boxShadow: key === gameState.phase ? '0 0 6px hsl(var(--ether) / 0.5)' : 'none',
              }}
              title={label}
            />
          ))}
        </div>

        {/* Current phase label */}
        <span className="font-body text-[9px] text-muted-foreground mt-1 italic">
          {PHASE_LABELS[gameState.phase]}
        </span>

        {/* Deck info */}
        <div className="flex items-center gap-1 mt-1.5">
          <Layers className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">{gameState.deck.length} cartes</span>
        </div>
      </div>

      {/* Reaction timer overlay */}
      {gameState.reactionWindowActive && (
        <motion.div
          className="absolute w-56 h-56 rounded-full flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full reaction-timer"
            style={{
              border: '2px solid hsl(var(--reaction) / 0.6)',
              boxShadow: '0 0 30px hsl(var(--reaction) / 0.3)',
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <div className="absolute -bottom-8 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-reaction" />
            <span className="font-display text-sm font-bold text-reaction">
              {gameState.reactionTimeRemaining}s
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CentralZone;
