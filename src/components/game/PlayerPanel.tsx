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
}

const PlayerPanel = ({ player, isActive, index }: PlayerPanelProps) => {
  const divinity = DIVINITIES[player.divinity];

  return (
    <motion.div
      className={`flex flex-col items-center gap-1.5 ${isActive ? 'ring-2 ring-ether/50 rounded-xl' : ''}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div
        className="rounded-xl p-4 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--secondary) / 0.9))`,
          backdropFilter: 'blur(8px)',
          border: isActive ? '1px solid hsl(var(--ether) / 0.4)' : '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-ether' : 'border-border/50'}`}
            style={{
              background: `linear-gradient(135deg, hsl(${divinity.color} / 0.3), hsl(var(--card)))`,
            }}
          >
            <span className="font-display text-sm font-bold text-foreground">{player.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground truncate">{player.name}</h3>
            <p className="text-[10px] text-muted-foreground font-body italic">{divinity.title}</p>
          </div>
          <EtherCounter amount={player.ether} size="sm" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3 text-[10px]">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-ether" />
            <span className="font-display text-foreground">{player.metamorphosedCount}/10</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-reaction" />
            <span className="text-muted-foreground">{player.reactions.length} réactions</span>
          </div>
          <span className="text-muted-foreground">{player.hand.length} cartes</span>
        </div>

        {/* Mortal Grid — tripled token size */}
        <MortalGrid mortals={player.mortals} tokenSize={48} />

        {/* Reaction cards indicator */}
        {player.reactions.length > 0 && (
          <div className="mt-3 flex gap-1.5 justify-center">
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
