import { SpellCard } from '@/types/game';
import { motion } from 'framer-motion';
import { Flame, Shield, Eye, Sparkles } from 'lucide-react';

interface GameCardProps {
  card: SpellCard;
  faceDown?: boolean;
  small?: boolean;
  onClick?: () => void;
}

const cardIcons: Record<string, React.ReactNode> = {
  'Boule de Feu': <Flame className="w-3 h-3" />,
  'Égide d\'Athéna': <Shield className="w-3 h-3" />,
  'Oracle': <Eye className="w-3 h-3" />,
};

const GameCard = ({ card, faceDown = false, small = false, onClick }: GameCardProps) => {
  if (faceDown) {
    return (
      <motion.div
        className={`${small ? 'w-10 h-14' : 'w-16 h-22'} card-reaction rounded-lg cursor-pointer flex items-center justify-center`}
        whileHover={{ scale: 1.08, y: -4 }}
        onClick={onClick}
      >
        <div className="text-reaction text-lg font-display">?</div>
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            border: '1px solid hsl(var(--reaction) / 0.4)',
          }}
        />
      </motion.div>
    );
  }

  const isReaction = card.type === 'reaction';

  return (
    <motion.div
      className={`
        ${small ? 'w-10 h-14 p-1' : 'w-20 h-28 p-2'} 
        ${isReaction ? 'card-reaction' : 'card-spell'} 
        rounded-lg cursor-pointer flex flex-col
      `}
      whileHover={{ scale: 1.08, y: -8 }}
      onClick={onClick}
      layout
    >
      {/* Cost badge */}
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-ether font-display font-bold" style={{ fontSize: small ? '8px' : '10px' }}>
          {card.cost > 0 ? card.cost : ''}
        </span>
        {cardIcons[card.name] || <Sparkles className={small ? 'w-2 h-2' : 'w-3 h-3'} style={{ color: 'hsl(var(--divine))' }} />}
      </div>
      
      {/* Name */}
      <div className={`font-display font-semibold leading-tight ${small ? 'text-[6px]' : 'text-[9px]'} text-foreground`}>
        {card.name}
      </div>

      {!small && (
        <div className="mt-auto">
          <p className="text-[7px] text-muted-foreground leading-tight line-clamp-2">
            {card.description}
          </p>
        </div>
      )}

      {/* Type indicator */}
      {isReaction && (
        <div
          className="absolute top-0 right-0 w-2 h-2 rounded-full"
          style={{ background: 'hsl(var(--reaction))' }}
        />
      )}
    </motion.div>
  );
};

export default GameCard;
