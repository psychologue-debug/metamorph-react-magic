import { useMemo } from 'react';
import { GameState } from '@/types/game';
import PlayerPanel from './PlayerPanel';
import CentralZone from './CentralZone';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerIndex: number;
}

function getPlayerPositions(count: number): { x: number; y: number; angle: number }[] {
  const positions: { x: number; y: number; angle: number }[] = [];
  // Place current player at bottom center, others distributed around
  const angleOffset = -90; // Start from top
  
  for (let i = 0; i < count; i++) {
    const angle = angleOffset + (i * 360) / count;
    const radian = (angle * Math.PI) / 180;
    // Elliptical placement — wider than tall
    const rx = 38; 
    const ry = 36;
    const x = 50 + rx * Math.cos(radian);
    const y = 50 + ry * Math.sin(radian);
    positions.push({ x, y, angle });
  }
  
  return positions;
}

const GameBoard = ({ gameState, currentPlayerIndex }: GameBoardProps) => {
  const positions = useMemo(
    () => getPlayerPositions(gameState.players.length),
    [gameState.players.length]
  );

  // Reorder so current player is at bottom
  const reorderedIndices = useMemo(() => {
    const indices: number[] = [];
    const count = gameState.players.length;
    // Put current player at bottom (index that maps to ~270° position)
    const bottomSlot = Math.floor(count * 0.5); // halfway around = bottom
    for (let i = 0; i < count; i++) {
      indices.push((currentPlayerIndex + i) % count);
    }
    return indices;
  }, [currentPlayerIndex, gameState.players.length]);

  return (
    <div className="relative w-full h-full marble-texture overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Ambient glow */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, hsl(var(--ether) / 0.3) 0%, transparent 70%)`,
          }}
        />
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-5"
          style={{
            background: `radial-gradient(circle at top left, hsl(var(--divine)) 0%, transparent 70%)`,
          }}
        />
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5"
          style={{
            background: `radial-gradient(circle at bottom right, hsl(var(--reaction)) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Player panels arranged in circle */}
      {reorderedIndices.map((playerIndex, slotIndex) => (
        <PlayerPanel
          key={gameState.players[playerIndex].id}
          player={gameState.players[playerIndex]}
          isActive={playerIndex === gameState.activePlayerIndex}
          isCurrentPlayer={playerIndex === currentPlayerIndex}
          position={positions[slotIndex]}
          index={slotIndex}
        />
      ))}

      {/* Central Zone */}
      <CentralZone gameState={gameState} />
    </div>
  );
};

export default GameBoard;
