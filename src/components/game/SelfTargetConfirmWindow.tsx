// === Self-Target Confirmation Window ===
// Warns the player when they are about to apply a harmful effect
// (incapacitation / removal from game / retromorphose) to ONE OF THEIR OWN mortals.

import { motion } from 'framer-motion';
import { AlertTriangle, Check, X } from 'lucide-react';

interface SelfTargetConfirmWindowProps {
  mortalName: string;
  actionLabel: string;
  onResolve: (confirmed: boolean) => void;
}

const SelfTargetConfirmWindow = ({ mortalName, actionLabel, onResolve }: SelfTargetConfirmWindowProps) => {
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
          border: '1px solid hsl(0 70% 50% / 0.5)',
          boxShadow: '0 0 40px hsl(0 70% 50% / 0.3)',
        }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(0 75% 55%)' }} />
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">Attention</h2>
        <p className="text-lg font-display text-foreground mb-6">
          Vous êtes sur le point de <strong style={{ color: 'hsl(0 75% 60%)' }}>{actionLabel}</strong> votre propre mortel{' '}
          <strong>{mortalName}</strong>, êtes-vous sûr ?
        </p>
        <div className="flex gap-3">
          <motion.button
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display text-base font-bold"
            style={{ background: 'linear-gradient(135deg, hsl(0 70% 45%), hsl(0 70% 35%))', color: 'white' }}
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

export default SelfTargetConfirmWindow;
