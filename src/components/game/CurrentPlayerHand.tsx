import { Player, GameState, DIVINITIES, SpellCard } from '@/types/game';
import { InteractionMode, canPlayCard } from '@/hooks/useGameLogic';
import { getEffectiveCardCost } from '@/engine/costModifiers';
import EtherCounter from './EtherCounter';
import MortalGrid from './MortalGrid';
import GameCard from './GameCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Sword } from 'lucide-react';
import { useState } from 'react';

interface CurrentPlayerHandProps {
  player: Player;
  gameState: GameState;
  interactionMode: InteractionMode;
  onMortalClick?: (mortalId: string) => void;
  onCardClick?: (cardId: string) => void;
  onDiscardReaction?: (cardId: string) => void;
  onTargetMortalClick?: (mortalId: string) => void;
}

const CurrentPlayerHand = ({ player, gameState, interactionMode, onMortalClick, onCardClick, onDiscardReaction, onTargetMortalClick }: CurrentPlayerHandProps) => {
  const divinity = DIVINITIES[player.divinity];
  const isMetaMode = interactionMode === 'metamorphosing';
  const isSpellMode = interactionMode === 'playing_spell';
  const isActivateMode = interactionMode === 'activating_effect';
  const [reactionToManage, setReactionToManage] = useState<SpellCard | null>(null);

  return (
    <motion.div
      className="rounded-lg px-4 py-2 border border-border/50"
      style={{
        background: `linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Single compact row */}
      <div className="flex items-center gap-4">
        {/* Identity + stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center border-2"
            style={{
              borderColor: `hsl(${divinity.color})`,
              background: `linear-gradient(135deg, hsl(${divinity.color} / 0.2), hsl(var(--card)))`,
            }}
          >
            <span className="font-display text-lg font-bold text-foreground">{player.avatar}</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-foreground truncate">{player.name}</h2>
          </div>
          <EtherCounter amount={player.ether} size="sm" />
          <div className="flex items-center gap-1">
            <Zap className="w-5 h-5 text-ether" />
            <span className="font-display text-base font-bold text-foreground">{player.metamorphosedCount}/10</span>
          </div>
        </div>

        <div className="h-10 w-px bg-border/40 shrink-0" />

        {/* Mortal grid — compact */}
        <div className="shrink-0">
          {isMetaMode && (
            <div className="text-base text-divine font-display mb-1">🎯 Cliquez un mortel</div>
          )}
          {isActivateMode && (
            <div className="text-base font-display mb-1" style={{ color: 'hsl(30 80% 60%)' }}>⚡ Cliquez un mortel métamorphosé</div>
          )}
          <MortalGrid
            mortals={player.mortals}
            owner={player}
            gameState={gameState}
            tokenSize={40}
            selectable={isMetaMode || isActivateMode || !!onTargetMortalClick}
            onMortalClick={isMetaMode ? onMortalClick : isActivateMode ? onMortalClick : onTargetMortalClick ? onTargetMortalClick : undefined}
          />
        </div>

        <div className="h-10 w-px bg-border/40 shrink-0" />

        {/* Hand */}
        <div className="flex-1 min-w-0">
          <div className="text-base text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
            <Sword className="w-4 h-4" /> Main ({player.hand.length}/2)
            {isSpellMode && <span className="text-divine ml-1">— Cliquez pour jouer</span>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {player.hand.map((card) => {
              const playable = isSpellMode ? canPlayCard(card, player, gameState) : true;
              return (
                <div key={card.id} className={`transition-all ${isSpellMode && !playable ? 'opacity-40' : ''} ${isSpellMode && playable ? 'ring-1 ring-divine/50 rounded-lg' : ''}`}>
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
              <p className="text-base text-muted-foreground italic">Vide</p>
            )}
          </div>
        </div>

        {/* Reactions — clickable with hover tooltip */}
        <div className="shrink-0 relative">
          <div className="text-base text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-4 h-4 text-reaction" /> Réactions ({player.reactions.length}/2)
          </div>
          <div className="flex gap-2">
            {player.reactions.map((card) => (
              <div key={card.id} className="relative group">
                <GameCard
                  card={card}
                  faceDown
                  small
                  onClick={() => setReactionToManage(card)}
                />
                {/* Hover tooltip revealing card identity */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div
                    className="rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div className="font-display text-sm font-bold text-foreground">{card.name}</div>
                    <div className="text-xs text-muted-foreground">{card.description}</div>
                  </div>
                </div>
              </div>
            ))}
            {player.reactions.length === 0 && (
              <p className="text-base text-muted-foreground italic">—</p>
            )}
          </div>

          {/* Reaction management dialog */}
          <AnimatePresence>
            {reactionToManage && (
              <motion.div
                className="absolute bottom-full right-0 mb-4 z-[99999] rounded-xl p-4 shadow-2xl"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  minWidth: '200px',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="font-display text-base font-bold text-foreground mb-1">{reactionToManage.name}</div>
                <div className="text-sm text-muted-foreground mb-3">{reactionToManage.description}</div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-1.5 rounded-lg font-display text-sm font-bold text-foreground border border-destructive/50 hover:bg-destructive/20 transition-colors"
                    onClick={() => {
                      onDiscardReaction?.(reactionToManage.id);
                      setReactionToManage(null);
                    }}
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
    </motion.div>
  );
};

export default CurrentPlayerHand;
