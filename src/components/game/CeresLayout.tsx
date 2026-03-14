import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const POSITIONS: Record<string, { x: number; y: number }> = {
  'CER-06': { x: 12, y: 12 },
  'CER-05': { x: 38, y: 8 },
  'CER-01': { x: 65, y: 10 },
  'CER-02': { x: 25, y: 40 },
  'CER-09': { x: 8, y: 62 },
  'CER-04': { x: 55, y: 48 },
  'CER-10': { x: 85, y: 38 },
  'CER-03': { x: 18, y: 85 },
  'CER-07': { x: 48, y: 82 },
  'CER-08': { x: 78, y: 78 },
};

const CONNECTIONS: ConnectionDef[] = [
  // Brown hub: CER-02
  { from: 'CER-02', to: 'CER-06', color: 'hsl(25 60% 40%)' },
  { from: 'CER-02', to: 'CER-05', color: 'hsl(25 60% 40%)' },
  { from: 'CER-02', to: 'CER-01', color: 'hsl(25 60% 40%)' },
  { from: 'CER-02', to: 'CER-09', color: 'hsl(25 60% 40%)' },
  { from: 'CER-02', to: 'CER-03', color: 'hsl(25 60% 40%)' },
  // Blue: CER-04
  { from: 'CER-04', to: 'CER-10', color: 'hsl(210 70% 50%)' },
  { from: 'CER-04', to: 'CER-07', color: 'hsl(210 70% 50%)' },
  { from: 'CER-04', to: 'CER-08', color: 'hsl(210 70% 50%)' },
];

const CeresLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default CeresLayout;
