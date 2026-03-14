import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const POSITIONS: Record<string, { x: number; y: number }> = {
  'NEP-01': { x: 12, y: 10 },
  'NEP-02': { x: 40, y: 8 },
  'NEP-05': { x: 72, y: 10 },
  'NEP-08': { x: 12, y: 42 },
  'NEP-10': { x: 40, y: 42 },
  'NEP-04': { x: 82, y: 35 },
  'NEP-03': { x: 12, y: 75 },
  'NEP-06': { x: 42, y: 78 },
  'NEP-07': { x: 62, y: 58 },
  'NEP-09': { x: 82, y: 78 },
};

const CONNECTIONS: ConnectionDef[] = [
  { from: 'NEP-01', to: 'NEP-02', color: 'hsl(210 70% 50%)' },
  { from: 'NEP-02', to: 'NEP-05', color: 'hsl(210 70% 50%)' },
  { from: 'NEP-02', to: 'NEP-08', color: 'hsl(210 70% 50%)' },
  { from: 'NEP-08', to: 'NEP-03', color: 'hsl(210 70% 50%)' },
  { from: 'NEP-03', to: 'NEP-06', color: 'hsl(210 70% 50%)' },
];

const NeptuneLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default NeptuneLayout;
