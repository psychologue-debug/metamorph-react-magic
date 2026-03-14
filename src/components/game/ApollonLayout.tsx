import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

const POSITIONS: Record<string, { x: number; y: number }> = {
  'APO-01': { x: 28, y: 8 },
  'APO-02': { x: 58, y: 8 },
  'APO-06': { x: 40, y: 35 },
  'APO-03': { x: 12, y: 32 },
  'APO-05': { x: 88, y: 28 },
  'APO-04': { x: 15, y: 60 },
  'APO-07': { x: 32, y: 80 },
  'APO-08': { x: 55, y: 75 },
  'APO-10': { x: 75, y: 52 },
  'APO-09': { x: 85, y: 75 },
};

const CONNECTIONS: ConnectionDef[] = [
  { from: 'APO-06', to: 'APO-01', color: 'hsl(25 60% 40%)' },
  { from: 'APO-06', to: 'APO-02', color: 'hsl(25 60% 40%)' },
  { from: 'APO-06', to: 'APO-03', color: 'hsl(25 60% 40%)' },
  { from: 'APO-06', to: 'APO-04', color: 'hsl(25 60% 40%)' },
  { from: 'APO-10', to: 'APO-08', color: 'hsl(25 60% 40%)' },
  { from: 'APO-10', to: 'APO-09', color: 'hsl(25 60% 40%)' },
];

const ApollonLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default ApollonLayout;
