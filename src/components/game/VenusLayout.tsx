import { Mortal, Player, GameState } from '@/types/game';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { isMortalInvulnerable, isMortalRetired } from '@/engine/mortalStatuses';
import { getHaloType, HALO_STYLES } from '@/engine/mortalHalos';
import { Shield } from 'lucide-react';

interface VenusLayoutProps {
  mortals: Mortal[];
  owner: Player;
  gameState: GameState;
  selectable?: boolean;
  onMortalClick?: (mortalId: string) => void;
  onMortalHover?: (mortal: Mortal | null) => void;
}

const POSITIONS: Record<string, { x: number; y: number }> = {
  'VEN-03': { x: 14, y: 10 },
  'VEN-02': { x: 38, y: 8 },
  'VEN-04': { x: 82, y: 10 },
  'VEN-05': { x: 22, y: 35 },
  'VEN-10': { x: 10, y: 62 },
  'VEN-01': { x: 50, y: 58 },
  'VEN-08': { x: 78, y: 50 },
  'VEN-09': { x: 22, y: 85 },
  'VEN-07': { x: 52, y: 85 },
  'VEN-06': { x: 80, y: 85 },
};

const BLUE_CONNECTIONS: [string, string][] = [
  ['VEN-05', 'VEN-03'], ['VEN-05', 'VEN-02'],
];

const RED_CONNECTIONS: [string, string][] = [
  ['VEN-01', 'VEN-08'], ['VEN-07', 'VEN-06'],
];

const TOKEN_SIZE = 130;
const PADDING = 25;

const VenusLayout = ({ mortals, owner, gameState, selectable, onMortalClick, onMortalHover }: VenusLayoutProps) => {
  return (
    <div className="relative w-full h-full" style={{ padding: PADDING }}>
      <div className="relative w-full h-full">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {BLUE_CONNECTIONS.map(([from, to], i) => {
            const pFrom = POSITIONS[from]; const pTo = POSITIONS[to];
            if (!pFrom || !pTo) return null;
            return <line key={`blue-${i}`} x1={`${pFrom.x}%`} y1={`${pFrom.y}%`} x2={`${pTo.x}%`} y2={`${pTo.y}%`} stroke="hsl(210 70% 50%)" strokeWidth="5" strokeOpacity="0.55" strokeLinecap="round" />;
          })}
          {RED_CONNECTIONS.map(([from, to], i) => {
            const pFrom = POSITIONS[from]; const pTo = POSITIONS[to];
            if (!pFrom || !pTo) return null;
            return <line key={`red-${i}`} x1={`${pFrom.x}%`} y1={`${pFrom.y}%`} x2={`${pTo.x}%`} y2={`${pTo.y}%`} stroke="hsl(0 70% 50%)" strokeWidth="5" strokeOpacity="0.55" strokeLinecap="round" />;
          })}
        </svg>

        {mortals.map((mortal) => {
          const pos = POSITIONS[mortal.code];
          if (!pos) return null;
          return (
            <div key={mortal.id} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
              <VenusToken mortal={mortal} owner={owner} gameState={gameState} selectable={selectable} onClick={onMortalClick} onHover={onMortalHover} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

function VenusToken({
  mortal, owner, gameState, selectable, onClick, onHover,
}: {
  mortal: Mortal; owner: Player; gameState: GameState;
  selectable?: boolean; onClick?: (id: string) => void; onHover?: (m: Mortal | null) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageSrc = mortal.isMetamorphosed ? mortal.imageVerso : mortal.imageRecto;
  const displayName = mortal.isMetamorphosed ? mortal.nameVerso : mortal.nameRecto;
  const isIncapacitated = mortal.status === 'incapacite';
  const isRetired = isMortalRetired(mortal);
  const isInvulnerable = isMortalInvulnerable(mortal, owner, gameState);
  const showImage = imageSrc && !imgFailed;

  const haloType = getHaloType(mortal);
  const haloStyle = haloType !== 'none' ? HALO_STYLES[haloType] : null;

  return (
    <motion.div
      className={`mortal-token
        rounded-full relative cursor-pointer transition-all duration-300 overflow-hidden
        ${mortal.isMetamorphosed ? 'ring-2 ring-ether/60' : 'ring-1 ring-border/40'}
        ${isRetired ? 'grayscale opacity-40 pointer-events-none' : ''}
        ${isIncapacitated && !isRetired ? 'grayscale opacity-60' : ''}
        ${selectable ? 'ring-2 ring-divine/70 cursor-pointer' : ''}
      `}
      style={{ width: TOKEN_SIZE, height: TOKEN_SIZE }}
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
          <span className="font-display font-bold text-sm text-muted-foreground">
            {mortal.isMetamorphosed ? mortal.etherProduction : mortal.nameRecto.charAt(0)}
          </span>
        </div>
      )}

      {/* Effect-type halo */}
      {haloStyle && !isIncapacitated && !isRetired && (
        <motion.div className="absolute -inset-2 rounded-full pointer-events-none"
          style={{ background: haloStyle.gradient, boxShadow: haloStyle.boxShadow }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {isRetired && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/60"><span className="text-lg">🚫</span></div>
      )}
      {isIncapacitated && !isRetired && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/40">
          <motion.div className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, hsl(0 0% 20% / 0.6) 30%, hsl(0 0% 10% / 0.3) 70%)' }}
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
  );
}

export default VenusLayout;
