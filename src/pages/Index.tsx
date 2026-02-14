import { useState, useEffect } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { toast } from 'sonner';
import GameBoard from '@/components/game/GameBoard';
import CurrentPlayerHand from '@/components/game/CurrentPlayerHand';
import ActionBar from '@/components/game/ActionBar';
import GameLog from '@/components/game/GameLog';
import VictoryModal from '@/components/game/VictoryModal';
import DiscardModal from '@/components/game/DiscardModal';
import ReactionDialog from '@/components/game/ReactionDialog';
import GodSelectionScreen from '@/components/game/GodSelectionScreen';
import TargetingModal from '@/components/game/TargetingModal';
import { DivinityId } from '@/types/game';
import { motion } from 'framer-motion';
import { Scroll, Plus, LogIn } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  const [godSelectionCount, setGodSelectionCount] = useState<number | null>(null);

  const {
    gameState,
    currentPlayerIndex,
    gameStarted,
    interactionMode,
    winners,
    discardRequired,
    pendingReactionCard,
    pendingEffect,
    startGame,
    resetGame,
    handleEndTurn,
    handleDiscard,
    handleMortalClick,
    handleCardClick,
    handleReactionPlay,
    handleReactionPlaceFaceDown,
    handleDiscardReaction,
    cancelReactionDialog,
    toggleMetamorphoseMode,
    toggleSpellMode,
    handleToggleReactionWindow,
    resolveEffect,
    cancelEffect,
    cancelDiscard,
    handleTargetMortalClick,
    healAllOwnMortals,
    selectChoice,
  } = useGameLogic();

  const isMortalTargeting = pendingEffect && (
    pendingEffect.type === 'enemy_mortal_incapacitate' ||
    pendingEffect.type === 'enemy_mortal_remove' ||
    pendingEffect.type === 'mortal_heal'
  );

  // Choice effect: no toast, rendered in JSX

  // Handle auto-heal-all (MIN-09 second metamorphosis)
  useEffect(() => {
    if (!pendingEffect || pendingEffect.type !== 'mortal_heal') return;
    if (!('autoHealAll' in pendingEffect) || !(pendingEffect as any).autoHealAll) return;
    if (!gameState) return;
    const player = gameState.players[pendingEffect.sourcePlayerIndex];
    const incapMortals = player.mortals.filter(m => m.isMetamorphosed && m.status === 'incapacite');
    if (incapMortals.length === 0) {
      toast.info('Aucun mortel incapacité à guérir.');
      cancelEffect();
      return;
    }
    healAllOwnMortals(pendingEffect.sourcePlayerIndex);
    cancelEffect();
    toast.success(`${incapMortals.length} incapacité(s) levée(s) !`, {
      style: { background: 'hsl(120 40% 20%)', border: '1px solid hsl(120 50% 40%)', color: 'white', fontSize: '16px' },
    });
  }, [pendingEffect, gameState, cancelEffect, healAllOwnMortals]);

  // Show targeting toast when mortal targeting is active
  useEffect(() => {
    if (!isMortalTargeting || !pendingEffect) return;
    // Skip auto-heal-all
    if ('autoHealAll' in pendingEffect && (pendingEffect as any).autoHealAll) return;
    const actionLabel = pendingEffect.type === 'enemy_mortal_remove'
      ? 'retirer du jeu'
      : pendingEffect.type === 'mortal_heal'
      ? 'guérir (lever l\'incapacité)'
      : 'incapaciter';
    toast.info(`${pendingEffect.sourceMortalName} : cliquez sur le mortel à ${actionLabel}.`, {
      duration: Infinity,
      id: 'targeting-bubble',
      style: { background: 'hsl(270 40% 20%)', border: '1px solid hsl(270 50% 40%)', color: 'white', fontSize: '16px' },
      action: pendingEffect.optional ? {
        label: 'Passer',
        onClick: () => cancelEffect(),
      } : undefined,
    });
    return () => { toast.dismiss('targeting-bubble'); };
  }, [isMortalTargeting, pendingEffect, cancelEffect]);

  // God selection screen
  if (godSelectionCount !== null && (!gameStarted || !gameState)) {
    return (
      <GodSelectionScreen
        playerCount={godSelectionCount}
        onStartGame={(selectedGods: DivinityId[], playerNames: string[]) => {
          startGame(godSelectionCount, selectedGods, playerNames);
          setGodSelectionCount(null);
        }}
        onBack={() => setGodSelectionCount(null)}
      />
    );
  }

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
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-3">Mode test solo — choisissez le nombre de dieux</p>
            <div className="flex justify-center gap-2">
              {[2, 3, 4, 5, 6, 7].map((count) => (
                <motion.button
                  key={count}
                  className="w-12 h-12 rounded-lg font-display font-bold text-base border border-border/50 text-foreground transition-all"
                  style={{ background: 'hsl(var(--card))' }}
                  whileHover={{ scale: 1.1, borderColor: 'hsl(var(--ether) / 0.5)', background: 'hsl(var(--ether) / 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGodSelectionCount(count)}
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
          <Scroll className="w-5 h-5 text-ether" />
          <h1 className="font-display text-lg font-bold text-foreground tracking-wider">MÉTAMORPHOSES</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body text-base text-muted-foreground italic">
            Cycle {gameState.turnCount} — {gameState.players.length} dieux — Mode test solo
          </span>
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-display font-semibold border border-destructive/40 text-destructive transition-all"
            style={{ background: 'hsl(var(--destructive) / 0.1)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
          >
            Quitter la partie
          </motion.button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative">
        <GameBoard
          gameState={gameState}
          currentPlayerIndex={currentPlayerIndex}
          onMortalClick={isMortalTargeting ? handleTargetMortalClick : undefined}
        />
        <GameLog entries={gameState.log} />
      </div>

      <div className="border-t border-border/30 px-3 py-1 space-y-1 relative z-[100]" style={{ background: `linear-gradient(180deg, hsl(var(--card) / 0.5), hsl(var(--background)))` }}>
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
          onDiscardReaction={handleDiscardReaction}
        />
      </div>

      {/* Victory modal */}
      {winners.length > 0 && (
        <VictoryModal winners={winners} onClose={resetGame} />
      )}

      {/* Discard modal */}
      {discardRequired && currentPlayer.hand.length > 2 && (
        <DiscardModal
          hand={currentPlayer.hand}
          excessCount={currentPlayer.hand.length - 2}
          onConfirm={handleDiscard}
          onCancel={cancelDiscard}
        />
      )}

      {/* Reaction dialog */}
      {pendingReactionCard && (
        <ReactionDialog
          card={pendingReactionCard}
          player={currentPlayer}
          gameState={gameState}
          onPlay={handleReactionPlay}
          onPlaceFaceDown={handleReactionPlaceFaceDown}
          onCancel={cancelReactionDialog}
        />
      )}

      {/* Choice panel for multi-option effects */}
      {pendingEffect && pendingEffect.type === 'choice' && pendingEffect.choices && (
        <div className="fixed bottom-24 right-4 z-[99999] flex flex-col gap-2 p-4 rounded-xl border border-border/50"
          style={{ background: 'hsl(270 30% 15% / 0.95)', backdropFilter: 'blur(8px)' }}>
          <p className="text-white font-display text-sm mb-1">
            {pendingEffect.sourceMortalName} : {pendingEffect.description}
          </p>
          {pendingEffect.choices.map((choice, idx) => (
            <motion.button
              key={idx}
              className="px-4 py-2 rounded-lg text-sm font-display font-semibold text-white border border-ether/40 transition-all"
              style={{ background: 'hsl(var(--ether) / 0.2)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectChoice(choice.effect)}
            >
              {choice.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* Targeting modal for ether effects only (not mortal targeting, not choice) */}
      {pendingEffect && !isMortalTargeting && pendingEffect.type !== 'choice' && (
        <TargetingModal
          effect={pendingEffect}
          gameState={gameState}
          onResolve={resolveEffect}
          onCancel={pendingEffect.optional ? cancelEffect : undefined}
        />
      )}
    </div>
  );
};

export default Index;
