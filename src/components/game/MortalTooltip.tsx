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
        width: '280px',
      }}
    >
      <div className="p-3">
        {/* Nom recto */}
        <div className="font-display text-base font-bold text-foreground">{mortal.nameRecto}</div>

        {/* Production */}
        <div className="text-sm text-ether font-display font-semibold mt-1">
          +{effectiveProduction}/cycle
        </div>

        {/* Coût de métamorphose */}
        <div className="text-sm text-foreground mt-1.5 font-display">
          Coût de métamorphose :{' '}
          <span className={`font-bold ${costModified ? 'text-divine' : 'text-ether'}`}>
            {effectiveCost}⚡
          </span>
          {costModified && (
            <span className="text-muted-foreground line-through ml-1 text-xs">{mortal.cost}</span>
          )}
          {' '}en :
        </div>
      </div>

      {/* Image verso */}
      {mortal.imageVerso && (
        <img src={mortal.imageVerso} alt={mortal.nameVerso} className="w-full object-contain" style={{ maxHeight: '280px' }} />
      )}

      <div className="p-3 pt-2">
        {/* Nom verso */}
        <div className="font-display text-sm font-bold text-foreground mb-1.5">{mortal.nameVerso}</div>

        {mortal.effectOnMetamorphose && (
          <div className="text-sm text-foreground leading-relaxed flex gap-1.5">
            <span>⚡</span><span>{mortal.effectOnMetamorphose}</span>
          </div>
        )}
        {mortal.effectPermanent && (
          <div className="text-sm leading-relaxed flex gap-1.5 mt-1" style={{ color: 'hsl(var(--divine-glow))' }}>
            <span>🔮</span><span>{mortal.effectPermanent}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MortalTooltip;
