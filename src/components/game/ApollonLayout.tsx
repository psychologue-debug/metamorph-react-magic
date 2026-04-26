import GodLayout, { GodLayoutProps, ConnectionDef } from './GodLayout';

// Colors:
//   orange         -> synergy
//   dark red       -> combo
//   bronze (brown) -> Marsyas universal effect arrows
const ORANGE = 'hsl(28 90% 50%)';
const DARK_RED = 'hsl(0 75% 35%)';
const BRONZE = 'hsl(25 60% 40%)';

const POSITIONS: Record<string, { x: number; y: number }> = {
  // Marsyas at the exact center
  'APO-07': { x: 50, y: 50 },

  // Syrinx hub on the left, mid-height
  'APO-06': { x: 25, y: 50 },

  // Half-circle of 4 around Syrinx, on the LEFT side
  'APO-01': { x: 8,  y: 18 },  // Mydas    (top)
  'APO-02': { x: 4,  y: 38 },  // Memnon   (upper-mid)
  'APO-03': { x: 4,  y: 62 },  // Daédalion(lower-mid)
  'APO-04': { x: 8,  y: 82 },  // Esculape (bottom)

  // Niobé : isolated, top-right
  'APO-05': { x: 88, y: 14 },

  // Trio synergy bottom-right, close together
  'APO-08': { x: 70, y: 78 },
  'APO-09': { x: 88, y: 70 },
  'APO-10': { x: 86, y: 90 },
};

const others = ['APO-01', 'APO-02', 'APO-03', 'APO-04', 'APO-05', 'APO-06', 'APO-08', 'APO-09', 'APO-10'];

const CONNECTIONS: ConnectionDef[] = [
  // Marsyas → all others (bronze arrows). Slight curves help avoid crossing other tokens.
  ...others.map<ConnectionDef>((to) => ({
    from: 'APO-07',
    to,
    color: BRONZE,
    style: 'arrow',
    curve: 6,
  })),

  // Syrinx ↔ 4 left mortels (dark red = combo)
  { from: 'APO-06', to: 'APO-01', color: DARK_RED },
  { from: 'APO-06', to: 'APO-02', color: DARK_RED },
  { from: 'APO-06', to: 'APO-03', color: DARK_RED },
  { from: 'APO-06', to: 'APO-04', color: DARK_RED },

  // Trio circular synergy (orange)
  { from: 'APO-08', to: 'APO-09', color: ORANGE },
  { from: 'APO-09', to: 'APO-10', color: ORANGE },
  { from: 'APO-10', to: 'APO-08', color: ORANGE },
];

const ApollonLayout = (props: GodLayoutProps) => (
  <GodLayout {...props} positions={POSITIONS} connections={CONNECTIONS} />
);

export default ApollonLayout;
