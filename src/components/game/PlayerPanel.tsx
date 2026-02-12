import { Player, DIVINITIES } from '@/types/game';
import EtherCounter from './EtherCounter';
import MortalGrid from './MortalGrid';
import GameCard from './GameCard';
import { motion } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';

interface PlayerPanelProps {
  player: Player;
  isActive: boolean;
  index: number;
  compact?: boolean;
}

const PlayerPanel = ({ player, isActive, index, compact = false }: PlayerPanelProps) => {
  const divinity = DIVINITIES[player.divinity];
  const tokenSize = compact ? 48 : 144;

  return (
    <motion.div
      className={`flex flex-col items-center gap-1 ${isActive ? 'ring-2 ring-ether/50 rounded-xl' : ''}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div
        className={`rounded-xl transition-all duration-300 ${compact ? 'p-2' : 'p-5'}`}
        style={{
          background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--secondary) / 0.9))`,
          backdropFilter: 'blur(8px)',
          border: isActive ? '1px solid hsl(var(--ether) / 0.4)' : '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        {/* Header row */}
        <div className={`flex items-center gap-2 ${compact ? 'mb-1' : 'mb-4'}`}>
          <div
            className={`${compact ? 'w-8 h-8' : 'w-14 h-14'} rounded-full flex items-center justify-center border-2 ${isActive ? 'border-ether' : 'border-border/50'}`}
            style={{
              background: `linear-gradient(135deg, hsl(${divinity.color} / 0.3), hsl(var(--card)))`,
            }}
          >
            <span className={`font-display font-bold text-foreground ${compact ? 'text-sm' : 'text-xl'}`}>{player.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-display font-bold text-foreground truncate ${compact ? 'text-sm' : 'text-xl'}`}>{player.name}</h3>
            {!compact && <p className="text-base text-muted-foreground font-body italic">{divinity.title}</p>}
          </div>
          <EtherCounter amount={player.ether} size={compact ? 'sm' : 'md'} />
        </div>

        {/* Stats row */}
        <div className={`flex items-center gap-2 ${compact ? 'mb-1 text-xs' : 'mb-4 text-base'}`}>
          <div className="flex items-center gap-1">
            <Zap className={`text-ether ${compact ? 'w-3 h-3' : 'w-5 h-5'}`} />
            <span className="font-display text-foreground font-bold">{player.metamorphosedCount}/10</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className={`text-reaction ${compact ? 'w-3 h-3' : 'w-5 h-5'}`} />
            <span className="text-muted-foreground">{player.reactions.length}</span>
          </div>
          <span className="text-muted-foreground">{player.hand.length} cartes</span>
        </div>

        {/* Mortal Grid */}
        <MortalGrid mortals={player.mortals} tokenSize={tokenSize} />

        {/* Reaction cards indicator */}
        {player.reactions.length > 0 && !compact && (
          <div className="mt-3 flex gap-2 justify-center">
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
