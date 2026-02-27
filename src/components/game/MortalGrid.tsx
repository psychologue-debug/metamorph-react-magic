import { Mortal, Player, GameState } from '@/types/game';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { getEffectiveMetamorphosisCost } from '@/engine/costModifiers';
import { getEffectiveEtherProduction } from '@/engine/etherGeneration';
import { isMortalInvulnerable, isMortalRetired } from '@/engine/mortalStatuses';
import { Shield } from 'lucide-react';

interface MortalGridProps {
  mortals: Mortal[];
  owner?: Player;
  gameState?: GameState;
  tokenSize?: number;
  selectable?: boolean;
  targetingMode?: boolean;
  onMortalClick?: (mortalId: string) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const MortalGrid = ({ mortals, owner, gameState, tokenSize = 80, selectable = false, targetingMode = false, onMortalClick, containerRef }: MortalGridProps) => {
  const gap = tokenSize < 60 ? 4 : tokenSize < 100 ? 8 : 12;

  return (
    <>
      {mortals.map((mortal, i) => (
        <MortalToken
          key={mortal.id}
          mortal={mortal}
          owner={owner}
          gameState={gameState}
          size={tokenSize}
          index={i}
          selectable={targetingMode || (selectable && !mortal.isMetamorphosed && mortal.status !== 'incapacite')}
          onClick={onMortalClick}
          containerRef={containerRef}
        />
      ))}
    </>
  );
};

function MortalToken({
  mortal,
  owner,
  gameState,
  size,
  index,
  selectable,
  onClick,
  containerRef,
}: {
  mortal: Mortal;
  owner?: Player;
  gameState?: GameState;
  size: number;
  index: number;
  selectable: boolean;
  onClick?: (id: string) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const tokenRef = useRef<HTMLDivElement>(null);
  const [tooltipSide, setTooltipSide] = useState<'bottom' | 'top'>('top');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const imageSrc = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto;
  const displayName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto;
  const hasPermanentEffect = mortal.isMetamorphosed && !!mortal.effectPermanent;
  const isIncapacitated = mortal.status === 'incapacite';
  const isRetired = isMortalRetired(mortal);
  const isInvulnerable = owner && gameState ? isMortalInvulnerable(mortal, owner, gameState) : false;
  const showImage = imageSrc && !imgFailed;
  const isSmall = size < 80;
  const fontSize = size < 60 ? 'text-xs' : size < 100 ? 'text-sm' : 'text-lg';

  // Determine tooltip position based on screen position
  useEffect(() => {
    if (hovered && tokenRef.current) {
      const rect = tokenRef.current.getBoundingClientRect();
      const containerRect = containerRef?.current?.getBoundingClientRect();
      
      // Determine vertical side
      const tooltipHeight = 420; // approximate max tooltip height
      const spaceAbove = containerRect ? rect.top - containerRect.top : rect.top;
      const side = spaceAbove < tooltipHeight ? 'bottom' : 'top';
      setTooltipSide(side);

      // Clamp horizontally within container
      if (containerRect) {
        const tooltipWidth = 280;
        const tokenCenterX = rect.left + rect.width / 2;
        const idealLeft = tokenCenterX - tooltipWidth / 2;
        const idealRight = tokenCenterX + tooltipWidth / 2;
        let offsetX = 0;
        if (idealLeft < containerRect.left + 8) {
          offsetX = containerRect.left + 8 - idealLeft;
        } else if (idealRight > containerRect.right - 8) {
          offsetX = containerRect.right - 8 - idealRight;
        }
        setTooltipStyle({ transform: `translateX(calc(-50% + ${offsetX}px))` });
      } else {
        setTooltipStyle({});
      }
    }
  }, [hovered, containerRef]);

  // Show tooltip for both recto (preview verso) and verso (show current card info)
  const showTooltip = hovered;
  const tooltipImage = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageVerso;
  const tooltipName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameVerso;

  return (
    <div className="relative" ref={tokenRef} style={{ zIndex: hovered ? 99999 : 'auto' }}>
      <motion.div
        className={`
          rounded-full relative cursor-pointer transition-all duration-300 group overflow-hidden
          ${mortal.isMetamorphosed ? 'ring-2 ring-ether/60' : 'ring-1 ring-border/40'}
          ${isRetired ? 'grayscale opacity-40 pointer-events-none' : ''}
          ${isIncapacitated && !isRetired ? 'grayscale opacity-60' : ''}
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

        {/* Retired overlay */}
        {isRetired && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/60">
            <span className="text-lg">🚫</span>
          </div>
        )}

        {/* Incapacitated overlay */}
        {isIncapacitated && !isRetired && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/40">
            <motion.div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, hsl(0 0% 20% / 0.6) 30%, hsl(0 0% 10% / 0.3) 70%)',
                boxShadow: 'inset 0 0 12px hsl(270 30% 15% / 0.5)',
              }}
              animate={{ opacity: [0.7, 0.9, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-lg font-display font-bold" style={{ color: 'hsl(270 40% 65%)' }}>💤</span>
            </motion.div>
          </div>
        )}

        {/* Invulnerable shield indicator */}
        {isInvulnerable && !isRetired && (
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(45 90% 55%), hsl(35 80% 45%))',
              boxShadow: '0 0 8px hsl(45 90% 55% / 0.6)',
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-3 h-3 text-white" />
          </motion.div>
        )}

        {/* Metamorphosed glow */}
        {mortal.isMetamorphosed && !hasPermanentEffect && !isIncapacitated && !isRetired && (
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
          className={`absolute left-1/2 z-[99999] pointer-events-none ${
            tooltipSide === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'
          }`}
          style={tooltipStyle}
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
                {(() => {
                  const effectiveCost = owner && gameState
                    ? getEffectiveMetamorphosisCost(mortal, owner, gameState)
                    : mortal.cost;
                  const effectiveProduction = owner && gameState
                    ? getEffectiveEtherProduction(mortal, owner, gameState)
                    : (mortal.isMetamorphosed ? mortal.etherProduction : mortal.etherProductionRecto);
                  const costModified = effectiveCost !== mortal.cost;
                  return (
                    <>
                      <span className={`text-base font-display font-semibold ${costModified ? 'text-divine' : 'text-ether'}`}>
                        Coût: {effectiveCost} Éther
                        {costModified && <span className="text-muted-foreground line-through ml-1 text-sm">{mortal.cost}</span>}
                      </span>
                      <span className="text-base text-muted-foreground">|</span>
                      <span className="text-base text-ether font-display">+{effectiveProduction} Éther/cycle</span>
                    </>
                  );
                })()}
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
