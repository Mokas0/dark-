// Temperaments — behavioral modifiers that affect catch outcomes and arena performance.

export const TEMPERAMENTS = {
  Skittish: {
    id: 'Skittish',
    description: 'Flees on a failed approach. Cheaper to bait, harder to keep.',
    catch_failure_chance: 0.15,
    arena_modifier: { ferocity: 0.9 },
  },
  Aggressive: {
    id: 'Aggressive',
    description: 'Tears at handlers. Adds Heat on catch. Hits harder in the pit.',
    heat_on_catch: 2,
    arena_modifier: { ferocity: 1.15 },
  },
  Bonded: {
    id: 'Bonded',
    description: 'Came with an inherited trait. More expensive at appraisal.',
    appraisal_bonus: 200,
    arena_modifier: {},
  },
  Stoic: {
    id: 'Stoic',
    description: 'No fuss. The default Murk stray.',
    arena_modifier: {},
  },
  Feral: {
    id: 'Feral',
    description: 'Lethal-leaning. Higher chance of killing opponents in non-lethal arenas.',
    arena_modifier: { ferocity: 1.2, lethal_bias: 1.5 },
  },
};

export const TEMPERAMENT_IDS = Object.keys(TEMPERAMENTS);

export function rollTemperament(rng) {
  const roll = rng();
  if (roll < 0.45) return 'Stoic';
  if (roll < 0.70) return 'Skittish';
  if (roll < 0.88) return 'Aggressive';
  if (roll < 0.96) return 'Bonded';
  return 'Feral';
}
