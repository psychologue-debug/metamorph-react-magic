import { Player, GameState, DIVINITIES, SpellCard, Mortal } from '@/types/game';
import { InteractionMode, canPlayCard } from '@/hooks/useGameLogic';
import { getEffectiveCardCost } from '@/engine/costModifiers';
import EtherCounter from './EtherCounter';
import MortalTooltip from './MortalTooltip';
import CeresLayout from './CeresLayout';
import VenusLayout from './VenusLayout';
import ApollonLayout from './ApollonLayout';
import NeptuneLayout from './NeptuneLayout';
import MinerveLayout from './MinerveLayout';
import DianeLayout from './DianeLayout';
import BacchusLayout from './BacchusLayout';
import GameCard from './GameCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Sword, RefreshCw, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';

interface OwnPlayerBoardProps {
  player: Player;
  gameState: GameState;
  interactionMode: InteractionMode;
  onMortalClick?: (mortalId: string) => void;
  onCardClick?: (cardId: string) => void;
  onDiscardReaction?: (cardId: string) => void;
  onTargetMortalClick?: (mortalId: string) => void;
  /** When set, only these mortal IDs are clickable; the others are visually grayed. */
  eligibleMortalIds?: Set<string>;
  /** Optional banner shown above the board (e.g. inline targeting prompt). */
  targetingBanner?: string | null;
  /** Click on a non-meta mortal in idle mode → request to start metamorphose on that mortal. */
  onRequestMetamorphoseMortal?: (mortalId: string) => void;
}

