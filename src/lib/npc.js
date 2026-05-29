// NPC actor generators — fake players that act on the world so it feels alive.

import { generateGrimkin, RARITY_TIERS, appraise } from './grimkin.js';

const NPC_NAMES = [
  'KRAGOR', 'SAEL-9', 'VEX-HOLLOW', 'MIRE-7', 'BONE-FATHER', 'GLASSCROW',
  'THE-BUTCHER', 'RHU', 'SISTER-KETT', 'NULL-WIDOW', 'GANGREL', 'BLACKQUILL',
];

export function npcName() {
  return NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
}

export function makeNpcMarketListing() {
  const g = generateGrimkin({ seed: `npc-${Math.random()}` });
  const value = appraise(g);
  return {
    id: 'ml-npc-' + Math.random().toString(36).slice(2, 10),
    seller_id: 'npc-' + Math.random().toString(36).slice(2, 6),
    seller_name: npcName(),
    grimkin: g,
    price: Math.round(value * (0.9 + Math.random() * 0.5)),
    listing_type: 'fixed',
    is_npc: true,
    ends_at: Date.now() + (30 + Math.random() * 90) * 60_000,
    created_at: Date.now(),
  };
}

export function makeNpcBlackMarketListing() {
  const g = generateGrimkin({ seed: `npcbm-${Math.random()}` });
  const value = appraise(g);
  return {
    id: 'bm-npc-' + Math.random().toString(36).slice(2, 10),
    seller_id: 'npc-' + Math.random().toString(36).slice(2, 6),
    seller_name: 'ANON-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    item_type: 'grimkin',
    grimkin: g,
    current_bid: Math.round(value * 0.4),
    highest_bidder: null,
    contraband_rating: 1 + Math.floor(Math.random() * 3),
    is_npc: true,
    ends_at: Date.now() + 10 * 60_000,
    created_at: Date.now(),
  };
}

export function makeNpcBounty() {
  const types = ['capture', 'specimen', 'elimination'];
  const type = types[Math.floor(Math.random() * types.length)];
  const rarities = ['common', 'murk', 'forsaken', 'abyssal'];
  const rarity = rarities[Math.floor(Math.random() * rarities.length)];
  const rarityIdx = RARITY_TIERS.findIndex((r) => r.id === rarity);
  const baseReward = [150, 500, 2200, 6000][rarityIdx] || 200;
  return {
    id: 'bn-npc-' + Math.random().toString(36).slice(2, 10),
    poster_id: 'npc',
    poster_name: npcName(),
    bounty_type: type,
    target_spec: { species: 'any', rarity },
    reward: Math.round(baseReward * (0.8 + Math.random() * 0.5)),
    escrow_held: true,
    is_npc: true,
    status: 'open',
    claimer_id: null,
    created_at: Date.now(),
    expires_at: Date.now() + (30 + Math.random() * 90) * 60_000,
  };
}

export function makeNpcRaidTarget() {
  // A simulated target kennel. On success, the player can lift one of these
  // Grimkin into their own kennel.
  const count = 2 + Math.floor(Math.random() * 3);
  const kennel = [];
  for (let i = 0; i < count; i++) {
    kennel.push(generateGrimkin({ seed: `raid-${Math.random()}-${i}` }));
  }
  return {
    id: 'raid-' + Math.random().toString(36).slice(2, 10),
    target_name: npcName(),
    target_faction: ['renderers', 'pitmasters', 'broodlords'][Math.floor(Math.random() * 3)],
    kennel,
    difficulty: 1 + Math.floor(Math.random() * 5),
    created_at: Date.now(),
  };
}

export function rollRaidSuccess({ playerFerocity, difficulty }) {
  const base = 0.4 + (playerFerocity - difficulty * 20) / 200;
  return Math.max(0.1, Math.min(0.9, base));
}
