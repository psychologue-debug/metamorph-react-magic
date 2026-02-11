import { useGameLogic } from '@/hooks/useGameLogic';
import GameBoard from '@/components/game/GameBoard';
import CurrentPlayerHand from '@/components/game/CurrentPlayerHand';
import ActionBar from '@/components/game/ActionBar';
import GameLog from '@/components/game/GameLog';
import { motion } from 'framer-motion';
import { Scroll, Plus, LogIn } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  const {
    gameState,
    currentPlayerIndex,
    gameStarted,
    interactionMode,
    startGame,
    handleEndTurn,
    handleMortalClick,
    handleCardClick,
    toggleMetamorphoseMode,
    toggleSpellMode,
    handleToggleReactionWindow,
  } = useGameLogic();

  // Landing screen
  if (!gameStarted || !gameState) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background marble-texture relative overflow-hidden"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15"
            style={{ background: `radial-gradient(circle, hsl(var(--ether)) 0%, transparent 60%)` }}
          />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-lg px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
        >
          <motion.div className="mb-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <Scroll className="w-10 h-10 text-ether mx-auto mb-3" />
            <h1 className="font-display text-5xl font-bold text-foreground tracking-wider mb-2">MÉTAMORPHOSES</h1>
            <div className="w-24 h-0.5 mx-auto mb-4" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--ether)), transparent)' }} />
            <p className="font-body text-lg text-muted-foreground italic">Un jeu de stratégie inspiré de la mythologie romaine</p>
          </motion.div>

          <motion.div className="mt-10 flex flex-col gap-4 items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <motion.button
              className="flex items-center gap-3 px-8 py-4 rounded-xl font-display text-sm font-bold uppercase tracking-widest transition-all w-64"
              style={{
                background: `linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))`,
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 0 30px hsl(var(--ether) / 0.3)',
              }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 50px hsl(var(--ether) / 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {}}
            >
              <Plus className="w-5 h-5" />
              Créer une Partie
            </motion.button>

            <motion.button
              className="flex items-center gap-3 px-8 py-4 rounded-xl font-display text-sm font-bold uppercase tracking-widest transition-all w-64 border border-ether/30"
              style={{ background: 'hsl(var(--card) / 0.9)', color: 'hsl(var(--foreground))' }}
              whileHover={{ scale: 1.05, borderColor: 'hsl(var(--ether) / 0.6)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {}}
            >
              <LogIn className="w-5 h-5 text-ether" />
              Rejoindre une Partie
            </motion.button>
          </motion.div>

          <motion.div className="mt-8 pt-6 border-t border-border/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mb-3">Mode test solo — choisissez le nombre de dieux</p>
            <div className="flex justify-center gap-2">
              {[2, 3, 4, 5, 6, 7].map((count) => (
                <motion.button
                  key={count}
                  className="w-10 h-10 rounded-lg font-display font-bold text-sm border border-border/50 text-foreground transition-all"
                  style={{ background: 'hsl(var(--card))' }}
                  whileHover={{ scale: 1.1, borderColor: 'hsl(var(--ether) / 0.5)', background: 'hsl(var(--ether) / 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(count)}
                >
                  {count}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const currentPlayer = gameState.players[currentPlayerIndex];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header
        className="flex items-center justify-between px-4 py-1.5 border-b border-border/30"
        style={{ background: `linear-gradient(90deg, hsl(var(--card)), hsl(var(--background)))` }}
      >
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-ether" />
          <h1 className="font-display text-xs font-bold text-foreground tracking-wider">MÉTAMORPHOSES</h1>
        </div>
        <div className="font-body text-[10px] text-muted-foreground italic">
          Cycle {gameState.turnCount} — {gameState.players.length} dieux — Mode test solo
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative">
          <GameBoard gameState={gameState} currentPlayerIndex={currentPlayerIndex} />
        </div>
        <div className="w-56 border-l border-border/30 p-2 overflow-y-auto" style={{ background: 'hsl(var(--background) / 0.95)' }}>
          <GameLog entries={gameState.log} />
        </div>
      </div>

      <div className="border-t border-border/30 px-3 py-1.5 space-y-1" style={{ background: `linear-gradient(180deg, hsl(var(--card) / 0.5), hsl(var(--background)))` }}>
        <ActionBar
          gameState={gameState}
          interactionMode={interactionMode}
          onEndTurn={handleEndTurn}
          onToggleMetamorphose={toggleMetamorphoseMode}
          onToggleSpell={toggleSpellMode}
          onToggleReactionWindow={handleToggleReactionWindow}
        />
        <CurrentPlayerHand
          player={currentPlayer}
          gameState={gameState}
          interactionMode={interactionMode}
          onMortalClick={handleMortalClick}
          onCardClick={handleCardClick}
        />
      </div>
    </div>
  );
};

export default Index;
