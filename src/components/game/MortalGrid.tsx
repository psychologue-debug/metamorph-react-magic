import { Mortal } from '@/types/game';
import { motion } from 'framer-motion';

interface MortalGridProps {
  mortals: Mortal[];
  compact?: boolean;
}

const MortalGrid = ({ mortals, compact = false }: MortalGridProps) => {
  const gridClass = compact
    ? 'grid grid-cols-5 gap-1'
    : 'grid grid-cols-5 gap-2';

  const size = compact ? 'w-10 h-10' : 'w-16 h-16';

  return (
    <div className={gridClass}>
      {mortals.map((mortal, i) => {
        const hasImage = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto;
        const imageSrc = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto;
        const displayName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto;
        const hasPermanentEffect = mortal.isMetamorphosed && !!mortal.effectPermanent;
        const isIncapacitated = mortal.status === 'incapacite';

        return (
          <motion.div
            key={mortal.id}
            className={`
              ${size} rounded-full relative cursor-pointer transition-all duration-300 group overflow-hidden
              ${mortal.isMetamorphosed ? 'ring-2 ring-ether/60' : 'ring-1 ring-border/40'}
              ${isIncapacitated ? 'grayscale opacity-60' : ''}
            `}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ scale: 1.15, zIndex: 10 }}
            title={`${displayName} — ${mortal.isMetamorphosed ? 'Métamorphosé' : 'Non métamorphosé'} | Éther: ${mortal.isMetamorphosed ? mortal.etherProduction : mortal.etherProductionRecto} | Coût: ${mortal.cost}${mortal.effectPermanent ? ' | ⚡ ' + mortal.effectPermanent : ''}`}
          >
            {/* Image or fallback */}
            {hasImage ? (
              <img
                src={imageSrc}
                alt={displayName}
                className="absolute inset-0 w-full h-full object-cover rounded-full"
                onError={(e) => {
                  // Fallback to letter display if image not found
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}

            {/* Fallback letter display */}
            <div className="absolute inset-0 flex items-center justify-center"
              style={{
                background: mortal.isMetamorphosed
                  ? `linear-gradient(135deg, hsl(var(--ether-dim)), hsl(var(--card)))`
                  : `linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))`,
              }}
            >
              {mortal.isMetamorphosed ? (
                <span className={`font-display font-bold ${compact ? 'text-[9px]' : 'text-xs'} text-ether`}>
                  {mortal.etherProduction}
                </span>
              ) : (
                <span className={`font-display ${compact ? 'text-[8px]' : 'text-[10px]'} text-muted-foreground`}>
                  {mortal.nameRecto.charAt(0)}
                </span>
              )}
            </div>

            {/* Cost badge (recto only) */}
            {!mortal.isMetamorphosed && !compact && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-background/80 rounded-t px-1">
                <span className="text-[7px] font-display text-ether font-bold">{mortal.cost}</span>
              </div>
            )}

            {/* Permanent effect glow halo */}
            {hasPermanentEffect && !isIncapacitated && (
              <motion.div
                className="absolute -inset-1 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, hsl(var(--divine-glow) / 0.3) 0%, hsl(var(--divine) / 0.15) 50%, transparent 70%)`,
                  boxShadow: '0 0 12px hsl(var(--divine) / 0.4), 0 0 24px hsl(var(--divine) / 0.2)',
                }}
                animate={{ 
                  opacity: [0.5, 0.9, 0.5],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Incapacitated overlay */}
            {isIncapacitated && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/50">
                <span className="text-[10px]">⛓️</span>
              </div>
            )}

            {/* Metamorphosed glow */}
            {mortal.isMetamorphosed && !hasPermanentEffect && !isIncapacitated && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, hsl(var(--ether) / 0.15) 0%, transparent 70%)`,
                }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default MortalGrid;
