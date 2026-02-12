import { SpellCard, Player, GameState } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import GameCard from './GameCard';
import { toast } from 'sonner';

interface ReactionDialogProps {
  card: SpellCard;
  player: Player;
  gameState: GameState;
  onPlay: () => void;
  onPlaceFaceDown: () => void;
  onCancel: () => void;
}

const ReactionDialog = ({ card, player, gameState, onPlay, onPlaceFaceDown, onCancel }: ReactionDialogProps) => {
  const canPlaceFaceDown = player.reactions.length < 2;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'hsla(0 0% 0% / 0.6)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="rounded-2xl p-8 max-w-md w-full mx-4"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--reaction) / 0.4)',
            boxShadow: '0 0 30px hsl(var(--reaction) / 0.2)',
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">Carte Réaction</h2>
          <div className="flex justify-center mb-6">
            <GameCard card={card} />
          </div>
          <p className="text-lg text-muted-foreground mb-6 font-body text-center">
            {card.description}
          </p>
          <div className="flex flex-col gap-3">
            <motion.button
              className="w-full px-6 py-3 rounded-xl font-display text-lg font-bold"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--reaction)), hsl(var(--reaction) / 0.7))',
                color: 'white',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPlay}
            >
              ⚡ Lancer maintenant
            </motion.button>
            <motion.button
              className="w-full px-6 py-3 rounded-xl font-display text-lg font-bold border disabled:opacity-40"
              style={{
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                background: 'hsl(var(--secondary))',
              }}
              disabled={!canPlaceFaceDown}
              whileHover={canPlaceFaceDown ? { scale: 1.02 } : {}}
              whileTap={canPlaceFaceDown ? { scale: 0.98 } : {}}
              onClick={onPlaceFaceDown}
            >
              🔮 Poser face cachée {!canPlaceFaceDown && '(max 2)'}
            </motion.button>
            <motion.button
              className="w-full px-6 py-3 rounded-xl font-display text-lg text-muted-foreground"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
            >
              Annuler
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReactionDialog;
