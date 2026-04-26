import { useState } from 'react';
import { Player, GameState, DIVINITIES, Mortal } from '@/types/game';
import EtherCounter from './EtherCounter';
import CeresLayout from './CeresLayout';
import VenusLayout from './VenusLayout';
import ApollonLayout from './ApollonLayout';
import NeptuneLayout from './NeptuneLayout';
import MinerveLayout from './MinerveLayout';
import DianeLayout from './DianeLayout';
import BacchusLayout from './BacchusLayout';
import { motion } from 'framer-motion';
import { Shield, RefreshCw } from 'lucide-react';

interface PlayerPanelProps {
  player: Player;
  gameState: GameState;
  isActive: boolean;
  index: number;
  compact?: boolean;
  canSeeReactions?: boolean;
  onMortalClick?: (mortalId: string) => void;
  onMortalHover?: (mortal: Mortal | null) => void;
}

const PlayerPanel = ({ player, gameState, isActive, index, compact = false, canSeeReactions = false, onMortalClick, onMortalHover }: PlayerPanelProps) => {
  const divinity = DIVINITIES[player.divinity];
  const [hoveredReactionIdx, setHoveredReactionIdx] = useState<number | null>(null);

  return (
    <motion.div
      className={`flex flex-col items-stretch h-full ${isActive ? 'ring-2 ring-ether/50 rounded-xl' : ''}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div
        className="rounded-xl p-2 sm:p-3 h-full flex flex-col"
        style={{
          background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--secondary) / 0.9))`,
          backdropFilter: 'blur(8px)',
          border: isActive ? '1px solid hsl(var(--ether) / 0.4)' : '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 shrink-0">
          <div
            className="w-6 h-8 sm:w-8 sm:h-10 rounded-md flex items-center justify-center border-2 shrink-0 overflow-hidden"
            style={{
              borderColor: isActive ? 'hsl(var(--ether))' : 'hsl(var(--border) / 0.5)',
              background: `linear-gradient(135deg, hsl(${divinity.color} / 0.3), hsl(var(--card)))`,
            }}
          >
            {divinity.image ? (
              <img src={divinity.image} alt={divinity.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-bold text-foreground text-xs sm:text-sm">{player.avatar}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-foreground truncate text-sm sm:text-base">{player.name}</h3>
          </div>
          <EtherCounter amount={player.ether} size="sm" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 text-xs sm:text-sm shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <RefreshCw className="text-ether w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-display text-foreground font-bold">{player.metamorphosedCount}/10</span>
          </div>
          <div className="flex items-center gap-1 relative">
            {[0, 1].map((slot) => (
              <div
                key={slot}
                className="w-5 h-7 rounded-sm border cursor-default"
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
                onMouseEnter={() => canSeeReactions && slot < player.reactions.length && setHoveredReactionIdx(slot)}
                onMouseLeave={() => setHoveredReactionIdx(null)}
              />
            ))}
            {/* VEN-04 tooltip: show reaction card on hover */}
            {canSeeReactions && hoveredReactionIdx !== null && hoveredReactionIdx < player.reactions.length && (
              <div
                className="absolute z-50 left-12 top-0 p-2 rounded-lg border text-xs min-w-[180px]"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--reaction) / 0.5)',
                  boxShadow: '0 0 12px hsl(var(--reaction) / 0.3)',
                }}
              >
                <div className="font-display font-bold text-foreground">{player.reactions[hoveredReactionIdx].name}</div>
                <div className="text-muted-foreground mt-1">Coût: {player.reactions[hoveredReactionIdx].cost} Éther</div>
                <div className="text-foreground mt-1">{player.reactions[hoveredReactionIdx].description}</div>
                <div className="text-[10px] text-reaction mt-1 italic">👁 Oiseaux de Vénus</div>
              </div>
            )}
          </div>
          <span className="text-muted-foreground">{player.hand.length} cartes</span>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {(() => {
            const layoutProps = {
              mortals: player.mortals,
              owner: player,
              gameState: gameState,
              selectable: !!onMortalClick,
              onMortalClick,
              onMortalHover,
            };
            const layouts: Record<string, React.FC<any>> = {
              ceres: CeresLayout, venus: VenusLayout, apollon: ApollonLayout,
              neptune: NeptuneLayout, minerve: MinerveLayout, diane: DianeLayout, bacchus: BacchusLayout,
            };
            const Layout = layouts[player.divinity] || CeresLayout;
            return <Layout {...layoutProps} />;
          })()}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerPanel;
