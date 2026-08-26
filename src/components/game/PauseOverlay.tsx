import { motion, AnimatePresence } from 'framer-motion';
import { Play, PauseCircle } from 'lucide-react';

interface PauseOverlayProps {
  pausedBy: string | null;
  onResume: () => void;
}

/** Full-screen blocking overlay shown while the game is paused. Anyone can resume. */
const PauseOverlay = ({ pausedBy, onResume }: PauseOverlayProps) => (
  <AnimatePresence>
    {pausedBy !== null && (
      <motion.div
        className="fixed inset-0 z-[99997] flex flex-col items-center justify-center gap-6 backdrop-blur-md"
        style={{ background: 'hsl(var(--background) / 0.8)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <PauseCircle className="w-16 h-16 text-ether" />
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground tracking-wider">Partie en pause</h2>
          <p className="font-body text-muted-foreground mt-2 italic">
            Mise en pause par {pausedBy}. Vous pouvez fermer l'onglet et revenir plus tard avec le code de la partie.
          </p>
        </div>
        <button
          onClick={onResume}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-display text-sm font-bold uppercase tracking-widest"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          <Play className="w-4 h-4" />
          Reprendre
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default PauseOverlay;
