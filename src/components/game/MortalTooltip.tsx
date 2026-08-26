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
  const isMeta = mortal.isMetamorphosed;

  // Two clearly separated generation values: face avant (recto) and face métamorphosée (verso).
  // The value currently in effect is highlighted and marked "actuel".
  const rectoValue = isMeta ? mortal.etherProductionRecto : effectiveProduction;
  const versoValue = isMeta ? effectiveProduction : mortal.etherProduction;

  const Row = ({ label, value, active }: { label: string; value: number; active: boolean }) => (
    <div
      className="flex items-center justify-between gap-2 rounded-md px-2 py-1"
      style={{
        background: active ? 'hsl(var(--ether) / 0.14)' : 'transparent',
        border: active ? '1px solid hsl(var(--ether) / 0.35)' : '1px solid transparent',
      }}
    >
      <span className={`text-xs font-display ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
        {active && <span className="ml-1 text-[10px] uppercase tracking-wide text-ether">actuel</span>}
      </span>
      <span className={`text-sm font-display font-bold ${active ? 'text-ether' : 'text-muted-foreground'}`}>
        +{value}/cycle
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="rounded-xl shadow-2xl flex flex-col scrollbar-none"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        width: 'min(280px, calc(100vw - 24px))',
        maxHeight: 'calc(100vh - 24px)',
        overflowY: 'auto',
      }}
    >
      <div className="p-3 pb-2 shrink-0">
        {/* Nom recto */}
        <div className="font-display text-base font-bold text-foreground">{mortal.nameRecto}</div>

        {/* Génération d'Éther : les deux faces, explicitement */}
        <div className="mt-1.5 space-y-0.5">
          <Row label={`Face mortel — ${mortal.nameRecto}`} value={rectoValue} active={!isMeta} />
          <Row label={`Métamorphosé — ${mortal.nameVerso}`} value={versoValue} active={isMeta} />
        </div>

        {/* Coût de métamorphose */}
        {!isMeta && (
          <div className="text-sm text-foreground mt-2 font-display">
            Coût de métamorphose :{' '}
            <span className={`font-bold ${costModified ? 'text-divine' : 'text-ether'}`}>
              {effectiveCost}⚡
            </span>
            {costModified && (
              <span className="text-muted-foreground line-through ml-1 text-xs">{mortal.cost}</span>
            )}
          </div>
        )}
      </div>

      {/* Image verso */}
      {mortal.imageVerso && (
        <img
          src={mortal.imageVerso}
          alt={mortal.nameVerso}
          className="w-full object-contain shrink"
          style={{ maxHeight: 'min(280px, 30vh)' }}
        />
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
