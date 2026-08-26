import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TurnStartOverlayProps {
  /** True when it is the local player's turn. */
  isOwnTurn: boolean;
  /** Changes whenever a new turn starts (used to re-trigger the popup). */
  turnKey: string | number;
}

/** Brief "C'est votre tour" banner shown for ~1s when the local player's turn begins. */
const TurnStartOverlay = ({ isOwnTurn, turnKey }: TurnStartOverlayProps) => {
  const [visible, setVisible] = useState(false);
  const lastKey = useRef<string | number | null>(null);

  useEffect(() => {
    if (!isOwnTurn) return;
    if (lastKey.current === turnKey) return;
    lastKey.current = turnKey;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(t);
  }, [isOwnTurn, turnKey]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[99998] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="px-10 py-5 rounded-2xl font-display text-3xl font-bold"
            style={{
              background: 'hsl(var(--card) / 0.95)',
              border: '2px solid hsl(var(--divine) / 0.6)',
              color: 'hsl(var(--divine-glow))',
              boxShadow: '0 0 40px hsl(var(--divine) / 0.35)',
            }}
            initial={{ scale: 0.8, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9 }}
          >
            C'est votre tour
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TurnStartOverlay;
