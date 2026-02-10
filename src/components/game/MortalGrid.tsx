import { Mortal } from '@/types/game';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface MortalGridProps {
  mortals: Mortal[];
  compact?: boolean;
  selectable?: boolean;
  onMortalClick?: (mortalId: string) => void;
}

const MortalGrid = ({ mortals, compact = false, selectable = false, onMortalClick }: MortalGridProps) => {
  const gridClass = compact
    ? 'grid grid-cols-5 gap-2'
    : 'grid grid-cols-5 gap-3';

  return (
    <div className={gridClass}>
      {mortals.map((mortal, i) => (
        <MortalToken
          key={mortal.id}
          mortal={mortal}
          compact={compact}
          index={i}
          selectable={selectable && !mortal.isMetamorphosed && mortal.status !== 'incapacite'}
          onClick={onMortalClick}
        />
      ))}
    </div>
  );
};

function MortalToken({
  mortal,
  compact,
  index,
  selectable,
  onClick,
}: {
  mortal: Mortal;
  compact: boolean;
  index: number;
  selectable: boolean;
  onClick?: (id: string) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const imageSrc = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto;
  const displayName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto;
  const hasPermanentEffect = mortal.isMetamorphosed && !!mortal.effectPermanent;
  const isIncapacitated = mortal.status === 'incapacite';
  const showImage = imageSrc && !imgFailed;

  const size = compact ? 'w-14 h-14' : 'w-20 h-20';

  return (
    <div className="relative">
      <motion.div
        className={`
          ${size} rounded-full relative cursor-pointer transition-all duration-300 group overflow-hidden
          ${mortal.isMetamorphosed ? 'ring-2 ring-ether/60' : 'ring-1 ring-border/40'}
          ${isIncapacitated ? 'grayscale opacity-60' : ''}
          ${selectable ? 'ring-2 ring-divine/70 cursor-pointer' : ''}
        `}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...(selectable ? { boxShadow: ['0 0 0px hsl(270 50% 55% / 0)', '0 0 16px hsl(270 50% 55% / 0.5)', '0 0 0px hsl(270 50% 55% / 0)'] } : {}),
        }}
        transition={selectable ? { boxShadow: { duration: 1.5, repeat: Infinity } } : { delay: index * 0.03 }}
        whileHover={{ scale: 1.15, zIndex: 10 }}
        onClick={() => onClick?.(mortal.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {showImage ? (
          <img
            src={imageSrc}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover rounded-full"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: mortal.isMetamorphosed
                ? `linear-gradient(135deg, hsl(var(--ether-dim)), hsl(var(--card)))`
                : `linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))`,
            }}
          >
            <span className={`font-display font-bold ${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
              {mortal.isMetamorphosed ? mortal.etherProduction : mortal.nameRecto.charAt(0)}
            </span>
          </div>
        )}

        {/* Cost badge (recto only, non-compact) */}
        {!mortal.isMetamorphosed && !compact && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-background/80 rounded-t px-1.5">
            <span className="text-[8px] font-display text-ether font-bold">{mortal.cost}</span>
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
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Incapacitated overlay */}
        {isIncapacitated && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/50">
            <span className="text-sm">⛓️</span>
          </div>
        )}

        {/* Metamorphosed glow */}
        {mortal.isMetamorphosed && !hasPermanentEffect && !isIncapacitated && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, hsl(var(--ether) / 0.15) 0%, transparent 70%)` }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Hover tooltip: show verso preview for non-metamorphosed mortals */}
      {hovered && !mortal.isMetamorphosed && (
        <motion.div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-52 rounded-xl overflow-hidden shadow-2xl pointer-events-none"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {mortal.imageVerso && (
            <img
              src={mortal.imageVerso}
              alt={mortal.nameVerso}
              className="w-full h-28 object-cover"
            />
          )}
          <div className="p-2">
            <div className="font-display text-xs font-bold text-foreground">{mortal.nameVerso}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-ether font-display font-semibold">Coût: {mortal.cost} Éther</span>
              <span className="text-[10px] text-muted-foreground">|</span>
              <span className="text-[10px] text-ether font-display">+{mortal.etherProduction} Éther/cycle</span>
            </div>
            {mortal.effectOnMetamorphose && (
              <div className="text-[10px] text-foreground mt-1.5 flex gap-1">
                <span>⚡</span>
                <span>{mortal.effectOnMetamorphose}</span>
              </div>
            )}
            {mortal.effectPermanent && (
              <div className="text-[10px] mt-1 flex gap-1" style={{ color: 'hsl(var(--divine))' }}>
                <span>🔮</span>
                <span>{mortal.effectPermanent}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default MortalGrid;
