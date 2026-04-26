import { Mortal, Player, GameState } from '@/types/game';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { isMortalInvulnerable, isMortalRetired } from '@/engine/mortalStatuses';
import { getHaloType, HALO_STYLES } from '@/engine/mortalHalos';
import { Shield } from 'lucide-react';
import { useDisplayPreferences } from '@/hooks/useDisplayPreferences';
import { MORTAL_PRIORITIES, ROMAN } from '@/data/mortalPriorities';

interface BoardTokenProps {
  mortal: Mortal;
  owner: Player;
  gameState: GameState;
  size?: number;
  selectable?: boolean;
  onClick?: (id: string) => void;
  onHover?: (m: Mortal | null) => void;
}

const BoardToken = ({ mortal, owner, gameState, size = 140, selectable, onClick, onHover }: BoardTokenProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const { showHalos, showPriorities } = useDisplayPreferences();
  const imageSrc = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto;
  const displayName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto;
  const isIncapacitated = mortal.status === 'incapacite';
  const isRetired = isMortalRetired(mortal);
  const isInvulnerable = isMortalInvulnerable(mortal, owner, gameState);
  const showImage = imageSrc && !imgFailed;

  const haloType = getHaloType(mortal, owner);
  const haloStyle = (showHalos && haloType !== 'none') ? HALO_STYLES[haloType] : null;

  // Priority badge: only on non-metamorphosed mortels and only if priority is defined for this code
  const priority = MORTAL_PRIORITIES[mortal.code];
  const showPriorityBadge = showPriorities && !mortal.isMetamorphosed && !!priority;

  // Scale internal accents with token size
  const badgeSize = Math.max(14, Math.round(size * 0.28));
  const invSize = Math.max(12, Math.round(size * 0.22));
  const fontPx = Math.max(10, Math.round(size * 0.16));

  return (
    <motion.div
      className={`mortal-token
        rounded-full relative cursor-pointer transition-all duration-300 overflow-hidden
        ${!haloStyle && mortal.isMetamorphosed ? 'ring-2 ring-ether/60' : !mortal.isMetamorphosed ? 'ring-1 ring-border/40' : ''}
        ${isRetired ? 'grayscale opacity-40 pointer-events-none' : ''}
        ${isIncapacitated && !isRetired ? 'grayscale opacity-60' : ''}
        ${selectable ? 'ring-2 ring-divine/70 cursor-pointer' : ''}
      `}
      style={{ width: size, height: size, ...(haloStyle ? { boxShadow: haloStyle.boxShadow } : {}) }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1, scale: 1,
        ...(selectable ? { boxShadow: ['0 0 0px hsl(270 50% 55% / 0)', '0 0 16px hsl(270 50% 55% / 0.5)', '0 0 0px hsl(270 50% 55% / 0)'] } : {}),
      }}
      transition={selectable ? { boxShadow: { duration: 1.5, repeat: Infinity } } : { duration: 0.3 }}
      whileHover={{ scale: 1.15, zIndex: 10 }}
      onClick={() => onClick?.(mortal.id)}
      onMouseEnter={() => onHover?.(mortal)}
      onMouseLeave={() => onHover?.(null)}
    >
      {showImage ? (
        <img src={imageSrc} alt={displayName} className="absolute inset-0 w-full h-full object-cover rounded-full" onError={() => setImgFailed(true)} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: mortal.isMetamorphosed ? 'linear-gradient(135deg, hsl(var(--ether-dim)), hsl(var(--card)))' : 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))' }}>
          <span className="font-display font-bold text-muted-foreground" style={{ fontSize: fontPx }}>
            {mortal.isMetamorphosed ? mortal.etherProduction : mortal.nameRecto.charAt(0)}
          </span>
        </div>
      )}

      {isRetired && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/60"><span style={{ fontSize: fontPx * 1.2 }}>🚫</span></div>
      )}
      {isIncapacitated && !isRetired && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/40">
          <motion.div className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, hsl(0 0% 20% / 0.6) 30%, hsl(0 0% 10% / 0.3) 70%)' }}
            animate={{ opacity: [0.7, 0.9, 0.7] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
            <span className="font-display font-bold" style={{ color: 'hsl(270 40% 65%)', fontSize: fontPx * 1.2 }}>💤</span>
          </motion.div>
        </div>
      )}
      {isInvulnerable && !isRetired && (
        <motion.div className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
          style={{
            width: invSize, height: invSize,
            background: 'linear-gradient(135deg, hsl(45 90% 55%), hsl(35 80% 45%))',
            boxShadow: '0 0 8px hsl(45 90% 55% / 0.6)',
          }}
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <Shield className="text-white" style={{ width: invSize * 0.6, height: invSize * 0.6 }} />
        </motion.div>
      )}

      {showPriorityBadge && (
        <div
          className="absolute font-display font-bold rounded-full flex items-center justify-center pointer-events-none"
          style={{
            top: -badgeSize * 0.2, left: -badgeSize * 0.2,
            width: badgeSize, height: badgeSize,
            fontSize: badgeSize * 0.55,
            color: 'hsl(45 95% 55%)',
            background: 'hsl(var(--background) / 0.85)',
            border: '2px solid hsl(45 95% 55%)',
            boxShadow: '0 0 6px hsl(45 95% 55% / 0.5)',
            zIndex: 3,
          }}
        >
          {ROMAN[priority!]}
        </div>
      )}
    </motion.div>
  );
};

export default BoardToken;
