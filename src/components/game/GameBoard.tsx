import { GameState } from '@/types/game';
import PlayerPanel from './PlayerPanel';
import CentralZone from './CentralZone';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerIndex: number;
}

const GameBoard = ({ gameState, currentPlayerIndex }: GameBoardProps) => {
  // Show all players except current player as opponents
  const opponents = gameState.players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== currentPlayerIndex);

  return (
    <div className="relative w-full h-full marble-texture overflow-auto">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, hsl(var(--ether) / 0.3) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Top-left info */}
      <CentralZone gameState={gameState} />

      {/* Opponents in horizontal row */}
      <div className="flex flex-wrap justify-center gap-4 p-4 pt-20">
        {opponents.map(({ player, index: playerIndex }) => (
          <PlayerPanel
            key={player.id}
            player={player}
            isActive={playerIndex === gameState.activePlayerIndex}
            index={playerIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
