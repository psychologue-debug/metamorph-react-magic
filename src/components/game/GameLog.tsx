import { GameLogEntry } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText } from 'lucide-react';
import { useState } from 'react';

interface GameLogProps {
  entries: GameLogEntry[];
}

const GameLog = ({ entries }: GameLogProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="fixed top-12 right-0 z-[9990] flex items-start"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Toggle button — always visible */}
      <button
        className="flex items-center gap-1.5 px-3 py-2 rounded-l-lg font-display text-sm font-semibold transition-colors"
        style={{
          background: 'hsl(var(--card) / 0.95)',
          border: '1px solid hsl(var(--border) / 0.4)',
          borderRight: 'none',
          color: 'hsl(var(--foreground))',
        }}
      >
        <ScrollText className="w-4 h-4 text-ether" />
        Chroniques
      </button>

      {/* Slide-in panel */}
      <motion.div
        className="w-72 max-h-[70vh] overflow-y-auto rounded-bl-lg"
        style={{
          background: 'hsl(var(--card) / 0.97)',
          backdropFilter: 'blur(12px)',
          borderLeft: '1px solid hsl(var(--border) / 0.4)',
          borderBottom: '1px solid hsl(var(--border) / 0.4)',
        }}
        initial={false}
        animate={{ x: hovered ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
      >
        <div className="p-3 space-y-2">
          <AnimatePresence>
            {entries.slice(0, 30).map((entry, i) => (
              <motion.div
                key={entry.id}
                className="flex items-start gap-2 text-sm font-body"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <span className="text-ether font-display font-semibold whitespace-nowrap">
                  {entry.playerName}
                </span>
                <span className="text-muted-foreground">
                  {entry.detail}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default GameLog;
