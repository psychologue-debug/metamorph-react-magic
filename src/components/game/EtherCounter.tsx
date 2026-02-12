import { motion } from 'framer-motion';

interface EtherCounterProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
}

const EtherCounter = ({ amount, size = 'md' }: EtherCounterProps) => {
  const dims = {
    sm: { w: 36, h: 32, font: 'text-sm', top: 6 },
    md: { w: 48, h: 42, font: 'text-base', top: 8 },
    lg: { w: 64, h: 56, font: 'text-xl', top: 10 },
  }[size];

  return (
    <motion.div
      className="relative flex items-start justify-center font-display font-bold"
      style={{ width: dims.w, height: dims.h }}
      animate={{
        filter: [
          'drop-shadow(0 0 4px hsl(270 60% 50% / 0.3))',
          'drop-shadow(0 0 10px hsl(270 60% 50% / 0.5))',
          'drop-shadow(0 0 4px hsl(270 60% 50% / 0.3))',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Cup/chalice SVG shape */}
      <svg viewBox="0 0 48 42" className="absolute inset-0 w-full h-full">
        {/* Cup body */}
        <path
          d="M6 4 Q6 0 12 0 L36 0 Q42 0 42 4 L40 28 Q39 36 24 38 Q9 36 8 28 Z"
          fill="url(#cupGradient)"
          stroke="hsl(270 50% 40%)"
          strokeWidth="1.2"
        />
        {/* Base */}
        <path
          d="M16 38 Q24 40 32 38 L30 42 L18 42 Z"
          fill="hsl(270 30% 25%)"
          stroke="hsl(270 50% 40%)"
          strokeWidth="0.8"
        />
        {/* Inner liquid glow */}
        <path
          d="M10 6 L38 6 L36 26 Q35 33 24 35 Q13 33 12 26 Z"
          fill="url(#liquidGradient)"
          opacity="0.8"
        />
        <defs>
          <linearGradient id="cupGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(270 40% 35%)" />
            <stop offset="100%" stopColor="hsl(270 30% 20%)" />
          </linearGradient>
          <radialGradient id="liquidGradient" cx="0.5" cy="0.3" r="0.6">
            <stop offset="0%" stopColor="hsl(270 70% 65%)" />
            <stop offset="60%" stopColor="hsl(270 60% 45%)" />
            <stop offset="100%" stopColor="hsl(270 40% 30%)" />
          </radialGradient>
        </defs>
      </svg>
      {/* Amount text */}
      <span
        className={`${dims.font} relative z-10 text-white font-bold`}
        style={{ marginTop: dims.top, textShadow: '0 0 8px hsl(270 80% 70% / 0.6)' }}
      >
        {amount}
      </span>
    </motion.div>
  );
};

export default EtherCounter;
