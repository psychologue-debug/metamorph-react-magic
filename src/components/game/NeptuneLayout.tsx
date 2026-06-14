import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const BLUE = 'hsl(210 70% 50%)';

// User gives y with high=top; CSS y is inverted → cssY = 100 - userY.
const POSITIONS: Record<string, { x: number; y: number }> = {
  'NEP-09': { x: 80, y: 85 }, // Cénis
  'NEP-07': { x: 71, y: 70 }, // Scylla
  'NEP-04': { x: 85, y: 45 }, // Lichas
  'NEP-06': { x: 50, y: 85 }, // Daphné
  'NEP-03': { x: 20, y: 85 }, // Bateaux grecs
  'NEP-10': { x: 40, y: 46 }, // Ino et Mélicerte
  'NEP-08': { x: 20, y: 50 }, // Périclymène
  'NEP-01': { x: 20, y: 15 }, // Thétis
  'NEP-02': { x: 45, y: 15 }, // Périmèle
  'NEP-05': { x: 70, y: 15 }, // Cygnus
};

const CONNECTIONS: ConnectionDef[] = [
  { from: 'NEP-03', to: 'NEP-06', color: BLUE }, // Bateaux grecs → Daphné
  { from: 'NEP-10', to: 'NEP-08', color: BLUE }, // Ino et Mélicerte → Périclymène
  { from: 'NEP-02', to: 'NEP-01', color: BLUE }, // Périmèle → Thétis
  { from: 'NEP-02', to: 'NEP-08', color: BLUE }, // Périmèle → Périclymène
  { from: 'NEP-05', to: 'NEP-02', color: BLUE }, // Cygnus → Périmèle
];

const NeptuneLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default NeptuneLayout;
