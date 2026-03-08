// === Mortal Halo Types ===
// Determines the visual halo around metamorphosed mortals based on their effect type.

import { Mortal } from '@/types/game';
import { ACTIVATABLE_MORTALS } from './activatedEffects';

export type HaloType = 'ether' | 'activatable' | 'passive' | 'none';

/**
 * Returns the halo type for a metamorphosed mortal:
 * - 'activatable' (yellow): mortal has a manually activatable effect
 * - 'ether' (purple): mortal generates ether (etherProduction > 0) but is not activatable
 * - 'passive' (grey): mortal has a permanent effect but is not activatable and doesn't generate ether
 * - 'none': no ongoing power (flip-only effects or no effect)
 */
export function getHaloType(mortal: Mortal): HaloType {
  if (!mortal.isMetamorphosed) return 'none';

  const isActivatable = ACTIVATABLE_MORTALS.includes(mortal.code);
  if (isActivatable) return 'activatable';

  if (mortal.etherProduction > 0) return 'ether';

  if (mortal.effectPermanent) return 'passive';

  return 'none';
}

/** Halo style config per type */
export const HALO_STYLES: Record<Exclude<HaloType, 'none'>, {
  gradient: string;
  boxShadow: string;
}> = {
  ether: {
    gradient: 'radial-gradient(circle, hsl(270 60% 55% / 0.4) 0%, hsl(270 50% 45% / 0.2) 50%, transparent 70%)',
    boxShadow: '0 0 16px hsl(270 60% 55% / 0.5), 0 0 32px hsl(270 50% 45% / 0.25)',
  },
  activatable: {
    gradient: 'radial-gradient(circle, hsl(45 90% 55% / 0.4) 0%, hsl(45 80% 45% / 0.2) 50%, transparent 70%)',
    boxShadow: '0 0 16px hsl(45 90% 55% / 0.5), 0 0 32px hsl(45 80% 45% / 0.25)',
  },
  passive: {
    gradient: 'radial-gradient(circle, hsl(0 0% 70% / 0.35) 0%, hsl(0 0% 55% / 0.15) 50%, transparent 70%)',
    boxShadow: '0 0 14px hsl(0 0% 70% / 0.4), 0 0 28px hsl(0 0% 55% / 0.2)',
  },
};
