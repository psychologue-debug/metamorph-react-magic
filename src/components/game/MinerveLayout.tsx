import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const POSITIONS: Record<string, { x: number; y: number }> = {
  'MIN-09': { x: 22, y: 8 },
  'MIN-08': { x: 48, y: 12 },
  'MIN-03': { x: 82, y: 5 },
  'MIN-10': { x: 8, y: 38 },
  'MIN-02': { x: 35, y: 38 },
  'MIN-04': { x: 75, y: 32 },
  'MIN-01': { x: 15, y: 65 },
  'MIN-05': { x: 68, y: 55 },
  'MIN-06': { x: 22, y: 88 },
  'MIN-07': { x: 78, y: 80 },
};

const CONNECTIONS: ConnectionDef[] = [
  // Blue hub: MIN-02
  { from: 'MIN-02', to: 'MIN-09', color: 'hsl(210 70% 50%)' },
  { from: 'MIN-02', to: 'MIN-08', color: 'hsl(210 70% 50%)' },
  { from: 'MIN-02', to: 'MIN-10', color: 'hsl(210 70% 50%)' },
  { from: 'MIN-02', to: 'MIN-01', color: 'hsl(210 70% 50%)' },
  { from: 'MIN-02', to: 'MIN-05', color: 'hsl(210 70% 50%)' },
  // Purple chain: MIN-03 → MIN-04 → MIN-05 → MIN-07
  { from: 'MIN-03', to: 'MIN-04', color: 'hsl(270 70% 50%)' },
  { from: 'MIN-04', to: 'MIN-05', color: 'hsl(270 70% 50%)' },
  { from: 'MIN-05', to: 'MIN-07', color: 'hsl(270 70% 50%)' },
];

const MinerveLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default MinerveLayout;
