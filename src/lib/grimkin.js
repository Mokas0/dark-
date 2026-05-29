import { mulberry32, pick, rollD100, rollInt, seedFromString } from './rng.js';

export const SPECIES = [
  'Vorrghast', 'Slithen', 'Bonemare', 'Grellwyrm', 'Murkhound',
  'Pyrelich', 'Sablefin', 'Wraithling', 'Carrioner', 'Hexrot',
];

export const RARITY_TIERS = [
  { id: 'common',      name: 'Common',      weight: 40,  slots: 1, baseValue: 50 },
  { id: 'murk',        name: 'Murk',        weight: 25,  slots: 2, baseValue: 200 },
  { id: 'forsaken',    name: 'Forsaken',    weight: 15,  slots: 3, baseValue: 800 },
  { id: 'abyssal',     name: 'Abyssal',     weight: 8,   slots: 4, baseValue: 3000 },
  { id: 'void',        name: 'Void',        weight: 2,   slots: 5, baseValue: 12000 },
  { id: 'singularity', name: 'Singularity', weight: 0.3, slots: 6, baseValue: 50000 },
];

export const TRAITS = [
  'Sanguine', 'Hollow-Boned', 'Toxic Glands', 'Iron Hide', 'Veiled Eye',
  'Necrotic', 'Featherlight', 'Pit-Born', 'Honed Claws', 'Static Hide',
  'Hex-Tongued', 'Marrow Hungry', 'Cinder Lung', 'Mire Born', 'Witchblood',
  'Bone Crowned', 'Shrivelled', 'Glass Vein', 'Wraith Touch', 'Sable Coat',
];

export const NAME_FRAGMENTS_A = ['Vex', 'Mor', 'Kra', 'Sib', 'Gha', 'Rhu', 'Bel', 'Nyx', 'Throm', 'Quor', 'Sael'];
export const NAME_FRAGMENTS_B = ["'th", '-azh', '-rik', 'gor', 'fang', 'gloom', 'rend', 'mire', 'shade', 'crux'];

export const CONDITIONS = ['Pristine', 'Scarred', 'Broken', 'Husk'];

export const MUTATION_TABLE = [
  { max: 50,  kind: 'none',        label: '— no mutation —' },
  { max: 70,  kind: 'amp',         label: 'Trait amplification (+5% to one stat)' },
  { max: 85,  kind: 'inherited',   label: 'Grandparent trait inherited' },
  { max: 93,  kind: 'novel',       label: 'Novel mutation' },
  { max: 98,  kind: 'aberrant',    label: 'Aberrant strain (unnamed)' },
  { max: 99,  kind: 'chimera',     label: 'Chimera — species merge' },
  { max: 100, kind: 'void_strain', label: 'VOID STRAIN — Singularity offspring' },
];

export function pickRarity(rng) {
  const totalWeight = RARITY_TIERS.reduce((a, b) => a + b.weight, 0);
  let r = rng() * totalWeight;
  for (const tier of RARITY_TIERS) {
    if ((r -= tier.weight) <= 0) return tier;
  }
  return RARITY_TIERS[0];
}

export function generateName(rng) {
  return `${pick(rng, NAME_FRAGMENTS_A)}${pick(rng, NAME_FRAGMENTS_B)}`;
}

export function generateGrimkin({ seed, ownerId = null, forceRarity = null } = {}) {
  const seedStr = seed ?? `${Date.now()}-${Math.random()}`;
  const rng = mulberry32(seedFromString(seedStr));

  const rarity = forceRarity
    ? RARITY_TIERS.find((t) => t.id === forceRarity) ?? pickRarity(rng)
    : pickRarity(rng);

  const traitCount = rarity.slots;
  const traits = [];
  const pool = [...TRAITS];
  for (let i = 0; i < traitCount; i++) {
    const idx = Math.floor(rng() * pool.length);
    traits.push(pool.splice(idx, 1)[0]);
  }

  const rarityIndex = RARITY_TIERS.indexOf(rarity);
  const statBase = 10 + rarityIndex * 8;
  const statSpread = 10 + rarityIndex * 4;

  const stats = {
    vitality: rollInt(rng, statBase, statBase + statSpread),
    ferocity: rollInt(rng, statBase, statBase + statSpread),
    fertility: rollInt(rng, statBase, statBase + statSpread),
    purity: rollInt(rng, 60, 100),
    toxicity: rollInt(rng, 0, statBase + statSpread),
  };

  return {
    id: cryptoRandom(),
    owner_id: ownerId,
    name: generateName(rng),
    species: pick(rng, SPECIES),
    rarity: rarity.id,
    traits,
    stats,
    condition: 'Pristine',
    age: 0,
    lineage: [],
    mutations: [],
    status: 'alive',
    listed_on: null,
    created_at: new Date().toISOString(),
  };
}

