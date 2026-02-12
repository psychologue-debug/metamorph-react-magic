import { GameState } from '@/types/game';
import PlayerPanel from './PlayerPanel';
import CentralZone from './CentralZone';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerIndex: number;
}

const GameBoard = ({ gameState, currentPlayerIndex }: GameBoardProps) => {
  const opponents = gameState.players.
  map((player, index) => ({ player, index })).
  filter(({ index }) => index !== currentPlayerIndex);

  // Use compact mode when 4+ opponents to fit everything on screen
  const compact = opponents.length >= 4;

  return (
    <div className="relative w-full h-full marble-texture overflow-auto">
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

      {/* Opponents grid — fits all in width without scrolling */}
      <div className="flex-wrap justify-center gap-2 p-2 pt-20 flex">
        {opponents.map(({ player, index: playerIndex }) =>
        <PlayerPanel
          key={player.id}
          player={player}
          isActive={playerIndex === gameState.activePlayerIndex}
          index={playerIndex}
          compact={compact} />

        )}
      </div>
    </div>);

};

export default GameBoard;