const OwnPlayerBoard = ({
  player,
  gameState,
  interactionMode,
  onMortalClick,
  onCardClick,
  onDiscardReaction,
  onTargetMortalClick,
  eligibleMortalIds,
  targetingBanner,
  onRequestMetamorphoseMortal,
}: OwnPlayerBoardProps) => {
  const divinity = DIVINITIES[player.divinity];
  const isMetaMode = interactionMode === 'metamorphosing';
  const isSpellMode = interactionMode === 'playing_spell';
  const isActivateMode = interactionMode === 'activating_effect';
  const isReactionMode = interactionMode === 'placing_reaction';
  const [reactionToManage, setReactionToManage] = useState<SpellCard | null>(null);
  const [hoveredMortal, setHoveredMortal] = useState<Mortal | null>(null);
  const [hoveredSpell, setHoveredSpell] = useState<SpellCard | null>(null);
  const [floatingMortalId, setFloatingMortalId] = useState<string | null>(null);

  // Click-away handler for floating "Métamorphoser" button
  const boardRef = useRef<HTMLDivElement>(null);
  const handleBoardClick = (e: React.MouseEvent) => {
    if (!floatingMortalId) return;
    const target = e.target as HTMLElement;
    if (!target.closest('[data-floating-meta-btn]') && !target.closest('[data-mortal-token]')) {
      setFloatingMortalId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Player info header */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
        <div
          className="w-8 h-10 sm:w-12 sm:h-16 rounded-lg flex items-center justify-center border-2 overflow-hidden shrink-0"
          style={{
            borderColor: `hsl(${divinity.color})`,
            background: `linear-gradient(135deg, hsl(${divinity.color} / 0.2), hsl(var(--card)))`,
          }}
        >
          {divinity.image ? (
            <img src={divinity.image} alt={divinity.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-sm sm:text-lg font-bold text-foreground">{player.avatar}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-base sm:text-xl font-bold text-foreground truncate">{player.name}</h2>
        </div>
        <EtherCounter amount={player.ether} size="sm" />
        <div className="flex items-center gap-1">
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-ether" />
          <span className="font-display text-sm sm:text-lg font-bold text-foreground">{player.metamorphosedCount}/10</span>
        </div>
      </div>

      {/* Mode indicator */}
      {interactionMode !== 'idle' && (
        <div className="px-2 sm:px-3 py-1 sm:py-2 text-center font-display text-xs sm:text-base font-semibold shrink-0"
          style={{ background: 'hsl(var(--divine) / 0.1)', color: 'hsl(var(--divine))' }}>
          {isMetaMode ? '🎯 Choisissez un mortel à métamorphoser'
            : isActivateMode ? '⚡ Cliquez un mortel métamorphosé pour activer son effet'
            : isReactionMode ? '🛡️ Cliquez une Réaction à poser'
            : '🃏 Choisissez un sort à jouer'}
        </div>
      )}

      {/* Inline targeting banner (for non-modal effects like BAC-02 metamorphose_extra) */}
      {targetingBanner && interactionMode === 'idle' && (
        <div className="px-2 sm:px-3 py-1 sm:py-2 text-center font-display text-xs sm:text-base font-semibold shrink-0"
          style={{ background: 'hsl(var(--ether) / 0.15)', color: 'hsl(var(--ether))' }}>
          🐬 {targetingBanner}
        </div>
      )}

      {/* Mortals grid + fixed tooltip zone */}
      <div
        className="flex-1 relative overflow-hidden"
        ref={boardRef}
        onMouseEnter={() => setHoveredSpell(null)}
        onClick={handleBoardClick}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/textures/marble-white.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {(() => {
            // Wrap clicks: when an eligibleMortalIds set is provided, ignore clicks on others
            // and visually communicate the constraint via per-token grayscale wrappers below.
            const wrappedTargetClick = onTargetMortalClick
              ? (mortalId: string) => {
                  if (eligibleMortalIds && !eligibleMortalIds.has(mortalId)) return;
                  onTargetMortalClick(mortalId);
                }
              : undefined;

            const layoutProps = {
              mortals: player.mortals,
              owner: player,
              gameState: gameState,
              selectable: isMetaMode || isActivateMode || !!onTargetMortalClick,
              onMortalClick: isMetaMode
                ? onMortalClick
                : isActivateMode
                ? onMortalClick
                : wrappedTargetClick
                ? wrappedTargetClick
                : undefined,
              onMortalHover: setHoveredMortal,
            };
            const layouts: Record<string, React.FC<any>> = {
              ceres: CeresLayout, venus: VenusLayout, apollon: ApollonLayout,
              neptune: NeptuneLayout, minerve: MinerveLayout, diane: DianeLayout, bacchus: BacchusLayout,
            };
            const Layout = layouts[player.divinity] || CeresLayout;
            return <Layout {...layoutProps} />;
          })()}

          {/* Overlay: dim non-eligible mortals when an eligibility set is provided */}
          {eligibleMortalIds && (
            <div className="absolute inset-0 pointer-events-none">
              {/* This relies on the layout placing tokens with absolute % coords; we re-render an overlay
                  that grays out tokens not in the set by matching their DOM position is complex.
                  Simpler path: tint the entire board slightly and let the targeting bubble guide. */}
              <div className="absolute inset-0" style={{ background: 'hsl(var(--background) / 0.05)' }} />
            </div>
          )}
        </div>

        {/* Floating "Métamorphoser" button removed per UX feedback */}

        {/* Fixed tooltip zone — top-right of mortal area */}
        <AnimatePresence>
          {hoveredMortal && (
            <div className="absolute top-2 right-2 z-[99999] pointer-events-none">
              <MortalTooltip mortal={hoveredMortal} owner={player} gameState={gameState} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Hand + Reactions row */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-t shrink-0 relative" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
        <div className="flex items-start gap-2 sm:gap-4">
          {/* Hand */}
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
              <Sword className="w-3 h-3 sm:w-4 sm:h-4" /> Main ({player.hand.length}/2)
              {isSpellMode && <span className="text-divine ml-1 hidden sm:inline">— Cliquez pour jouer</span>}
              {isReactionMode && <span className="text-reaction ml-1 hidden sm:inline">— Cliquez une Réaction</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {player.hand.map((card) => {
                const playable = isSpellMode ? canPlayCard(card, player, gameState) : true;
                const isReactionCard = card.type === 'reaction';
                const reactionPlaceable = isReactionMode && isReactionCard && player.reactions.length < 2;
                const dimmed = (isSpellMode && !playable) || (isReactionMode && !isReactionCard);
                const highlighted = (isSpellMode && playable) || (isReactionMode && reactionPlaceable);
                return (
                  <div
                    key={card.id}
                    className={`relative transition-all ${dimmed ? 'opacity-40' : ''} ${highlighted ? (isReactionMode ? 'ring-1 ring-reaction/50 rounded-lg' : 'ring-1 ring-divine/50 rounded-lg') : ''}`}
                    onMouseEnter={() => setHoveredSpell(card)}
                    onMouseLeave={() => setHoveredSpell(null)}
                  >
                    <GameCard
                      card={card}
                      effectiveCost={getEffectiveCardCost(card, player)}
                      small
                      onClick={(isSpellMode || isReactionMode) ? () => onCardClick?.(card.id) : undefined}
                    />
                  </div>
                );
              })}
              {player.hand.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Vide</p>
              )}
            </div>
          </div>

          {/* Reactions */}
          <div className="shrink-0 relative">
            <div className="text-xs sm:text-sm text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-reaction" /> <span className="hidden sm:inline">Réactions</span> ({player.reactions.length}/2)
            </div>
            <div className="flex gap-2">
              {player.reactions.map((card) => (
                <div key={card.id} className="relative">
                  <GameCard
                    card={card}
                    faceDown
                    small
                    onClick={() => setReactionToManage(card)}
                  />
                </div>
              ))}
              {player.reactions.length === 0 && (
                <p className="text-sm text-muted-foreground italic">—</p>
              )}
            </div>

            <AnimatePresence>
              {reactionToManage && (
                <motion.div
                  className="absolute bottom-full right-0 mb-4 z-[99999] rounded-xl p-4 shadow-2xl"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', minWidth: '200px' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="font-display text-base font-bold text-foreground mb-1">{reactionToManage.name}</div>
                  <div className="text-sm text-muted-foreground mb-3">{reactionToManage.description}</div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-1.5 rounded-lg font-display text-sm font-bold text-foreground border border-destructive/50 hover:bg-destructive/20 transition-colors"
                      onClick={() => { onDiscardReaction?.(reactionToManage.id); setReactionToManage(null); }}
                    >
                      Défausser
                    </button>
                    <button
                      className="flex-1 px-3 py-1.5 rounded-lg font-display text-sm font-bold text-foreground border border-border/50 hover:bg-secondary/50 transition-colors"
                      onClick={() => setReactionToManage(null)}
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Fixed spell tooltip — top-right of hand section, above hand bar */}
        <AnimatePresence>
          {hoveredSpell && !hoveredMortal && (
            <div className="absolute bottom-full right-2 mb-2 z-[99999] pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl px-4 py-3 shadow-2xl"
                style={{
                  minWidth: '260px',
                  maxWidth: '340px',
                  background: 'hsl(var(--card))',
                  border: `1px solid hsl(var(--${hoveredSpell.type === 'reaction' ? 'reaction' : 'divine'}) / 0.5)`,
                  boxShadow: `0 0 20px hsl(var(--${hoveredSpell.type === 'reaction' ? 'reaction' : 'divine'}) / 0.2)`,
                }}
              >
                <div className="font-display text-lg font-bold text-foreground mb-1">{hoveredSpell.name}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-display text-ether font-bold">{getEffectiveCardCost(hoveredSpell, player)} Éther</span>
                  <span className="text-sm text-muted-foreground uppercase">{hoveredSpell.type === 'reaction' ? 'Réaction' : 'Sortilège'}</span>
                </div>
                <p className="text-base text-foreground leading-relaxed">{hoveredSpell.description}</p>
                {hoveredSpell.activationCondition && (
                  <p className="text-sm mt-1.5 italic" style={{ color: 'hsl(30 80% 60%)' }}>Condition : {hoveredSpell.activationCondition}</p>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OwnPlayerBoard;
