import { Mortal } from '@/types/game';
import { motion } from 'framer-motion';

interface MortalGridProps {
  mortals: Mortal[];
  compact?: boolean;
}

const MortalGrid = ({ mortals, compact = false }: MortalGridProps) => {
  const gridClass = compact
    ? 'grid grid-cols-5 gap-0.5'
    : 'grid grid-cols-5 gap-1';

  return (
    <div className={gridClass}>
      {mortals.map((mortal, i) => (
        <motion.div
          key={mortal.id}
          className={`
            ${compact ? 'w-5 h-7' : 'w-8 h-11'} 
            rounded-sm relative cursor-pointer transition-all duration-300 group
            ${mortal.isMetamorphosed ? 'card-mortal metamorphosed' : 'card-mortal'}
          `}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          whileHover={{ scale: 1.15, zIndex: 10 }}
          title={`${mortal.name} — ${mortal.isMetamorphosed ? 'Métamorphosé' : 'Non métamorphosé'} | Génère: ${mortal.value} | Coût: ${mortal.cost}`}
        >
          {/* Recto/Verso indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            {mortal.isMetamorphosed ? (
              <span className={`font-display font-bold ${compact ? 'text-[8px]' : 'text-[10px]'} text-ether`}>
                {mortal.value}
              </span>
            ) : (
              <span className={`font-display ${compact ? 'text-[7px]' : 'text-[9px]'} text-muted-foreground`}>
                {mortal.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Glow effect on metamorphosed */}
          {mortal.isMetamorphosed && (
            <motion.div
              className="absolute inset-0 rounded-sm pointer-events-none"
              style={{
                background: `radial-gradient(circle, hsl(var(--ether) / 0.15) 0%, transparent 70%)`,
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default MortalGrid;
