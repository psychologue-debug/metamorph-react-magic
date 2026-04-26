import { GameState } from '@/types/game';
import PlayerPanel from './PlayerPanel';
import CentralZone from './CentralZone';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerIndex: number;
  onMortalClick?: (playerId: string, mortalId: string) => void;
}

const GameBoard = ({ gameState, currentPlayerIndex, onMortalClick }: GameBoardProps) => {
  const opponents = gameState.players.
  map((player, index) => ({ player, index })).
  filter(({ index }) => index !== currentPlayerIndex);

  const n = opponents.length;
  // Adaptive grid: 1→1x1, 2→1col×2rows, 3-4→2x2, 5-6→2cols×3rows
  const { cols, rows } = (() => {
    if (n <= 1) return { cols: 1, rows: 1 };
    if (n === 2) return { cols: 1, rows: 2 };
    if (n <= 4) return { cols: 2, rows: 2 };
    return { cols: 2, rows: 3 };
  })();

  return (
    <div className="relative w-full h-full marble-texture overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, hsl(var(--ether) / 0.3) 0%, transparent 70%)`
          }} />
      </div>

      {/* Top-left info */}
      <CentralZone gameState={gameState} />

      {/* Opponents adaptive grid — fills available space */}
      <div
        className="grid gap-2 p-2 pt-20 w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {opponents.map(({ player, index: playerIndex }) =>
        <PlayerPanel
          key={player.id}
          player={player}
          gameState={gameState}
          isActive={playerIndex === gameState.activePlayerIndex}
          index={playerIndex}
          onMortalClick={onMortalClick ? (mortalId: string) => onMortalClick(player.id, mortalId) : undefined}
        />
        )}
      </div>
    </div>);
};

export default GameBoard;