// === Metamorphose Confirmation Window ===
// Asks the active player to confirm a metamorphosis before it happens.
// Clicking "NON" cancels entirely and triggers NO effect (friend or foe).
// A checkbox lets the player skip this confirmation for the rest of the game.

import { motion } from 'framer-motion';
import { Sparkles, Check, X } from 'lucide-react';
import { useState } from 'react';

interface MetamorphoseConfirmWindowProps {
  mortalName: string;
  onConfirm: (dontAskAgain: boolean) => void;
  onCancel: () => void;
}

const MetamorphoseConfirmWindow = ({ mortalName, onConfirm, onCancel }: MetamorphoseConfirmWindowProps) => {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-[100000] flex items-center justify-center"
      style={{ background: 'hsla(0 0% 0% / 0.85)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="rounded-2xl p-8 max-w-md w-full mx-4 text-center"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--ether) / 0.5)',
          boxShadow: '0 0 40px hsl(var(--ether) / 0.3)',
        }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-ether" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Métamorphose</h2>
        <p className="text-lg font-display text-foreground mb-6">
          Métamorphoser <strong className="text-ether">{mortalName}</strong> ?
        </p>

        <div className="flex gap-3 mb-5">
          <motion.button
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
              color: 'hsl(var(--primary-foreground))',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onConfirm(dontAskAgain)}
          >
            <Check className="w-5 h-5" />
            OUI
          </motion.button>
          <motion.button
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display text-base font-bold border border-border/50 text-muted-foreground"
            style={{ background: 'hsl(var(--muted))' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
            NON
          </motion.button>
        </div>

        <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[hsl(var(--ether))] cursor-pointer"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
          />
          Ne plus me demander pour le reste de la partie
        </label>
      </motion.div>
    </motion.div>
  );
};

export default MetamorphoseConfirmWindow;
