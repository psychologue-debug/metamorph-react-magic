import { SpellCard } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import GameCard from './GameCard';
import { useState } from 'react';

interface DiscardModalProps {
  hand: SpellCard[];
  excessCount: number;
  onConfirm: (cardIds: string[]) => void;
}

const DiscardModal = ({ hand, excessCount, onConfirm }: DiscardModalProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < excessCount) next.add(id);
      return next;
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'hsla(0 0% 0% / 0.7)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="rounded-2xl p-8 max-w-lg w-full mx-4"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Défausse obligatoire</h2>
          <p className="text-lg text-muted-foreground mb-6 font-body">
            Vous avez {hand.length} cartes en main. Sélectionnez {excessCount} carte{excessCount > 1 ? 's' : ''} à défausser.
          </p>
          <div className="flex gap-3 flex-wrap justify-center mb-6">
            {hand.map((card) => (
              <div
                key={card.id}
                className={`cursor-pointer transition-all rounded-lg ${selected.has(card.id) ? 'ring-3 ring-red-500 scale-105 opacity-60' : ''}`}
                onClick={() => toggle(card.id)}
              >
                <GameCard card={card} />
              </div>
            ))}
          </div>
          <div className="text-center">
            <motion.button
              className="px-8 py-3 rounded-xl font-display text-lg font-bold disabled:opacity-40"
              style={{
                background: selected.size === excessCount
                  ? 'linear-gradient(135deg, hsl(0 70% 50%), hsl(0 60% 40%))'
                  : 'hsl(var(--muted))',
                color: 'hsl(var(--primary-foreground))',
              }}
              disabled={selected.size !== excessCount}
              whileHover={selected.size === excessCount ? { scale: 1.05 } : {}}
              whileTap={selected.size === excessCount ? { scale: 0.95 } : {}}
              onClick={() => onConfirm(Array.from(selected))}
            >
              Défausser ({selected.size}/{excessCount})
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DiscardModal;
