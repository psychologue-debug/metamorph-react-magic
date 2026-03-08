import { useState, useEffect } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { toast } from 'sonner';
import PlayerPanel from '@/components/game/PlayerPanel';
import OwnPlayerBoard from '@/components/game/OwnPlayerBoard';
import CentralZone from '@/components/game/CentralZone';
import ActionBar from '@/components/game/ActionBar';
import GameLog from '@/components/game/GameLog';
import VictoryModal from '@/components/game/VictoryModal';
import DiscardModal from '@/components/game/DiscardModal';
import GodSelectionScreen from '@/components/game/GodSelectionScreen';
import TargetingModal from '@/components/game/TargetingModal';
import ReactionWindow from '@/components/game/ReactionWindow';
import MortalTooltip from '@/components/game/MortalTooltip';
import { DivinityId, Mortal, Player as PlayerType, GameState as GameStateType, DIVINITIES as DIV } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Plus, LogIn, ScrollText, RefreshCw } from 'lucide-react';
import EtherCounter from '@/components/game/EtherCounter';
import MortalGrid from '@/components/game/MortalGrid';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  const [godSelectionCount, setGodSelectionCount] = useState<number | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [hoveredEnemyMortal, setHoveredEnemyMortal] = useState<{ mortal: Mortal; owner: PlayerType } | null>(null);

  const {
    gameState,
    currentPlayerIndex,
    gameStarted,
    interactionMode,
    winners,
    discardRequired,
    pendingReactionCard,
    pendingEffect,
    reactionWindow,
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
    toggleActivateMode,
    handleToggleReactionWindow,
    resolveEffect,
    cancelEffect,
    cancelDiscard,
    handleTargetMortalClick,
    healAllOwnMortals,
    selectChoice,
    resolveGodDiscard,
    resolveCardDiscard,
    resolvePayDrawDiscard,
    initiatePayDraw,
    resolveReactionDiscard,
    resolveGlane,
    resolveSelectGod,
    resolvePlaySpellAtDiscount,
    resolvePayMultipleEnemyDiscard,
    handleReactionReady,
    handleReactionPass,
    handleReactionActivate,
  } = useGameLogic();

  const isMortalTargeting = pendingEffect && (
    pendingEffect.type === 'enemy_mortal_incapacitate' ||
    pendingEffect.type === 'enemy_mortal_remove' ||
    pendingEffect.type === 'mortal_heal' ||
    pendingEffect.type === 'retro_own_mortal' ||
    pendingEffect.type === 'retro_enemy_mortal'
  );

  const isModalEffect = pendingEffect && (
    pendingEffect.type === 'generate_destroy_ether' ||
    pendingEffect.type === 'steal_ether_each_god' ||
    pendingEffect.type === 'none' ||
    pendingEffect.type === 'select_god_discard_all' ||
    pendingEffect.type === 'discard_cards_then_effect' ||
    pendingEffect.type === 'pay_draw_discard' ||
    pendingEffect.type === 'discard_own_reaction_then_enemy' ||
    pendingEffect.type === 'select_from_discard' ||
    pendingEffect.type === 'select_enemy_god' ||
    pendingEffect.type === 'play_spell_at_discount' ||
    pendingEffect.type === 'pay_multiple_enemy_discard'
  );

  // Handle auto-heal-all
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

  // Show targeting toast
  useEffect(() => {
    if (!isMortalTargeting || !pendingEffect) return;
    if ('autoHealAll' in pendingEffect && (pendingEffect as any).autoHealAll) return;
    const actionLabel = pendingEffect.type === 'enemy_mortal_remove'
      ? 'retirer du jeu'
      : pendingEffect.type === 'mortal_heal'
      ? 'guérir (lever l\'incapacité)'
      : pendingEffect.type === 'retro_own_mortal' || pendingEffect.type === 'retro_enemy_mortal'
      ? 'rétromorphoser'
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
  const isOwnTurn = currentPlayerIndex === gameState.activePlayerIndex;
  const opponents = gameState.players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== currentPlayerIndex);
  const activeEnemy = opponents.find(({ index }) => index === gameState.activePlayerIndex) || null;
  const inactiveEnemies = activeEnemy
    ? opponents.filter(({ index }) => index !== gameState.activePlayerIndex)
    : opponents;

  const handleEnemyMortalHover = (mortal: Mortal | null, owner: PlayerType) => {
    if (mortal) {
      setHoveredEnemyMortal({ mortal, owner });
    } else {
      setHoveredEnemyMortal(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-1.5 border-b border-border/30 shrink-0"
        style={{ background: `linear-gradient(90deg, hsl(var(--card)), hsl(var(--background)))` }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-ether" />
            <h1 className="font-display text-lg font-bold text-foreground tracking-wider">MÉTAMORPHOSES</h1>
          </div>

          {/* Chroniques button */}
          <button
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-display font-semibold transition-colors ${logOpen ? 'bg-ether/20 text-ether' : 'text-muted-foreground hover:text-foreground'}`}
            onMouseEnter={() => setLogOpen(true)}
            onMouseLeave={() => setLogOpen(false)}
          >
            <ScrollText className="w-4 h-4" />
            Chroniques
          </button>

          <CentralZone gameState={gameState} />
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body text-base text-muted-foreground italic">
            Cycle {gameState.turnCount} — {gameState.players.length} dieux
          </span>
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-display font-semibold border border-destructive/40 text-destructive transition-all"
            style={{ background: 'hsl(var(--destructive) / 0.1)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
          >
            Quitter
          </motion.button>
        </div>
      </header>

      {/* Main split layout */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Own board */}
        <div
          className="w-1/2 flex flex-col border-r overflow-hidden"
          style={{
            borderColor: 'hsl(var(--border) / 0.3)',
            background: 'linear-gradient(180deg, hsl(40 15% 92% / 0.08) 0%, hsl(var(--background)) 100%)',
          }}
        >
          <OwnPlayerBoard
            player={currentPlayer}
            gameState={gameState}
            interactionMode={interactionMode}
            onMortalClick={handleMortalClick}
            onCardClick={handleCardClick}
            onDiscardReaction={handleDiscardReaction}
            onTargetMortalClick={isMortalTargeting ? (mortalId: string) => handleTargetMortalClick(currentPlayer.id, mortalId) : undefined}
          />

          {/* Action bar at bottom-left */}
          <div className="px-3 py-2 border-t shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
            <ActionBar
              gameState={gameState}
              interactionMode={interactionMode}
              onEndTurn={handleEndTurn}
              onToggleMetamorphose={toggleMetamorphoseMode}
              onToggleSpell={toggleSpellMode}
              onToggleActivate={toggleActivateMode}
            />
          </div>
        </div>

        {/* RIGHT: Opponents */}
        <div
          className="w-1/2 flex flex-col min-h-0 overflow-hidden relative"
          onMouseLeave={() => setLogOpen(false)}
        >
          {/* GameLog panel — anchored below header on the right */}
          <div onMouseEnter={() => setLogOpen(true)} onMouseLeave={() => setLogOpen(false)}>
            <GameLog entries={gameState.log} open={logOpen} />
          </div>

          {/* Active enemy — fills the main area */}
          {activeEnemy && (
            <div className="flex-1 p-2 overflow-hidden">
              <PlayerPanel
                key={activeEnemy.player.id}
                player={activeEnemy.player}
                gameState={gameState}
                isActive={true}
                index={activeEnemy.index}
                compact={false}
                onMortalClick={isMortalTargeting ? (mortalId: string) => handleTargetMortalClick(activeEnemy.player.id, mortalId) : undefined}
                onMortalHover={(m) => handleEnemyMortalHover(m, activeEnemy.player)}
              />
            </div>
          )}

          {/* Inactive enemies — fixed height mini panels at bottom */}
          {inactiveEnemies.length > 0 && (
            <div
              className="flex gap-1.5 px-2 py-1.5 border-t shrink-0 overflow-hidden"
              style={{
                borderColor: 'hsl(var(--border) / 0.3)',
                height: activeEnemy ? '110px' : undefined,
                flex: activeEnemy ? undefined : '1',
                flexWrap: 'wrap',
                alignContent: activeEnemy ? 'center' : 'start',
                paddingTop: activeEnemy ? undefined : '8px',
              }}
            >
              {inactiveEnemies.map(({ player, index: playerIndex }) => (
                <OpponentMini
                  key={player.id}
                  player={player}
                  gameState={gameState}
                  playerIndex={playerIndex}
                  onMortalClick={isMortalTargeting ? (mortalId: string) => handleTargetMortalClick(player.id, mortalId) : undefined}
                  onMortalHover={(m) => handleEnemyMortalHover(m, player)}
                  fillSpace={!activeEnemy}
                />
              ))}
            </div>
          )}

          {/* Fixed enemy tooltip zone — bottom-right of right panel */}
          <AnimatePresence>
            {hoveredEnemyMortal && (
              <div className="absolute bottom-28 right-2 z-[99999] pointer-events-none">
                <MortalTooltip
                  mortal={hoveredEnemyMortal.mortal}
                  owner={hoveredEnemyMortal.owner}
                  gameState={gameState}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Victory modal */}
      {winners.length > 0 && <VictoryModal winners={winners} onClose={resetGame} />}

      {/* Discard modal */}
      {discardRequired && currentPlayer.hand.length > 2 && (
        <DiscardModal
          hand={currentPlayer.hand}
          excessCount={currentPlayer.hand.length - 2}
          onConfirm={handleDiscard}
          onCancel={cancelDiscard}
        />
      )}

      {/* Choice panel */}
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

      {/* Targeting modal */}
      {pendingEffect && isModalEffect && pendingEffect.type !== 'choice' && (
        <TargetingModal
          effect={pendingEffect}
          gameState={gameState}
          onResolve={resolveEffect}
          onCancel={pendingEffect.optional ? cancelEffect : undefined}
          onGodDiscard={resolveGodDiscard}
          onCardDiscard={resolveCardDiscard}
          onPayDrawDiscard={resolvePayDrawDiscard}
          onInitiatePayDraw={initiatePayDraw}
          onReactionDiscard={resolveReactionDiscard}
          onGlane={resolveGlane}
          onSelectGod={resolveSelectGod}
          onPlaySpellAtDiscount={resolvePlaySpellAtDiscount}
          onPayMultipleEnemyDiscard={resolvePayMultipleEnemyDiscard}
        />
      )}

      {/* Reaction Window */}
      {reactionWindow && reactionWindow.phase !== 'resolved' && (
        <ReactionWindow
          gameState={gameState}
          reactionWindow={reactionWindow}
          onPass={handleReactionPass}
          onActivate={handleReactionActivate}
          onReady={handleReactionReady}
        />
      )}
    </div>
  );
};

// === Compact opponent mini-panel ===
function OpponentMini({
  player,
  gameState,
  playerIndex,
  onMortalClick,
  onMortalHover,
  fillSpace,
}: {
  player: PlayerType;
  gameState: GameStateType;
  playerIndex: number;
  onMortalClick?: (mortalId: string) => void;
  onMortalHover?: (mortal: Mortal | null) => void;
  fillSpace?: boolean;
}) {
  const divinity = DIV[player.divinity];

  return (
    <div
      className="rounded-lg border border-border/30 overflow-hidden flex flex-col"
      style={{
        background: `linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--secondary) / 0.9))`,
        width: fillSpace ? undefined : '150px',
        height: fillSpace ? undefined : '100px',
        flex: fillSpace ? '1 1 200px' : '0 0 150px',
        maxWidth: fillSpace ? '300px' : '150px',
      }}
    >
      {/* Compact header */}
      <div className="flex items-center gap-1.5 px-2 py-1 shrink-0">
        <div
          className="w-5 h-5 rounded-full overflow-hidden border shrink-0"
          style={{ borderColor: `hsl(${divinity.color})` }}
        >
          {divinity.image ? (
            <img src={divinity.image} alt={divinity.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold">{player.avatar}</span>
          )}
        </div>
        <span className="font-display text-xs font-bold text-foreground truncate flex-1">{player.name}</span>
        <span className="text-[10px] text-ether font-bold">{player.ether}⚡</span>
        <span className="text-[10px] text-muted-foreground">{player.metamorphosedCount}/10</span>
      </div>

      {/* Tiny mortals grid */}
      <div className="flex-1 flex flex-wrap gap-0.5 px-1.5 pb-1 items-center justify-center overflow-hidden">
        <MortalGrid
          mortals={player.mortals}
          owner={player}
          gameState={gameState}
          tokenSize={fillSpace ? 32 : 24}
          targetingMode={!!onMortalClick}
          onMortalClick={onMortalClick}
          onMortalHover={onMortalHover}
        />
      </div>
    </div>
  );
}

export default Index;
