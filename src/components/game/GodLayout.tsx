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
  /** 'arrow' adds an arrowhead at the `to` end. */
  style?: 'plain' | 'arrow' | 'dashed';
  /** Curvature in % of board size (positive = curve to the right of from→to direction). */
  curve?: number;
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
            <defs>
              {connections.filter(c => c.style === 'arrow').map((conn, i) => (
                <marker
                  key={`m-${i}`}
                  id={`arrow-${conn.from}-${conn.to}-${i}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={conn.color} opacity="0.75" />
                </marker>
              ))}
            </defs>
            {connections.map((conn, i) => {
              const pFrom = positions[conn.from];
              const pTo = positions[conn.to];
              if (!pFrom || !pTo) return null;
              const stroke = conn.color;
              const strokeWidth = Math.max(2, Math.round(tokenSize * 0.04));
              const dash = conn.style === 'dashed' ? `${strokeWidth * 3} ${strokeWidth * 2}` : undefined;
              const markerEnd = conn.style === 'arrow' ? `url(#arrow-${conn.from}-${conn.to}-${i})` : undefined;

              // Shorten the line slightly so it doesn't dive into the token center.
              // Token radius in % of board (assume square-ish board; use width).
              const rPctX = innerW > 0 ? (tokenSize / 2 / size.w) * 100 : 0;
              const rPctY = innerH > 0 ? (tokenSize / 2 / size.h) * 100 : 0;
              const dx = pTo.x - pFrom.x;
              const dy = pTo.y - pFrom.y;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len, uy = dy / len;
              const x1 = pFrom.x + ux * rPctX * 0.9;
              const y1 = pFrom.y + uy * rPctY * 0.9;
              const x2 = pTo.x - ux * rPctX * 1.05;
              const y2 = pTo.y - uy * rPctY * 1.05;

              if (conn.curve) {
                // perpendicular offset
                const px = -uy, py = ux;
                const cx = (x1 + x2) / 2 + px * conn.curve;
                const cy = (y1 + y2) / 2 + py * conn.curve;
                return (
                  <path
                    key={i}
                    d={`M ${x1}% ${y1}% Q ${cx}% ${cy}% ${x2}% ${y2}%`}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeOpacity="0.65"
                    strokeLinecap="round"
                    strokeDasharray={dash}
                    fill="none"
                    markerEnd={markerEnd}
                  />
                );
              }
              return (
                <line
                  key={i}
                  x1={`${x1}%`} y1={`${y1}%`}
                  x2={`${x2}%`} y2={`${y2}%`}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeOpacity="0.65"
                  strokeLinecap="round"
                  strokeDasharray={dash}
                  markerEnd={markerEnd}
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
