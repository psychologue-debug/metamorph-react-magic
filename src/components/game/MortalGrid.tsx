import { Mortal } from '@/types/game';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface MortalGridProps {
  mortals: Mortal[];
  tokenSize?: number;
  selectable?: boolean;
  onMortalClick?: (mortalId: string) => void;
}

const MortalGrid = ({ mortals, tokenSize = 80, selectable = false, onMortalClick }: MortalGridProps) => {
  const gap = tokenSize < 60 ? 4 : tokenSize < 100 ? 8 : 12;

  return (
    <div
      className="grid grid-cols-5"
      style={{ gap: `${gap}px` }}
    >
      {mortals.map((mortal, i) => (
        <MortalToken
          key={mortal.id}
          mortal={mortal}
          size={tokenSize}
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
  size,
  index,
  selectable,
  onClick,
}: {
  mortal: Mortal;
  size: number;
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
  const isSmall = size < 80;
  const fontSize = size < 60 ? 'text-xs' : size < 100 ? 'text-sm' : 'text-lg';
  const costFontSize = size < 60 ? 'text-[10px]' : size < 100 ? 'text-sm' : 'text-lg';

  return (
    <div className="relative">
      <motion.div
        className={`
          rounded-full relative cursor-pointer transition-all duration-300 group overflow-hidden
          ${mortal.isMetamorphosed ? 'ring-2 ring-ether/60' : 'ring-1 ring-border/40'}
          ${isIncapacitated ? 'grayscale opacity-60' : ''}
          ${selectable ? 'ring-2 ring-divine/70 cursor-pointer' : ''}
        `}
        style={{ width: size, height: size }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...(selectable ? { boxShadow: ['0 0 0px hsl(270 50% 55% / 0)', '0 0 16px hsl(270 50% 55% / 0.5)', '0 0 0px hsl(270 50% 55% / 0)'] } : {}),
        }}
        transition={selectable ? { boxShadow: { duration: 1.5, repeat: Infinity } } : { delay: index * 0.03 }}
        whileHover={{ scale: 1.1, zIndex: 10 }}
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
            <span className={`font-display font-bold ${fontSize} text-muted-foreground`}>
              {mortal.isMetamorphosed ? mortal.etherProduction : mortal.nameRecto.charAt(0)}
            </span>
          </div>
        )}

        {/* Cost badge (recto only) */}
        {!mortal.isMetamorphosed && !isSmall && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-background/80 rounded-t px-2 py-0.5">
            <span className={`${costFontSize} font-display text-ether font-bold`}>{mortal.cost}</span>
          </div>
        )}

        {/* Permanent effect glow */}
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
            <span className="text-2xl">⛓️</span>
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

      {/* Hover tooltip: verso preview — doubled surface */}
      {hovered && !mortal.isMetamorphosed && (
        <motion.div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-[480px] rounded-xl overflow-hidden shadow-2xl pointer-events-none"
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
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-5">
            <div className="font-display text-xl font-bold text-foreground">{mortal.nameVerso}</div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-lg text-ether font-display font-semibold">Coût: {mortal.cost} Éther</span>
              <span className="text-lg text-muted-foreground">|</span>
              <span className="text-lg text-ether font-display">+{mortal.etherProduction} Éther/cycle</span>
            </div>
            {mortal.effectOnMetamorphose && (
              <div className="text-base text-foreground mt-3 flex gap-2">
                <span>⚡</span>
                <span>{mortal.effectOnMetamorphose}</span>
              </div>
            )}
            {mortal.effectPermanent && (
              <div className="text-base mt-2 flex gap-2" style={{ color: 'hsl(var(--divine))' }}>
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
