// === Cénée Choice Window (NEP-09) ===
// Offered to the Neptune defender when an enemy retromorphoses one of their mortals
// and Cénée is metamorphosed: choose to retromorphose Cénée instead.

import { CeneeChoiceState } from '@/types/game';
import { motion } from 'framer-motion';
import { Waves, Check, X } from 'lucide-react';

interface CeneeChoiceWindowProps {
  choice: CeneeChoiceState;
  onResolve: (useCenee: boolean) => void;
}

const CeneeChoiceWindow = ({ choice, onResolve }: CeneeChoiceWindowProps) => {
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
          border: '1px solid hsl(195 70% 45% / 0.5)',
          boxShadow: '0 0 40px hsl(195 70% 45% / 0.3)',
        }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <Waves className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(195 70% 50%)' }} />
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Cénée</h2>
        <p className="text-muted-foreground font-body mb-2">
          {choice.attackerName} va rétromorphoser <strong>{choice.targetName}</strong>.
        </p>
        <p className="text-lg font-display text-foreground mb-6">
          Souhaitez-vous rétromorphoser <strong style={{ color: 'hsl(195 70% 55%)' }}>Cénée</strong> à la place ?
        </p>
        <div className="flex gap-3">
          <motion.button
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, hsl(195 70% 45%), hsl(195 70% 35%))',
              color: 'white',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onResolve(true)}
          >
            <Check className="w-5 h-5" />
            OUI
          </motion.button>
          <motion.button
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display text-base font-bold border border-border/50 text-muted-foreground"
            style={{ background: 'hsl(var(--muted))' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onResolve(false)}
          >
            <X className="w-5 h-5" />
            NON
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CeneeChoiceWindow;
