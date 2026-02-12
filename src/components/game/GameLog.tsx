import { GameLogEntry } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText } from 'lucide-react';

interface GameLogProps {
  entries: GameLogEntry[];
}

const GameLog = ({ entries }: GameLogProps) => {
  return (
    <div className="rounded-lg p-3 h-full overflow-y-auto" style={{
      background: 'hsl(var(--card) / 0.8)',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="w-5 h-5 text-ether" />
        <h3 className="font-display text-base font-semibold text-foreground">
          Chroniques
        </h3>
      </div>
      
      <div className="space-y-2">
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
    </div>
  );
};

export default GameLog;
