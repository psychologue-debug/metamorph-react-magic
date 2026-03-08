import { Player, GameState, DIVINITIES, Mortal } from '@/types/game';
import EtherCounter from './EtherCounter';
import MortalGrid from './MortalGrid';
import { motion } from 'framer-motion';
import { Shield, RefreshCw } from 'lucide-react';

interface PlayerPanelProps {
  player: Player;
  gameState: GameState;
  isActive: boolean;
  index: number;
  compact?: boolean;
  onMortalClick?: (mortalId: string) => void;
  onMortalHover?: (mortal: Mortal | null) => void;
}

const PlayerPanel = ({ player, gameState, isActive, index, compact = false, onMortalClick, onMortalHover }: PlayerPanelProps) => {
  const divinity = DIVINITIES[player.divinity];
  const tokenSize = compact ? 50 : 64;

  return (
    <motion.div
      className={`flex flex-col items-stretch h-full ${isActive ? 'ring-2 ring-ether/50 rounded-xl' : ''}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div
        className="rounded-xl p-3 h-full flex flex-col"
        style={{
          background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--secondary) / 0.9))`,
          backdropFilter: 'blur(8px)',
          border: isActive ? '1px solid hsl(var(--ether) / 0.4)' : '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 overflow-hidden"
            style={{
              borderColor: isActive ? 'hsl(var(--ether))' : 'hsl(var(--border) / 0.5)',
              background: `linear-gradient(135deg, hsl(${divinity.color} / 0.3), hsl(var(--card)))`,
            }}
          >
            {divinity.image ? (
              <img src={divinity.image} alt={divinity.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-bold text-foreground text-sm">{player.avatar}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-foreground truncate text-base">{player.name}</h3>
          </div>
          <EtherCounter amount={player.ether} size="sm" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-2 text-sm shrink-0">
          <div className="flex items-center gap-1">
            <RefreshCw className="text-ether w-4 h-4" />
            <span className="font-display text-foreground font-bold">{player.metamorphosedCount}/10</span>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1].map((slot) => (
              <div
                key={slot}
                className="w-5 h-7 rounded-sm border"
                style={
                  slot < player.reactions.length
                    ? {
                        background: 'linear-gradient(135deg, hsl(var(--reaction)), hsl(var(--reaction) / 0.7))',
                        border: '1px solid hsl(var(--reaction) / 0.8)',
                        boxShadow: '0 0 6px hsl(var(--reaction) / 0.4)',
                      }
                    : {
                        background: 'hsl(var(--secondary) / 0.4)',
                        border: '1px dashed hsl(var(--reaction) / 0.3)',
                      }
                }
              />
            ))}
          </div>
          <span className="text-muted-foreground">{player.hand.length} cartes</span>
        </div>

        {/* Mortal Grid — fills remaining space */}
        <div className="flex-1 grid grid-cols-5 place-content-center gap-1 overflow-hidden">
          <MortalGrid
            mortals={player.mortals}
            owner={player}
            gameState={gameState}
            tokenSize={tokenSize}
            targetingMode={!!onMortalClick}
            onMortalClick={onMortalClick}
            onMortalHover={onMortalHover}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerPanel;
