import { GameState } from '@/types/game';
import { InteractionMode } from '@/hooks/useGameLogic';
import { motion } from 'framer-motion';
import { SkipForward, Sparkles, Hand, X, Flame, Shield } from 'lucide-react';

interface ActionBarProps {
  gameState: GameState;
  interactionMode: InteractionMode;
  isOwnTurn?: boolean;
  reactionWindowActive?: boolean;
  onEndTurn: () => void;
  onToggleMetamorphose: () => void;
  onToggleSpell: () => void;
  onToggleActivate: () => void;
  onTogglePlaceReaction: () => void;
}

const ActionBar = ({
  gameState,
  interactionMode,
  isOwnTurn = true,
  reactionWindowActive = false,
  onEndTurn,
  onToggleMetamorphose,
  onToggleSpell,
  onToggleActivate,
  onTogglePlaceReaction,
}: ActionBarProps) => {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMetaMode = interactionMode === 'metamorphosing';
  const isSpellMode = interactionMode === 'playing_spell';
  const isActivateMode = interactionMode === 'activating_effect';
  const isReactionMode = interactionMode === 'placing_reaction';
  const isSleeping = activePlayer.skipNextTurn;
  const disabled = !isOwnTurn || isSleeping;

  return (
    <motion.div
      className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-border/50"
      style={{
        background: `linear-gradient(90deg, hsl(var(--card) / 0.9), hsl(var(--secondary) / 0.7))`,
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isOwnTurn && (
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-display font-bold" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          ⏳ Tour de {activePlayer.name}
        </div>
      )}
      {isSleeping && isOwnTurn && (
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-display font-bold" style={{ background: 'hsl(260 40% 20%)', color: 'hsl(260 70% 80%)', border: '1px solid hsl(260 50% 40%)' }}>
          💤 Tour sauté
        </div>
      )}

      <motion.button
        className={`flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-display font-semibold transition-all ${
          isMetaMode ? 'ring-2 ring-ether' : ''
        } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
        style={{
          background: isMetaMode
            ? `linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))`
            : `linear-gradient(135deg, hsl(var(--ether) / 0.8), hsl(var(--ether-dim) / 0.8))`,
          color: 'hsl(var(--primary-foreground))',
        }}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={disabled ? undefined : onToggleMetamorphose}
      >
        {isMetaMode ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        <span className="hidden sm:inline">{isMetaMode ? 'Annuler' : 'Métamorphoser'}</span>
        <span className="sm:hidden">{isMetaMode ? '✕' : 'Méta.'}</span>
      </motion.button>

      <motion.button
        className={`flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-display font-semibold border border-divine/30 text-foreground transition-all ${
          isSpellMode ? 'ring-2 ring-divine' : ''
        } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
        style={{ background: isSpellMode ? 'hsl(var(--divine) / 0.2)' : 'hsl(var(--divine) / 0.1)' }}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={disabled ? undefined : onToggleSpell}
      >
        {isSpellMode ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-divine" /> : <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-divine" />}
        <span className="hidden sm:inline">{isSpellMode ? 'Annuler' : 'Jouer un Sort'}</span>
        <span className="sm:hidden">{isSpellMode ? '✕' : 'Sort'}</span>
      </motion.button>

      <motion.button
        className={`flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-display font-semibold border border-amber-500/30 text-foreground transition-all ${
          isActivateMode ? 'ring-2 ring-amber-500' : ''
        } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
        style={{
          background: isActivateMode ? 'hsl(30 60% 20% / 0.4)' : 'hsl(30 60% 20% / 0.15)',
          boxShadow: '0 0 0 3px hsl(45 95% 55%), 0 0 12px 4px hsl(45 95% 55% / 0.5), 0 0 24px 8px hsl(45 85% 45% / 0.25)',
        }}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={disabled ? undefined : onToggleActivate}
      >
        {isActivateMode ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
        <span className="hidden sm:inline">{isActivateMode ? 'Annuler' : 'Activer un Effet'}</span>
        <span className="sm:hidden">{isActivateMode ? '✕' : 'Effet'}</span>
      </motion.button>

      <motion.button
        className={`flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-display font-semibold border text-foreground transition-all ${
          isReactionMode ? 'ring-2' : ''
        } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
        style={{
          background: isReactionMode ? 'hsl(var(--reaction) / 0.25)' : 'hsl(var(--reaction) / 0.1)',
          borderColor: 'hsl(var(--reaction) / 0.4)',
          ...(isReactionMode ? { ringColor: 'hsl(var(--reaction))' } : {}),
        }}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={disabled ? undefined : onTogglePlaceReaction}
      >
        {isReactionMode ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-reaction" /> : <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-reaction" />}
        <span className="hidden sm:inline">{isReactionMode ? 'Annuler' : 'Poser une Réaction'}</span>
        <span className="sm:hidden">{isReactionMode ? '✕' : 'Réact.'}</span>
      </motion.button>

      <div className="flex-1 min-w-0" />

      <motion.button
        className={`flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-display font-semibold text-foreground transition-all border border-border/50 ${!isOwnTurn ? 'opacity-30 pointer-events-none' : ''}`}
        style={{ background: 'hsl(var(--muted))' }}
        whileHover={!isOwnTurn ? {} : { scale: 1.05 }}
        whileTap={!isOwnTurn ? {} : { scale: 0.95 }}
        onClick={isOwnTurn ? onEndTurn : undefined}
      >
        <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Fin du Tour</span>
        <span className="sm:hidden">Fin</span>
      </motion.button>
    </motion.div>
  );
};

export default ActionBar;
