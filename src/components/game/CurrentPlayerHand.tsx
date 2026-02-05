import { Player, DIVINITIES } from '@/types/game';
import EtherCounter from './EtherCounter';
import MortalGrid from './MortalGrid';
import GameCard from './GameCard';
import { motion } from 'framer-motion';
import { Shield, Zap, Crown, Sword } from 'lucide-react';

interface CurrentPlayerHandProps {
  player: Player;
}

const CurrentPlayerHand = ({ player }: CurrentPlayerHandProps) => {
  const divinity = DIVINITIES[player.divinity];

  return (
    <motion.div
      className="rounded-xl p-4 border border-border/50"
      style={{
        background: `linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)`,
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border-2"
            style={{
              borderColor: `hsl(${divinity.color})`,
              background: `linear-gradient(135deg, hsl(${divinity.color} / 0.2), hsl(var(--card)))`,
            }}
          >
            <span className="font-display text-sm font-bold text-foreground">
              {player.avatar}
            </span>
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-foreground">{player.name}</h2>
            <p className="text-[10px] text-muted-foreground font-body italic flex items-center gap-1">
              <Crown className="w-2.5 h-2.5" style={{ color: `hsl(${divinity.color})` }} />
              {divinity.name} — {divinity.title}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <EtherCounter amount={player.ether} size="md" />
            <div className="text-right">
              <div className="text-[9px] text-muted-foreground font-body">Éther</div>
              <div className="text-[9px] text-muted-foreground font-body">
                Coût méta: {player.totalMortalValue * 2}
              </div>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-ether" />
            <span className="font-display text-base font-bold text-foreground">
              {player.metamorphosedCount}
            </span>
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Mortals + Hand + Reactions */}
      <div className="flex items-start gap-4">
        {/* Mortal Grid */}
        <div>
          <div className="text-[9px] text-muted-foreground font-display mb-1 uppercase tracking-wider">
            Mortels
          </div>
          <MortalGrid mortals={player.mortals} />
        </div>

        <div className="h-16 w-px bg-border/50" />

        {/* Hand */}
        <div className="flex-1">
          <div className="text-[9px] text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
            <Sword className="w-2.5 h-2.5" /> Main ({player.hand.length}/2)
          </div>
          <div className="flex gap-1.5">
            {player.hand.map((card) => (
              <GameCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        {/* Reactions */}
        {player.reactions.length > 0 && (
          <>
            <div className="h-16 w-px bg-border/50" />
            <div>
              <div className="text-[9px] text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-reaction" /> Réactions ({player.reactions.length}/2)
              </div>
              <div className="flex gap-1.5">
                {player.reactions.map((card) => (
                  <GameCard key={card.id} card={card} faceDown />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Divine Power */}
      <div className="mt-3 p-2 rounded-lg border border-divine/20"
        style={{
          background: `linear-gradient(135deg, hsl(var(--divine) / 0.05), transparent)`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: `hsl(${divinity.color} / 0.3)` }}
          >
            <Crown className="w-3 h-3" style={{ color: `hsl(${divinity.color})` }} />
          </div>
          <div>
            <span className="font-display text-[9px] font-semibold" style={{ color: `hsl(${divinity.color})` }}>
              Pouvoir Divin
            </span>
            <p className="text-[9px] text-muted-foreground font-body">
              {divinity.power}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentPlayerHand;
