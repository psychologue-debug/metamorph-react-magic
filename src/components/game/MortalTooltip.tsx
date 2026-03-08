import { Mortal, Player, GameState } from '@/types/game';
import { getEffectiveMetamorphosisCost } from '@/engine/costModifiers';
import { getEffectiveEtherProduction } from '@/engine/etherGeneration';
import { motion } from 'framer-motion';

interface MortalTooltipProps {
  mortal: Mortal;
  owner?: Player;
  gameState?: GameState;
}

const MortalTooltip = ({ mortal, owner, gameState }: MortalTooltipProps) => {
  const tooltipImage = mortal.imageVerso;
  const tooltipName = mortal.nameVerso;
  const effectiveCost = owner && gameState
    ? getEffectiveMetamorphosisCost(mortal, owner, gameState)
    : mortal.cost;
  const effectiveProduction = owner && gameState
    ? getEffectiveEtherProduction(mortal, owner, gameState)
    : (mortal.isMetamorphosed ? mortal.etherProduction : mortal.etherProductionRecto);
  const costModified = effectiveCost !== mortal.cost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        width: '240px',
      }}
    >
      {tooltipImage && (
        <img src={tooltipImage} alt={tooltipName} className="w-full object-contain" style={{ maxHeight: '260px' }} />
      )}
      <div className="p-2.5">
        <div className="font-display text-sm font-bold text-foreground">{tooltipName}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-display font-semibold ${costModified ? 'text-divine' : 'text-ether'}`}>
            Coût: {effectiveCost}⚡
            {costModified && <span className="text-muted-foreground line-through ml-1 text-[10px]">{mortal.cost}</span>}
          </span>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="text-xs text-ether font-display">+{effectiveProduction}/cycle</span>
        </div>
        {mortal.effectOnMetamorphose && (
          <div className="text-xs text-foreground mt-1.5 flex gap-1.5">
            <span>⚡</span><span>{mortal.effectOnMetamorphose}</span>
          </div>
        )}
        {mortal.effectPermanent && (
          <div className="text-xs mt-1 flex gap-1.5" style={{ color: 'hsl(var(--divine))' }}>
            <span>🔮</span><span>{mortal.effectPermanent}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MortalTooltip;
