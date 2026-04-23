// === Mortal Halo Types ===
// Determines the visual halo ring around metamorphosed mortals based on their effect type.
// Uses explicit code lists provided by the game designer.

import { Mortal, Player } from '@/types/game';

export type HaloType = 'ether' | 'activatable' | 'permanent' | 'none';

/** Violet halo: mortals that generate Ether */
const ETHER_CODES = new Set([
  'APO-05', 'DIA-05', 'VEN-02', 'VEN-03', 'VEN-05', 'VEN-09',
  'MIN-03', 'MIN-04', 'MIN-05', 'MIN-07',
  'DIA-01', 'DIA-04',
  'NEP-01', 'NEP-03', 'NEP-04', 'NEP-08',
  'CER-02', 'CER-04', 'CER-06',
]);

/** Yellow halo: mortals with manually activatable effects */
const ACTIVATABLE_CODES = new Set([
  'APO-06', 'VEN-01', 'BAC-01', 'BAC-10',
  'MIN-02', 'MIN-08',
  'DIA-02', 'DIA-08', 'DIA-10',
  'NEP-02', 'NEP-05', 'NEP-06', 'NEP-10',
  'CER-01', 'CER-07', 'CER-10',
]);

/** Green halo: mortals with permanent passive effects (not activatable, not ether) */
const PERMANENT_CODES = new Set([
  'APO-07', 'APO-08', 'APO-09', 'APO-10',
  'VEN-04',
  'BAC-09',
  'DIA-07',
  'NEP-09',
]);

/**
 * Returns the halo type for a metamorphosed mortal using explicit code lists.
 * Priority: ether > activatable > permanent > none.
 * If `owner` is provided, applies dynamic conditions (e.g. DIA-01 Alcyon stops
 * generating ether when its owner has 4+ metamorphosed mortals).
 */
export function getHaloType(mortal: Mortal, owner?: Player): HaloType {
  if (!mortal.isMetamorphosed) return 'none';
  if (mortal.status === 'incapacite' || mortal.status === 'retired') return 'none';
  if (ETHER_CODES.has(mortal.code)) {
    // DIA-01 (Alcyon): no ether halo when owner has 4+ metamorphosed mortals
    if (mortal.code === 'DIA-01' && owner) {
      const metaCount = owner.mortals.filter(m => m.isMetamorphosed).length;
      if (metaCount >= 4) {
        // Fall through to other halo types if any (none for DIA-01 here)
        if (ACTIVATABLE_CODES.has(mortal.code)) return 'activatable';
        if (PERMANENT_CODES.has(mortal.code)) return 'permanent';
        return 'none';
      }
    }
    return 'ether';
  }
  if (ACTIVATABLE_CODES.has(mortal.code)) return 'activatable';
  if (PERMANENT_CODES.has(mortal.code)) return 'permanent';
  return 'none';
}

/** Halo style config per type — ring + glow via box-shadow */
export const HALO_STYLES: Record<Exclude<HaloType, 'none'>, {
  boxShadow: string;
}> = {
  ether: {
    boxShadow: '0 0 0 4px hsl(270 70% 60%), 0 0 14px 6px hsl(270 70% 55% / 0.7), 0 0 30px 10px hsl(270 60% 50% / 0.35)',
  },
  activatable: {
    boxShadow: '0 0 0 4px hsl(45 95% 55%), 0 0 14px 6px hsl(45 95% 55% / 0.7), 0 0 30px 10px hsl(45 85% 45% / 0.35)',
  },
  permanent: {
    boxShadow: '0 0 0 4px hsl(140 65% 45%), 0 0 14px 6px hsl(140 65% 45% / 0.7), 0 0 30px 10px hsl(140 55% 35% / 0.35)',
  },
};
