import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const DARK_RED = 'hsl(0 75% 35%)';

// Note: user gives coordinates with y=high meaning "haut" (top of board).
// CSS y is inverted (0 = top), so we flip: cssY = 100 - userY.
const POSITIONS: Record<string, { x: number; y: number }> = {
  // Top-left cluster: ether generators
  'VEN-03': { x: 10, y: 15 }, // Égérie
  'VEN-05': { x: 22, y: 35 }, // Byblis
  'VEN-02': { x: 45, y: 15 }, // Aréthuse

  // Top-right
  'VEN-04': { x: 85, y: 15 }, // Les Méléagrides (Oiseaux)

  // Mid-left
  'VEN-10': { x: 10, y: 65 }, // Anaxarète
  'VEN-09': { x: 22, y: 85 }, // Les Héliades

  // Bottom-right combo pair
  'VEN-07': { x: 65, y: 90 }, // Actéon
  'VEN-06': { x: 85, y: 90 }, // Iphigénie

  // Mid-right combo pair
  'VEN-01': { x: 65, y: 60 }, // Philomène
  'VEN-08': { x: 85, y: 60 }, // Coronis
};

const CONNECTIONS: ConnectionDef[] = [
  { from: 'VEN-07', to: 'VEN-06', color: DARK_RED },
  { from: 'VEN-01', to: 'VEN-08', color: DARK_RED },
];

const VenusLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default VenusLayout;
