import { Player } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface VictoryModalProps {
  winners: Player[];
  onClose: () => void;
}

const VictoryModal = ({ winners, onClose }: VictoryModalProps) => {
  if (winners.length === 0) return null;

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
          className="rounded-2xl p-10 text-center max-w-md w-full mx-4"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))',
            border: '2px solid hsl(var(--ether) / 0.5)',
            boxShadow: '0 0 60px hsl(var(--ether) / 0.3)',
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
        >
          <Trophy className="w-16 h-16 text-ether mx-auto mb-4" />
          <h2 className="font-display text-4xl font-bold text-foreground mb-4">Victoire !</h2>
          <div className="space-y-2 mb-8">
            {winners.map((w) => (
              <div key={w.id} className="font-display text-2xl font-bold text-ether">
                {w.avatar} {w.name}
              </div>
            ))}
          </div>
          <p className="text-lg text-muted-foreground mb-8 font-body">
            {winners.length > 1 ? 'ont métamorphosé tous leurs mortels !' : 'a métamorphosé tous ses mortels !'}
          </p>
          <motion.button
            className="px-8 py-3 rounded-xl font-display text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
              color: 'hsl(var(--primary-foreground))',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
          >
            Retour à l'accueil
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VictoryModal;
