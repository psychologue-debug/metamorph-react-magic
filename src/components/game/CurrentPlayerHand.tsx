import { Player, GameState, DIVINITIES } from '@/types/game';
import { InteractionMode, canPlayCard } from '@/hooks/useGameLogic';
import EtherCounter from './EtherCounter';
import MortalGrid from './MortalGrid';
import GameCard from './GameCard';
import { motion } from 'framer-motion';
import { Shield, Zap, Sword } from 'lucide-react';

interface CurrentPlayerHandProps {
  player: Player;
  gameState: GameState;
  interactionMode: InteractionMode;
  onMortalClick?: (mortalId: string) => void;
  onCardClick?: (cardId: string) => void;
}

const CurrentPlayerHand = ({ player, gameState, interactionMode, onMortalClick, onCardClick }: CurrentPlayerHandProps) => {
  const divinity = DIVINITIES[player.divinity];
  const isMetaMode = interactionMode === 'metamorphosing';
  const isSpellMode = interactionMode === 'playing_spell';

  return (
    <motion.div
      className="rounded-lg px-3 py-1.5 border border-border/50"
      style={{
        background: `linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Single compact row */}
      <div className="flex items-center gap-3">
        {/* Identity + stats */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center border-2"
            style={{
              borderColor: `hsl(${divinity.color})`,
              background: `linear-gradient(135deg, hsl(${divinity.color} / 0.2), hsl(var(--card)))`,
            }}
          >
            <span className="font-display text-sm font-bold text-foreground">{player.avatar}</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold text-foreground truncate">{player.name}</h2>
          </div>
          <EtherCounter amount={player.ether} size="sm" />
          <div className="flex items-center gap-0.5">
            <Zap className="w-3.5 h-3.5 text-ether" />
            <span className="font-display text-xs font-bold text-foreground">{player.metamorphosedCount}/10</span>
          </div>
        </div>

        <div className="h-8 w-px bg-border/40 shrink-0" />

        {/* Mortal grid — compact */}
        <div className="shrink-0">
          {isMetaMode && (
            <div className="text-xs text-divine font-display mb-0.5">🎯 Cliquez un mortel</div>
          )}
          <MortalGrid
            mortals={player.mortals}
            tokenSize={32}
            selectable={isMetaMode}
            onMortalClick={isMetaMode ? onMortalClick : undefined}
          />
        </div>

        <div className="h-8 w-px bg-border/40 shrink-0" />

        {/* Hand */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground font-display mb-0.5 uppercase tracking-wider flex items-center gap-1">
            <Sword className="w-3 h-3" /> Main ({player.hand.length}/2)
            {isSpellMode && <span className="text-divine ml-1">— Cliquez pour jouer</span>}
          </div>
          <div className="flex gap-1 flex-wrap">
            {player.hand.map((card) => {
              const playable = isSpellMode ? canPlayCard(card, player, gameState) : true;
              return (
                <div key={card.id} className={`transition-all ${isSpellMode && !playable ? 'opacity-40' : ''} ${isSpellMode && playable ? 'ring-1 ring-divine/50 rounded-lg' : ''}`}>
                  <GameCard
                    card={card}
                    small
                    onClick={isSpellMode ? () => onCardClick?.(card.id) : undefined}
                  />
                </div>
              );
            })}
            {player.hand.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Vide</p>
            )}
          </div>
        </div>

        {/* Reactions */}
        <div className="shrink-0">
          <div className="text-xs text-muted-foreground font-display mb-0.5 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-reaction" /> Réactions ({player.reactions.length}/2)
          </div>
          <div className="flex gap-1">
            {player.reactions.map((card) => (
              <GameCard key={card.id} card={card} faceDown small />
            ))}
            {player.reactions.length === 0 && (
              <p className="text-xs text-muted-foreground italic">—</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentPlayerHand;
