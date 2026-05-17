import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const PURPLE = 'hsl(270 70% 50%)';

// User gives y with high=top; CSS y is inverted → cssY = 100 - userY.
const POSITIONS: Record<string, { x: number; y: number }> = {
  // Macarée hub group
  'CER-02': { x: 40, y: 40 }, // Les compagnons de Macarée (hub)
  'CER-03': { x: 16, y: 75 }, // Ascalaphus
  'CER-09': { x: 12, y: 50 }, // Picus
  'CER-06': { x: 14, y: 20 }, // Fourmillière
  'CER-05': { x: 50, y: 15 }, // Enfant de la maison de chaume
  'CER-01': { x: 80, y: 19 }, // Lyncus

  // Cyané hub group
  'CER-04': { x: 63, y: 58 }, // Cyané (hub)
  'CER-07': { x: 65, y: 85 }, // Arbre aux fruits blancs
  'CER-08': { x: 85, y: 85 }, // Dryope
  'CER-10': { x: 85, y: 60 }, // Cadavre de Leucothée
};

const CONNECTIONS: ConnectionDef[] = [
  // Macarée hub
  { from: 'CER-02', to: 'CER-03', color: PURPLE },
  { from: 'CER-02', to: 'CER-09', color: PURPLE },
  { from: 'CER-02', to: 'CER-06', color: PURPLE },
  { from: 'CER-02', to: 'CER-05', color: PURPLE },
  { from: 'CER-02', to: 'CER-01', color: PURPLE },
  // Cyané hub
  { from: 'CER-04', to: 'CER-07', color: PURPLE },
  { from: 'CER-04', to: 'CER-08', color: PURPLE },
  { from: 'CER-04', to: 'CER-10', color: PURPLE },
];

const CeresLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default CeresLayout;
