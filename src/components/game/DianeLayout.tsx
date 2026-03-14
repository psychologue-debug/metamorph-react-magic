import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const POSITIONS: Record<string, { x: number; y: number }> = {
  'DIA-03': { x: 22, y: 8 },
  'DIA-02': { x: 52, y: 8 },
  'DIA-01': { x: 82, y: 5 },
  'DIA-05': { x: 35, y: 38 },
  'DIA-08': { x: 8, y: 35 },
  'DIA-04': { x: 78, y: 30 },
  'DIA-09': { x: 62, y: 52 },
  'DIA-10': { x: 10, y: 65 },
  'DIA-07': { x: 32, y: 82 },
  'DIA-06': { x: 82, y: 82 },
};

const CONNECTIONS: ConnectionDef[] = [
  // Yellow hub: DIA-05
  { from: 'DIA-05', to: 'DIA-03', color: 'hsl(50 95% 55%)' },
  { from: 'DIA-05', to: 'DIA-08', color: 'hsl(50 95% 55%)' },
  { from: 'DIA-05', to: 'DIA-09', color: 'hsl(50 95% 55%)' },
  // Blue: DIA-02 → DIA-05, DIA-05 → DIA-09
  { from: 'DIA-02', to: 'DIA-05', color: 'hsl(210 70% 50%)' },
  // Purple bundle: DIA-01 → DIA-04
  { from: 'DIA-01', to: 'DIA-04', color: 'hsl(270 70% 50%)' },
];

const DianeLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default DianeLayout;
