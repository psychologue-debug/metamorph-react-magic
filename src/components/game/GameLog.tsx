import { GameLogEntry } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GameLogProps {
  entries: GameLogEntry[];
  open: boolean;
}

const GameLog = ({ entries, open }: GameLogProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute top-0 right-0 z-[9990] w-72 max-h-[70vh] rounded-bl-lg"
          style={{
            background: 'hsl(var(--card) / 0.97)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid hsl(var(--border) / 0.4)',
            borderBottom: '1px solid hsl(var(--border) / 0.4)',
          }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          <ScrollArea className="max-h-[70vh]">
            <div className="p-3 space-y-2">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  className="flex items-start gap-2 text-sm font-body"
                  initial={i < 20 ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={i < 20 ? { delay: i * 0.03 } : undefined}
                >
                  <span className="text-ether font-display font-semibold whitespace-nowrap">
                    {entry.playerName}
                  </span>
                  <span className="text-muted-foreground">
                    {entry.detail}
                  </span>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameLog;
