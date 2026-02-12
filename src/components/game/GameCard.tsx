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
  'Boule de Feu': <Flame className="w-3.5 h-3.5" />,
  'Égide d\'Athéna': <Shield className="w-3.5 h-3.5" />,
  'Oracle': <Eye className="w-3.5 h-3.5" />,
};

const GameCard = ({ card, faceDown = false, small = false, onClick }: GameCardProps) => {
  if (faceDown) {
    return (
      <motion.div
        className={`${small ? 'w-12 h-16' : 'w-20 h-28'} card-reaction rounded-lg cursor-pointer flex items-center justify-center`}
        whileHover={{ scale: 1.08, y: -4 }}
        onClick={onClick}
      >
        <div className="text-reaction text-xl font-display">?</div>
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
        ${small ? 'w-12 h-16 p-1' : 'w-24 h-32 p-2'} 
        ${isReaction ? 'card-reaction' : 'card-spell'} 
        rounded-lg cursor-pointer flex flex-col
      `}
      whileHover={{ scale: 1.08, y: -8 }}
      onClick={onClick}
      layout
    >
      {/* Cost badge */}
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-ether font-display font-bold" style={{ fontSize: small ? '10px' : '12px' }}>
          {card.cost > 0 ? card.cost : ''}
        </span>
        {cardIcons[card.name] || <Sparkles className={small ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} style={{ color: 'hsl(var(--divine))' }} />}
      </div>
      
      {/* Name */}
      <div className={`font-display font-semibold leading-tight ${small ? 'text-[7px]' : 'text-[10px]'} text-foreground`}>
        {card.name}
      </div>

      {!small && (
        <div className="mt-auto">
          <p className="text-[8px] text-muted-foreground leading-tight line-clamp-3">
            {card.description}
          </p>
        </div>
      )}

      {/* Type indicator */}
      {isReaction && (
        <div
          className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full"
          style={{ background: 'hsl(var(--reaction))' }}
        />
      )}
    </motion.div>
  );
};

export default GameCard;
