import { motion } from 'framer-motion';

interface EtherCounterProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
}

const EtherCounter = ({ amount, size = 'md' }: EtherCounterProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-display font-bold ether-glow relative`}
      style={{
        background: `radial-gradient(circle, hsl(var(--ether-glow)) 0%, hsl(var(--ether)) 60%, hsl(var(--ether-dim)) 100%)`,
        color: 'hsl(var(--primary-foreground))',
      }}
      animate={{
        boxShadow: [
          '0 0 10px hsl(42 78% 55% / 0.3), 0 0 20px hsl(42 78% 55% / 0.1)',
          '0 0 20px hsl(42 78% 55% / 0.5), 0 0 40px hsl(42 78% 55% / 0.2)',
          '0 0 10px hsl(42 78% 55% / 0.3), 0 0 20px hsl(42 78% 55% / 0.1)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {amount}
    </motion.div>
  );
};

export default EtherCounter;
