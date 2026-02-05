import { useState, useCallback } from 'react';
import { GameState, TurnPhase } from '@/types/game';
import { createMockGameState } from '@/data/mockGame';
import GameBoard from '@/components/game/GameBoard';
import CurrentPlayerHand from '@/components/game/CurrentPlayerHand';
import ActionBar from '@/components/game/ActionBar';
import GameLog from '@/components/game/GameLog';
import { motion } from 'framer-motion';
import { Scroll, Users } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const PHASE_ORDER: TurnPhase[] = ['debut_tour', 'pioche', 'principale', 'defausse', 'fin_tour'];

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(() => createMockGameState(4));
  const [currentPlayerIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const handleNextPhase = useCallback(() => {
    setGameState((prev) => {
      const currentPhaseIdx = PHASE_ORDER.indexOf(prev.phase);
      const nextPhaseIdx = (currentPhaseIdx + 1) % PHASE_ORDER.length;
      return { ...prev, phase: PHASE_ORDER[nextPhaseIdx] };
    });
  }, []);

  const handleEndTurn = useCallback(() => {
    setGameState((prev) => {
      const nextPlayer = (prev.activePlayerIndex + 1) % prev.players.length;
      return {
        ...prev,
        activePlayerIndex: nextPlayer,
        phase: 'debut_tour' as TurnPhase,
        turnCount: nextPlayer === prev.cycleStartPlayerIndex ? prev.turnCount + 1 : prev.turnCount,
        log: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: prev.players[prev.activePlayerIndex].name,
            action: 'Fin du Tour',
            detail: 'a terminé son tour',
          },
          ...prev.log,
        ],
      };
    });
  }, []);

  const handleMetamorphose = useCallback(() => {
    setGameState((prev) => {
      const player = prev.players[prev.activePlayerIndex];
      const cost = player.totalMortalValue * 2;
      if (player.ether < cost) return prev;

      const unmetamorphosed = player.mortals.find((m) => !m.isMetamorphosed);
      if (!unmetamorphosed) return prev;

      const updatedPlayers = prev.players.map((p, i) => {
        if (i !== prev.activePlayerIndex) return p;
        const updatedMortals = p.mortals.map((m) =>
          m.id === unmetamorphosed.id ? { ...m, isMetamorphosed: true } : m
        );
        return {
          ...p,
          ether: p.ether - cost + unmetamorphosed.value,
          mortals: updatedMortals,
          metamorphosedCount: updatedMortals.filter((m) => m.isMetamorphosed).length,
          totalMortalValue: updatedMortals.reduce((s, m) => s + m.value, 0),
        };
      });

      return {
        ...prev,
        players: updatedPlayers,
        log: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerName: player.name,
            action: 'Métamorphose',
            detail: `a métamorphosé ${unmetamorphosed.name} (coût: ${cost} Éther)`,
          },
          ...prev.log,
        ],
      };
    });
  }, []);

  const handleToggleReactionWindow = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      reactionWindowActive: !prev.reactionWindowActive,
      reactionTimeRemaining: 20,
    }));
  }, []);

  // Landing / Setup screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background marble-texture relative overflow-hidden"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15"
            style={{
              background: `radial-gradient(circle, hsl(var(--ether)) 0%, transparent 60%)`,
            }}
          />
          <div className="absolute right-0 bottom-0 w-96 h-96 opacity-10"
            style={{
              background: `radial-gradient(circle, hsl(var(--divine)) 0%, transparent 60%)`,
            }}
          />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-lg px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
        >
          {/* Title */}
          <motion.div
            className="mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Scroll className="w-10 h-10 text-ether mx-auto mb-3" />
            <h1 className="font-display text-5xl font-bold text-foreground tracking-wider mb-2">
              MÉTAMORPHOSES
            </h1>
            <div className="w-24 h-0.5 mx-auto mb-4" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--ether)), transparent)' }} />
            <p className="font-body text-lg text-muted-foreground italic">
              Un jeu de stratégie inspiré de la mythologie romaine
            </p>
          </motion.div>

          {/* Player count selection */}
          <motion.div
            className="mt-10 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              <span className="font-display text-xs uppercase tracking-wider">Nombre de joueurs</span>
            </div>
            
            <div className="flex justify-center gap-2">
              {[2, 3, 4, 5, 6, 7].map((count) => (
                <motion.button
                  key={count}
                  className="w-10 h-10 rounded-lg font-display font-bold text-sm border border-border/50 text-foreground transition-all"
                  style={{
                    background: count === 4 ? 'hsl(var(--ether) / 0.2)' : 'hsl(var(--card))',
                    borderColor: count === 4 ? 'hsl(var(--ether) / 0.5)' : undefined,
                  }}
                  whileHover={{
                    scale: 1.1,
                    borderColor: 'hsl(var(--ether) / 0.5)',
                    background: 'hsl(var(--ether) / 0.15)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setGameState(createMockGameState(count));
                    setGameStarted(true);
                  }}
                >
                  {count}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Start button */}
          <motion.button
            className="mt-8 px-8 py-3 rounded-xl font-display text-sm font-bold uppercase tracking-widest transition-all"
            style={{
              background: `linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))`,
              color: 'hsl(var(--primary-foreground))',
              boxShadow: '0 0 30px hsl(var(--ether) / 0.3)',
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 50px hsl(var(--ether) / 0.5)',
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGameStarted(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Commencer la Partie
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const currentPlayer = gameState.players[currentPlayerIndex];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Title bar */}
      <header className="flex items-center justify-between px-4 py-1.5 border-b border-border/30"
        style={{
          background: `linear-gradient(90deg, hsl(var(--card)), hsl(var(--background)))`,
        }}
      >
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-ether" />
          <h1 className="font-display text-xs font-bold text-foreground tracking-wider">
            MÉTAMORPHOSES
          </h1>
        </div>
        <div className="font-body text-[10px] text-muted-foreground italic">
          Cycle {gameState.turnCount} — {gameState.players.length} joueurs
        </div>
      </header>

      {/* Main game area */}
      <div className="flex-1 flex min-h-0">
        {/* Game Board */}
        <div className="flex-1 relative">
          <GameBoard gameState={gameState} currentPlayerIndex={currentPlayerIndex} />
        </div>

        {/* Right sidebar: Game Log */}
        <div className="w-56 border-l border-border/30 p-2 overflow-y-auto"
          style={{ background: 'hsl(var(--background) / 0.95)' }}
        >
          <GameLog entries={gameState.log} />
        </div>
      </div>

      {/* Bottom panel: Current player hand + Actions */}
      <div className="border-t border-border/30 p-3 space-y-2"
        style={{
          background: `linear-gradient(180deg, hsl(var(--card) / 0.5), hsl(var(--background)))`,
        }}
      >
        <ActionBar
          gameState={gameState}
          onNextPhase={handleNextPhase}
          onEndTurn={handleEndTurn}
          onMetamorphose={handleMetamorphose}
          onToggleReactionWindow={handleToggleReactionWindow}
        />
        <CurrentPlayerHand player={currentPlayer} />
      </div>
    </div>
  );
};

export default Index;
