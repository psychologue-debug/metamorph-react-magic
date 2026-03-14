import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const POSITIONS: Record<string, { x: number; y: number }> = {
  'BAC-09': { x: 12, y: 8 },
  'BAC-10': { x: 38, y: 8 },
  'BAC-02': { x: 75, y: 8 },
  'BAC-07': { x: 12, y: 42 },
  'BAC-04': { x: 35, y: 48 },
  'BAC-01': { x: 58, y: 38 },
  'BAC-03': { x: 82, y: 42 },
  'BAC-08': { x: 12, y: 80 },
  'BAC-06': { x: 42, y: 80 },
  'BAC-05': { x: 82, y: 80 },
};

const CONNECTIONS: ConnectionDef[] = [
  // Red chain: BAC-07 → BAC-04 → BAC-01 → BAC-03
  { from: 'BAC-07', to: 'BAC-04', color: 'hsl(0 70% 50%)' },
  { from: 'BAC-04', to: 'BAC-01', color: 'hsl(0 70% 50%)' },
  { from: 'BAC-01', to: 'BAC-03', color: 'hsl(0 70% 50%)' },
  // Blue chain: BAC-08 → BAC-06 → BAC-05
  { from: 'BAC-08', to: 'BAC-06', color: 'hsl(210 70% 50%)' },
  { from: 'BAC-06', to: 'BAC-05', color: 'hsl(210 70% 50%)' },
  // Purple bundle: BAC-09 → BAC-10
  { from: 'BAC-09', to: 'BAC-10', color: 'hsl(270 70% 50%)' },
];

const BacchusLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default BacchusLayout;
