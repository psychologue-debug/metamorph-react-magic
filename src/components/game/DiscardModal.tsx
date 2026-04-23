import { SpellCard } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check } from 'lucide-react';

interface DiscardModalProps {
  hand: SpellCard[];
  reactions?: SpellCard[];
  excessCount: number;
  onConfirm: (cardIds: string[]) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  playerName?: string;
  allowReactions?: boolean;
}

const DiscardModal = ({ hand, reactions = [], excessCount, onConfirm, onCancel, title, description, playerName, allowReactions = true }: DiscardModalProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allCards = [
    ...hand.map(c => ({ ...c, source: 'hand' as const })),
    ...(allowReactions ? reactions.map(c => ({ ...c, source: 'reaction' as const })) : []),
  ];

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
        className="fixed inset-0 z-[100001] flex items-center justify-center"
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
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            {title || 'Défausse obligatoire'}
          </h2>
          {playerName && (
            <p className="text-lg font-display font-semibold mb-1" style={{ color: 'hsl(var(--divine))' }}>{playerName}</p>
          )}
          <p className="text-lg text-muted-foreground mb-6 font-body">
            {description || `Vous avez ${allCards.length} cartes. Sélectionnez ${excessCount} carte${excessCount > 1 ? 's' : ''} à défausser.`}
          </p>
          <div className="flex flex-col gap-2 mb-6 max-h-64 overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {allCards.map((card) => (
              <motion.button
                key={card.id}
                className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                  selected.has(card.id) ? 'border-destructive ring-2 ring-destructive/30 opacity-70' : 'border-border/50 hover:border-foreground/40'
                }`}
                style={{ background: selected.has(card.id) ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--secondary) / 0.5)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(card.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display text-sm font-bold text-foreground">{card.name}</span>
                    <span className="text-xs font-display font-bold text-ether ml-2">{card.cost} Éther</span>
                    <span className="text-xs text-muted-foreground/70 italic ml-2">
                      {card.source === 'reaction' ? '(Réaction posée)' : '(Main)'}
                    </span>
                  </div>
                  {selected.has(card.id) && <Check className="w-4 h-4 text-destructive" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
              </motion.button>
            ))}
          </div>
          <div className="flex justify-center gap-4">
            {onCancel && (
              <motion.button
                className="px-6 py-3 rounded-xl font-display text-lg font-bold border border-border/50"
                style={{
                  background: 'hsl(var(--muted))',
                  color: 'hsl(var(--foreground))',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
              >
                Annuler
              </motion.button>
            )}
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
