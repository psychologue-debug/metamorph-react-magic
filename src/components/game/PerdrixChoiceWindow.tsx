// === Perdrie Choice Window (MIN-03) ===
// At cycle start, the owner of a metamorphosed Perdrie chooses which god (player)
// to steal Ether from. Shown only to the owner.

import { GameState, PerdrixChoiceState } from '@/types/game';
import { motion } from 'framer-motion';
import { Feather, Zap } from 'lucide-react';

interface PerdrixChoiceWindowProps {
  choice: PerdrixChoiceState;
  gameState: GameState;
  onResolve: (targetPlayerId: string) => void;
}

const PerdrixChoiceWindow = ({ choice, gameState, onResolve }: PerdrixChoiceWindowProps) => {
  const targets = gameState.players.filter(p => p.id !== choice.ownerPlayerId);

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
        <Feather className="w-12 h-12 mx-auto mb-4 text-ether" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">{choice.mortalName}</h2>
        <p className="text-lg font-display text-foreground mb-6">
          À quel dieu voulez-vous voler <strong className="text-ether">{choice.amount} Éther</strong> ?
        </p>
        <div className="flex flex-col gap-2">
          {targets.map(p => (
            <motion.button
              key={p.id}
              className="flex items-center justify-between gap-2 px-5 py-3 rounded-xl font-display text-base font-bold text-foreground border border-ether/40"
              style={{ background: 'hsl(var(--ether) / 0.12)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onResolve(p.id)}
            >
              <span className="truncate">{p.name}</span>
              <span className="flex items-center gap-1 text-ether shrink-0">
                <Zap className="w-4 h-4" />
                {p.ether}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PerdrixChoiceWindow;
