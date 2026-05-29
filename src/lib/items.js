// Loadout items — consumables that bias scavenge outcomes.

export const ITEMS = {
  snare: {
    id: 'snare',
    name: 'Wire Snare',
    description: 'Cheap, common. Modest catch-rate boost.',
    price: 40,
    effects: { catch_boost: 0.10 },
  },
  bait: {
    id: 'bait',
    name: 'Pheromone Bait',
    description: 'Draws rarer Grimkin. Tilts the rarity roll up. Drops purity slightly.',
    price: 180,
    effects: { rarity_tilt: 1, purity_penalty: 10 },
  },
  muzzle: {
    id: 'muzzle',
    name: 'Iron Muzzle',
    description: 'Suppresses noise. Reduces Heat from hot catches.',
    price: 120,
    effects: { heat_reduction: 1.0 },
  },
  listening_kit: {
    id: 'listening_kit',
    name: 'Listening Kit',
    description: 'Scout the run beforehand. Sharply lowers the empty-handed chance.',
    price: 90,
    effects: { empty_reduction: 0.7 },
  },
  stim: {
    id: 'stim',
    name: 'Black Stim',
    description: 'Restores a stamina charge. Use anytime.',
    price: 60,
    effects: { stamina_refill: 1 },
  },
};

export const ITEM_LIST = Object.values(ITEMS);

export function itemById(id) {
  return ITEMS[id];
}

// Apply loadout items to a base outcome distribution and rarity bias.
export function applyLoadout({ outcome, rarity_bias, loadout = [] }) {
  let out = { ...outcome };
  let bias = { ...rarity_bias };
  let heatModifier = 1;

  for (const id of loadout) {
    const item = ITEMS[id];
    if (!item) continue;
    const e = item.effects;
    if (e.catch_boost) {
      out.catch = (out.catch || 0) + e.catch_boost;
      out.empty = Math.max(0, (out.empty || 0) - e.catch_boost);
    }
    if (e.empty_reduction) {
      const cut = (out.empty || 0) * e.empty_reduction;
      out.empty -= cut;
      out.catch += cut;
    }
    if (e.rarity_tilt) {
      bias = {
        common: bias.common * 0.5,
        murk: bias.murk * 1.2,
        forsaken: bias.forsaken * 1.6,
        abyssal: bias.abyssal * 1.8,
        void: bias.void * 2,
        singularity: bias.singularity * 2,
      };
    }
    if (e.heat_reduction) {
      heatModifier *= 1 - e.heat_reduction;
    }
  }

  return { outcome: out, rarity_bias: bias, heatModifier };
}
