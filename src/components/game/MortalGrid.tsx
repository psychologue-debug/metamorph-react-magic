import { Mortal, Player, GameState } from '@/types/game';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { isMortalInvulnerable, isMortalRetired } from '@/engine/mortalStatuses';
import { getHaloType, HALO_STYLES } from '@/engine/mortalHalos';
import { Shield } from 'lucide-react';

interface MortalGridProps {
  mortals: Mortal[];
  owner?: Player;
  gameState?: GameState;
  tokenSize?: number;
  selectable?: boolean;
  targetingMode?: boolean;
  onMortalClick?: (mortalId: string) => void;
  onMortalHover?: (mortal: Mortal | null) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const TOKEN_SIZE = 140;

const MortalGrid = ({ mortals, owner, gameState, tokenSize = TOKEN_SIZE, selectable = false, targetingMode = false, onMortalClick, onMortalHover }: MortalGridProps) => {
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
          onHover={onMortalHover}
        />
      ))}
    </>
  );
};

function MortalToken({
  mortal, owner, gameState, size, index, selectable, onClick, onHover,
}: {
  mortal: Mortal; owner?: Player; gameState?: GameState;
  size: number; index: number; selectable: boolean;
  onClick?: (id: string) => void; onHover?: (mortal: Mortal | null) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageSrc = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto;
  const displayName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto;
  const isIncapacitated = mortal.status === 'incapacite';
  const isRetired = isMortalRetired(mortal);
  const isInvulnerable = owner && gameState ? isMortalInvulnerable(mortal, owner, gameState) : false;
  const showImage = imageSrc && !imgFailed;
  const fontSize = size < 60 ? 'text-xs' : size < 100 ? 'text-sm' : 'text-lg';

  const haloType = getHaloType(mortal);
  const haloStyle = haloType !== 'none' ? HALO_STYLES[haloType] : null;

  return (
    <div className="relative">
      {selectable && (
        <motion.div
          className="absolute inset-[-3px] rounded-full pointer-events-none"
          animate={{ boxShadow: ['0 0 0px hsl(270 50% 55% / 0)', '0 0 18px hsl(270 50% 55% / 0.6)', '0 0 0px hsl(270 50% 55% / 0)'] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <motion.div
        className={`mortal-token
          rounded-full relative cursor-pointer transition-all duration-300 overflow-hidden
          ${!haloStyle && mortal.isMetamorphosed ? 'ring-2 ring-ether/60' : !mortal.isMetamorphosed ? 'ring-1 ring-border/40' : ''}
          ${isRetired ? 'grayscale opacity-40 pointer-events-none' : ''}
          ${isIncapacitated && !isRetired ? 'grayscale opacity-60' : ''}
        `}
        style={{ width: size, height: size, ...(haloStyle ? { boxShadow: haloStyle.boxShadow } : {}) }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03 }}
        whileHover={{ scale: 1.1, zIndex: 10 }}
        onClick={() => onClick?.(mortal.id)}
        onMouseEnter={() => onHover?.(mortal)}
        onMouseLeave={() => onHover?.(null)}
      >
        {showImage ? (
          <img src={imageSrc} alt={displayName} className="absolute inset-0 w-full h-full object-cover rounded-full" onError={() => setImgFailed(true)} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: mortal.isMetamorphosed ? 'linear-gradient(135deg, hsl(var(--ether-dim)), hsl(var(--card)))' : 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))' }}>
            <span className={`font-display font-bold ${fontSize} text-muted-foreground`}>
              {mortal.isMetamorphosed ? mortal.etherProduction : mortal.nameRecto.charAt(0)}
            </span>
          </div>
        )}

        {isRetired && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/60">
            <span className="text-lg">🚫</span>
          </div>
        )}
        {isIncapacitated && !isRetired && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/40">
            <motion.div className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle, hsl(0 0% 20% / 0.6) 30%, hsl(0 0% 10% / 0.3) 70%)', boxShadow: 'inset 0 0 12px hsl(270 30% 15% / 0.5)' }}
              animate={{ opacity: [0.7, 0.9, 0.7] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
              <span className="text-lg font-display font-bold" style={{ color: 'hsl(270 40% 65%)' }}>💤</span>
            </motion.div>
          </div>
        )}
        {isInvulnerable && !isRetired && (
          <motion.div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(45 90% 55%), hsl(35 80% 45%))', boxShadow: '0 0 8px hsl(45 90% 55% / 0.6)' }}
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Shield className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default MortalGrid;
