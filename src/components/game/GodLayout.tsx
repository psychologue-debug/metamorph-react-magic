import { Mortal, Player, GameState } from '@/types/game';
import BoardToken from './BoardToken';
import { useEffect, useRef, useState } from 'react';
import { useDisplayPreferences } from '@/hooks/useDisplayPreferences';

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
  /** Token diameter as a fraction of inner board width. Default 0.14 (~14%). */
  tokenRatio?: number;
  /** Min/max diameter clamps in px. */
  minTokenSize?: number;
  maxTokenSize?: number;
}

const GodLayout = ({
  mortals, owner, gameState, selectable, onMortalClick, onMortalHover,
  positions, connections,
  tokenRatio = 0.14, minTokenSize = 28, maxTokenSize = 140,
}: GodLayoutInternalProps) => {
  const { showLinks } = useDisplayPreferences();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setSize({ w: width, h: height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Padding ~3% of the smaller dimension keeps tokens visible at every scale.
  const minDim = Math.min(size.w, size.h);
  const padding = Math.max(4, Math.round(minDim * 0.03));
  const innerW = Math.max(0, size.w - padding * 2);
  const innerH = Math.max(0, size.h - padding * 2);
  const innerMin = Math.min(innerW, innerH);
  const tokenSize = Math.round(
    Math.max(minTokenSize, Math.min(maxTokenSize, innerMin * tokenRatio))
  );

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ padding }}>
      <div className="relative w-full h-full">
        {showLinks && (
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
                  strokeWidth={Math.max(2, Math.round(tokenSize * 0.04))}
                  strokeOpacity="0.55"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        )}

        {mortals.map((mortal) => {
          const pos = positions[mortal.code];
          if (!pos) return null;
          return (
            <div key={mortal.id} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
              <BoardToken
                mortal={mortal}
                owner={owner}
                gameState={gameState}
                size={tokenSize}
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
