import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const PURPLE = 'hsl(270 70% 50%)';

// User gives y with high=top; CSS y is inverted → cssY = 100 - userY.
const POSITIONS: Record<string, { x: number; y: number }> = {
  // Bottom row
  'BAC-09': { x: 15, y: 15 }, // Les trois filles de Mynias
  'BAC-10': { x: 45, y: 25 }, // Arné
  'BAC-02': { x: 85, y: 15 }, // Matelos tyrrhéniens

  // Middle band
  'BAC-07': { x: 15, y: 50 }, // Battus
  'BAC-04': { x: 35, y: 60 }, // Les filles d'Anius
  'BAC-01': { x: 68, y: 50 }, // Lycaon
  'BAC-03': { x: 85, y: 60 }, // Les Isméniennes

  // Top row chain
  'BAC-08': { x: 15, y: 85 }, // Les Ménades
  'BAC-06': { x: 50, y: 85 }, // Clytie
  'BAC-05': { x: 85, y: 85 }, // Myrrha
};

const CONNECTIONS: ConnectionDef[] = [
  { from: 'BAC-08', to: 'BAC-06', color: PURPLE, style: 'arrow' },
  { from: 'BAC-06', to: 'BAC-05', color: PURPLE, style: 'arrow' },
];

const BacchusLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default BacchusLayout;
