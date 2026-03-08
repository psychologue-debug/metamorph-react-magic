import { Player, GameState, DIVINITIES, SpellCard, Mortal } from '@/types/game';
import { InteractionMode, canPlayCard } from '@/hooks/useGameLogic';
import { getEffectiveCardCost } from '@/engine/costModifiers';
import EtherCounter from './EtherCounter';
import MortalGrid from './MortalGrid';
import MortalTooltip from './MortalTooltip';
import GameCard from './GameCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Sword, RefreshCw } from 'lucide-react';
import { useState, useRef } from 'react';

interface OwnPlayerBoardProps {
  player: Player;
  gameState: GameState;
  interactionMode: InteractionMode;
  onMortalClick?: (mortalId: string) => void;
  onCardClick?: (cardId: string) => void;
  onDiscardReaction?: (cardId: string) => void;
  onTargetMortalClick?: (mortalId: string) => void;
}

const OwnPlayerBoard = ({
  player,
  gameState,
  interactionMode,
  onMortalClick,
  onCardClick,
  onDiscardReaction,
  onTargetMortalClick,
}: OwnPlayerBoardProps) => {
  const divinity = DIVINITIES[player.divinity];
  const isMetaMode = interactionMode === 'metamorphosing';
  const isSpellMode = interactionMode === 'playing_spell';
  const isActivateMode = interactionMode === 'activating_effect';
  const [reactionToManage, setReactionToManage] = useState<SpellCard | null>(null);
  const [hoveredMortal, setHoveredMortal] = useState<Mortal | null>(null);
  const [hoveredSpell, setHoveredSpell] = useState<SpellCard | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Player info header */}
      <div className="flex items-center gap-3 p-3 border-b shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center border-2 overflow-hidden shrink-0"
          style={{
            borderColor: `hsl(${divinity.color})`,
            background: `linear-gradient(135deg, hsl(${divinity.color} / 0.2), hsl(var(--card)))`,
          }}
        >
          {divinity.image ? (
            <img src={divinity.image} alt={divinity.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-lg font-bold text-foreground">{player.avatar}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-foreground truncate">{player.name}</h2>
        </div>
        <EtherCounter amount={player.ether} size="md" />
        <div className="flex items-center gap-1.5">
          <RefreshCw className="w-5 h-5 text-ether" />
          <span className="font-display text-lg font-bold text-foreground">{player.metamorphosedCount}/10</span>
        </div>
      </div>

      {/* Mode indicator */}
      {interactionMode !== 'idle' && (
        <div className="px-3 py-2 text-center font-display text-base font-semibold shrink-0"
          style={{ background: 'hsl(var(--divine) / 0.1)', color: 'hsl(var(--divine))' }}>
          {isMetaMode ? '🎯 Choisissez un mortel à métamorphoser'
            : isActivateMode ? '⚡ Cliquez un mortel métamorphosé pour activer son effet'
            : '🃏 Choisissez un sort à jouer'}
        </div>
      )}

      {/* Mortals grid + fixed tooltip zone */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 grid grid-cols-5 place-content-center gap-2 p-4"
          style={{
            background: 'linear-gradient(135deg, hsl(30 15% 92%), hsl(30 10% 96%), hsl(30 15% 90%))',
            backgroundImage: `
              linear-gradient(135deg, hsl(30 15% 92%), hsl(30 10% 96%), hsl(30 15% 90%)),
              url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")
            `,
          }}
        >
          <MortalGrid
            mortals={player.mortals}
            owner={player}
            gameState={gameState}
            tokenSize={80}
            selectable={isMetaMode || isActivateMode || !!onTargetMortalClick}
            onMortalClick={isMetaMode ? onMortalClick : isActivateMode ? onMortalClick : onTargetMortalClick ? onTargetMortalClick : undefined}
            onMortalHover={setHoveredMortal}
          />
        </div>

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
      <div className="px-3 py-2 border-t shrink-0 relative" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
        <div className="flex items-start gap-4">
          {/* Hand */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
              <Sword className="w-4 h-4" /> Main ({player.hand.length}/2)
              {isSpellMode && <span className="text-divine ml-1">— Cliquez pour jouer</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {player.hand.map((card) => {
                const playable = isSpellMode ? canPlayCard(card, player, gameState) : true;
                return (
                  <div
                    key={card.id}
                    className={`relative transition-all ${isSpellMode && !playable ? 'opacity-40' : ''} ${isSpellMode && playable ? 'ring-1 ring-divine/50 rounded-lg' : ''}`}
                    onMouseEnter={() => setHoveredSpell(card)}
                    onMouseLeave={() => setHoveredSpell(null)}
                  >
                    <GameCard
                      card={card}
                      effectiveCost={getEffectiveCardCost(card, player)}
                      small
                      onClick={isSpellMode ? () => onCardClick?.(card.id) : undefined}
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
            <div className="text-sm text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-4 h-4 text-reaction" /> Réactions ({player.reactions.length}/2)
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
