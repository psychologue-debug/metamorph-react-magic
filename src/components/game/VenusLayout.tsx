import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const POSITIONS: Record<string, { x: number; y: number }> = {
  'VEN-03': { x: 14, y: 10 },
  'VEN-02': { x: 38, y: 8 },
  'VEN-04': { x: 82, y: 10 },
  'VEN-05': { x: 22, y: 35 },
  'VEN-10': { x: 10, y: 62 },
  'VEN-01': { x: 50, y: 58 },
  'VEN-08': { x: 78, y: 50 },
  'VEN-09': { x: 22, y: 85 },
  'VEN-07': { x: 52, y: 85 },
  'VEN-06': { x: 80, y: 85 },
};

const CONNECTIONS: ConnectionDef[] = [
  { from: 'VEN-05', to: 'VEN-03', color: 'hsl(210 70% 50%)' },
  { from: 'VEN-05', to: 'VEN-02', color: 'hsl(210 70% 50%)' },
  { from: 'VEN-01', to: 'VEN-08', color: 'hsl(0 70% 50%)' },
  { from: 'VEN-07', to: 'VEN-06', color: 'hsl(0 70% 50%)' },
];

const VenusLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default VenusLayout;
