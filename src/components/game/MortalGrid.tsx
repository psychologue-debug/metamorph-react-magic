import { Mortal } from '@/types/game';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

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
  const tokenRef = useRef<HTMLDivElement>(null);
  const [tooltipSide, setTooltipSide] = useState<'bottom' | 'top'>('top');

  const imageSrc = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto;
  const displayName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto;
  const hasPermanentEffect = mortal.isMetamorphosed && !!mortal.effectPermanent;
  const isIncapacitated = mortal.status === 'incapacite';
  const showImage = imageSrc && !imgFailed;
  const isSmall = size < 80;
  const fontSize = size < 60 ? 'text-xs' : size < 100 ? 'text-sm' : 'text-lg';

  // Determine tooltip position based on screen position
  useEffect(() => {
    if (hovered && tokenRef.current) {
      const rect = tokenRef.current.getBoundingClientRect();
      // If token is in the top 400px of the screen, show tooltip below
      setTooltipSide(rect.top < 400 ? 'bottom' : 'top');
    }
  }, [hovered]);

  // Show tooltip for both recto (preview verso) and verso (show current card info)
  const showTooltip = hovered;
  const tooltipImage = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageVerso;
  const tooltipName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameVerso;

  return (
    <div className="relative" ref={tokenRef} style={{ zIndex: hovered ? 9999 : 'auto' }}>
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

      {/* Hover tooltip — card-shaped, positioned dynamically */}
      {showTooltip && (
        <motion.div
          className={`absolute left-1/2 -translate-x-1/2 z-[9999] pointer-events-none ${
            tooltipSide === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'
          }`}
          initial={{ opacity: 0, y: tooltipSide === 'top' ? 5 : -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              width: '280px',
            }}
          >
            {tooltipImage && (
              <img
                src={tooltipImage}
                alt={tooltipName}
                className="w-full object-contain"
                style={{ maxHeight: '360px' }}
              />
            )}
            <div className="p-3">
              <div className="font-display text-lg font-bold text-foreground">{tooltipName}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base text-ether font-display font-semibold">Coût: {mortal.cost} Éther</span>
                <span className="text-base text-muted-foreground">|</span>
                <span className="text-base text-ether font-display">+{mortal.etherProduction} Éther/cycle</span>
              </div>
              {mortal.effectOnMetamorphose && (
                <div className="text-sm text-foreground mt-2 flex gap-2">
                  <span>⚡</span>
                  <span>{mortal.effectOnMetamorphose}</span>
                </div>
              )}
              {mortal.effectPermanent && (
                <div className="text-sm mt-1 flex gap-2" style={{ color: 'hsl(var(--divine))' }}>
                  <span>🔮</span>
                  <span>{mortal.effectPermanent}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default MortalGrid;
