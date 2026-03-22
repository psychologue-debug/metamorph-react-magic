import { Mortal, Player, GameState } from '@/types/game';
import BoardToken from './BoardToken';
import { useIsMobile } from '@/hooks/use-mobile';

export interface GodLayoutProps {
  mortals: Mortal[];
  owner: Player;
  gameState: GameState;
  selectable?: boolean;
  onMortalClick?: (mortalId: string) => void;
  onMortalHover?: (mortal: Mortal | null) => void;
}

export interface ConnectionDef {
  from: string;
  to: string;
  color: string;
}

interface GodLayoutInternalProps extends GodLayoutProps {
  positions: Record<string, { x: number; y: number }>;
  connections: ConnectionDef[];
  tokenSize?: number;
}

const PADDING = 25;

const GodLayout = ({ mortals, owner, gameState, selectable, onMortalClick, onMortalHover, positions, connections, tokenSize = 140 }: GodLayoutInternalProps) => {
  const isMobile = useIsMobile();
  const effectiveSize = isMobile ? Math.min(tokenSize, 80) : tokenSize;

  return (
    <div className="relative w-full h-full" style={{ padding: isMobile ? 10 : PADDING }}>
      <div className="relative w-full h-full">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((conn, i) => {
            const pFrom = positions[conn.from];
            const pTo = positions[conn.to];
            if (!pFrom || !pTo) return null;
            return (
              <line
                key={i}
                x1={`${pFrom.x}%`} y1={`${pFrom.y}%`}
                x2={`${pTo.x}%`} y2={`${pTo.y}%`}
                stroke={conn.color}
                strokeWidth={isMobile ? 3 : 5}
                strokeOpacity="0.55"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {mortals.map((mortal) => {
          const pos = positions[mortal.code];
          if (!pos) return null;
          return (
            <div key={mortal.id} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
              <BoardToken
                mortal={mortal}
                owner={owner}
                gameState={gameState}
                size={effectiveSize}
                selectable={selectable}
                onClick={onMortalClick}
                onHover={onMortalHover}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GodLayout;
