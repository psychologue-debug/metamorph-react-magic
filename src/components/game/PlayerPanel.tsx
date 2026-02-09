import { Player, DIVINITIES } from '@/types/game';
import EtherCounter from './EtherCounter';
import MortalGrid from './MortalGrid';
import GameCard from './GameCard';
import { motion } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';

interface PlayerPanelProps {
  player: Player;
  isActive: boolean;
  isCurrentPlayer: boolean;
  position: { x: number; y: number; angle: number };
  index: number;
}

const PlayerPanel = ({ player, isActive, isCurrentPlayer, position, index }: PlayerPanelProps) => {
  const divinity = DIVINITIES[player.divinity];
  
  return (
    <motion.div
      className={`absolute flex flex-col items-center gap-1`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: 'spring' }}
    >
      {/* Player Avatar */}
      <motion.div
        className={`player-ring ${isActive ? 'active' : ''} w-12 h-12 flex items-center justify-center relative`}
        style={{
          background: `linear-gradient(135deg, hsl(${divinity.color} / 0.3), hsl(var(--card)))`,
        }}
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="font-display text-sm font-bold text-foreground">
          {player.avatar}
        </span>
        
        {isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ background: 'hsl(var(--ether))' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Player Info Card */}
      <div className={`
        rounded-lg p-2 min-w-[140px] max-w-[160px] transition-all duration-300
        ${isActive ? 'ring-1 ring-ether/50' : ''}
        ${isCurrentPlayer ? 'ring-1 ring-divine/50' : ''}
      `}
        style={{
          background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--secondary) / 0.9))`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="text-center mb-1">
          <h3 className="font-display text-[10px] font-bold text-foreground truncate">
            {player.name}
          </h3>
          <p className="text-[8px] text-muted-foreground font-body italic">
            {divinity.title}
          </p>
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <EtherCounter amount={player.ether} size="sm" />
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-ether" />
              <span className="text-[9px] font-display text-foreground">
                {player.metamorphosedCount}/10
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-reaction" />
              <span className="text-[9px] text-muted-foreground">
                {player.reactions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Mortal Grid - compact */}
        <MortalGrid mortals={player.mortals} compact />

        {/* Hand (only visible for current player) */}
        {isCurrentPlayer && player.hand.length > 0 && (
          <div className="mt-1.5 flex gap-0.5 justify-center">
            {player.hand.map((card) => (
              <GameCard key={card.id} card={card} small />
            ))}
          </div>
        )}

        {/* Reaction cards indicator */}
        {player.reactions.length > 0 && (
          <div className="mt-1 flex gap-0.5 justify-center">
            {player.reactions.map((r) => (
              <GameCard key={r.id} card={r} faceDown small />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerPanel;