export function breedOffspring({ parentA, parentB, seed }) {
  const seedStr = seed ?? `${parentA.id}-${parentB.id}-${Date.now()}`;
  const rng = mulberry32(seedFromString(seedStr));

  // Inbreeding check — shared lineage reduces purity.
  const lineageA = new Set([parentA.id, ...(parentA.lineage || [])]);
  const lineageB = new Set([parentB.id, ...(parentB.lineage || [])]);
  let inbreedingPenalty = 0;
  for (const id of lineageB) if (lineageA.has(id)) inbreedingPenalty += 15;

  // Inherit rarity — average the parents' indices, biased up by 1 on a lucky roll.
  const idxA = RARITY_TIERS.findIndex((t) => t.id === parentA.rarity);
  const idxB = RARITY_TIERS.findIndex((t) => t.id === parentB.rarity);
  let childIdx = Math.round((idxA + idxB) / 2);
  if (rng() < 0.08) childIdx += 1;
  childIdx = Math.max(0, Math.min(RARITY_TIERS.length - 1, childIdx));
  const rarity = RARITY_TIERS[childIdx];

  // Blend stats.
  const blend = (a, b) => Math.round((a + b) / 2 + (rng() - 0.5) * 6);
  const stats = {
    vitality: blend(parentA.stats.vitality, parentB.stats.vitality),
    ferocity: blend(parentA.stats.ferocity, parentB.stats.ferocity),
    fertility: blend(parentA.stats.fertility, parentB.stats.fertility),
    purity: Math.max(0, blend(parentA.stats.purity, parentB.stats.purity) - inbreedingPenalty),
    toxicity: blend(parentA.stats.toxicity, parentB.stats.toxicity),
  };

  // Inherit traits — pool from both parents, trim to rarity slot count.
  const traitPool = Array.from(new Set([...(parentA.traits || []), ...(parentB.traits || [])]));
  const traits = [];
  while (traits.length < rarity.slots && traitPool.length) {
    const idx = Math.floor(rng() * traitPool.length);
    traits.push(traitPool.splice(idx, 1)[0]);
  }
  while (traits.length < rarity.slots) {
    const t = pick(rng, TRAITS);
    if (!traits.includes(t)) traits.push(t);
  }

  // Mutation roll.
  const roll = rollD100(rng);
  const mutation = MUTATION_TABLE.find((m) => roll <= m.max);
  const mutations = [];
  if (mutation.kind === 'amp') {
    const statKeys = Object.keys(stats);
    const k = pick(rng, statKeys);
    stats[k] = Math.round(stats[k] * 1.05);
    mutations.push(`${mutation.label} → ${k}`);
  } else if (mutation.kind === 'inherited') {
    mutations.push(mutation.label);
  } else if (mutation.kind === 'novel') {
    const t = pick(rng, TRAITS);
    if (!traits.includes(t)) traits.push(t);
    mutations.push(`${mutation.label} → ${t}`);
  } else if (mutation.kind === 'aberrant') {
    mutations.push('Aberrant Strain');
  } else if (mutation.kind === 'chimera') {
    mutations.push(`Chimera (${parentA.species}/${parentB.species})`);
  } else if (mutation.kind === 'void_strain') {
    mutations.push('VOID STRAIN');
  }

  const finalRarity = mutation.kind === 'void_strain' ? 'singularity' : rarity.id;

  const seedRng = mulberry32(seedFromString(seedStr + '|name'));
  const species = rng() < 0.5 ? parentA.species : parentB.species;

  return {
    id: cryptoRandom(),
    owner_id: parentA.owner_id ?? parentB.owner_id ?? null,
    name: generateName(seedRng),
    species,
    rarity: finalRarity,
    traits,
    stats,
    condition: 'Pristine',
    age: 0,
    lineage: [parentA.id, parentB.id],
    mutations,
    status: 'alive',
    listed_on: null,
    created_at: new Date().toISOString(),
    mutation_roll: roll,
    mutation_kind: mutation.kind,
    inbreeding_penalty: inbreedingPenalty,
  };
}

export function harvestYield(grimkin) {
  const { stats, rarity } = grimkin;
  const rarityIdx = RARITY_TIERS.findIndex((t) => t.id === rarity);
  const multiplier = 1 + rarityIdx * 0.5;

  const parts = [];
  if (stats.toxicity > 30) {
    parts.push({
      part_type: 'venom',
      quality: Math.min(100, Math.round(stats.toxicity * multiplier)),
      quantity: Math.max(1, Math.floor(stats.toxicity / 25)),
    });
  }
  if (stats.vitality > 30) {
    parts.push({
      part_type: 'organ',
      quality: Math.min(100, Math.round(stats.vitality * multiplier)),
      quantity: Math.max(1, Math.floor(stats.vitality / 30)),
    });
  }
  if (rarityIdx >= 2) {
    parts.push({
      part_type: 'essence',
      quality: Math.min(100, 50 + rarityIdx * 10),
      quantity: rarityIdx - 1,
    });
  }
  parts.push({
    part_type: 'bone',
    quality: Math.round(40 + rarityIdx * 10),
    quantity: 2 + rarityIdx,
  });

  return parts;
}

export function appraise(grimkin) {
  const tier = RARITY_TIERS.find((t) => t.id === grimkin.rarity) ?? RARITY_TIERS[0];
  const statTotal =
    grimkin.stats.vitality +
    grimkin.stats.ferocity +
    grimkin.stats.fertility +
    grimkin.stats.purity +
    grimkin.stats.toxicity;
  const conditionMultiplier =
    { Pristine: 1, Scarred: 0.7, Broken: 0.4, Husk: 0.15 }[grimkin.condition] ?? 1;
  const mutationBonus = (grimkin.mutations?.length || 0) * 250;
  return Math.round(
    (tier.baseValue + statTotal * 6 + mutationBonus) * conditionMultiplier,
  );
}

function cryptoRandom() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'gk-' + Math.random().toString(36).slice(2, 11);
}

export function rarityClass(rarity) {
  return `rarity-${rarity}`;
}

export function rarityGlow(rarity) {
  return `glow-${rarity}`;
}
