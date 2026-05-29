// Scavenge zones. Each zone changes the duration, rarity bias, and outcome
// distribution of a scavenge run.

export const ZONES = [
  {
    id: 'silt',
    name: 'The Silt',
    description: 'Drowned tenements. Low stakes. Strays mostly.',
    duration_ms: 10 * 60 * 1000,
    heat_on_hot_catch: 0,
    rarity_bias: { common: 1.0, murk: 0.7, forsaken: 0.3, abyssal: 0.05, void: 0.0, singularity: 0.0 },
    outcome: { empty: 0.20, catch: 0.78, hot_catch: 0.02 },
    palette: 'text-accent-toxic',
  },
  {
    id: 'bonebridge',
    name: 'Bonebridge',
    description: 'Pitmaster turf. Brutes and bloodlines bred for arena.',
    duration_ms: 20 * 60 * 1000,
    heat_on_hot_catch: 5,
    rarity_bias: { common: 0.4, murk: 1.0, forsaken: 1.0, abyssal: 0.5, void: 0.1, singularity: 0.005 },
    outcome: { empty: 0.10, catch: 0.78, hot_catch: 0.12 },
    palette: 'text-accent-blood',
  },
  {
    id: 'choir',
    name: 'The Choir',
    description: 'Renderer territory. Sometimes you find a stray. Sometimes you find what they left behind.',
    duration_ms: 12 * 60 * 1000,
    heat_on_hot_catch: 3,
    rarity_bias: { common: 0.6, murk: 0.8, forsaken: 0.4, abyssal: 0.1, void: 0.02, singularity: 0.0 },
    outcome: { empty: 0.15, catch: 0.55, hot_catch: 0.05, parts: 0.25 },
    palette: 'text-accent-blood',
  },
  {
    id: 'rookery',
    name: 'The Rookery',
    description: 'Broodlord estates. High purity strays — if the dogs don\'t catch you first.',
    duration_ms: 18 * 60 * 1000,
    heat_on_hot_catch: 8,
    rarity_bias: { common: 0.3, murk: 0.8, forsaken: 1.0, abyssal: 0.7, void: 0.15, singularity: 0.01 },
    outcome: { empty: 0.12, catch: 0.70, hot_catch: 0.18 },
    palette: 'text-accent-void',
  },
];

export function zoneById(id) {
  return ZONES.find((z) => z.id === id) ?? ZONES[0];
}

// Saturation: a per-zone meter that drops as you hit it and refills slowly.
export const SATURATION_MAX = 100;
export const SATURATION_DRAIN_PER_RUN = 20;
export const SATURATION_REGEN_PER_HOUR = 25;
