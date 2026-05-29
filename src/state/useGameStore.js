import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateGrimkin, breedOffspring, appraise, harvestYield } from '../lib/grimkin.js';
import { resolveFight } from '../lib/combat.js';
import { zoneById, SATURATION_MAX, SATURATION_DRAIN_PER_RUN, SATURATION_REGEN_PER_HOUR, ZONES } from '../lib/zones.js';
import { ITEMS, applyLoadout } from '../lib/items.js';
import { defaultDistrictState, districtById } from '../lib/districts.js';
import { defaultPriceState, tickPrices, sellValue } from '../lib/prices.js';
import { TEMPERAMENTS } from '../lib/temperaments.js';
import {
  makeNpcMarketListing,
  makeNpcBlackMarketListing,
  makeNpcBounty,
  makeNpcRaidTarget,
  rollRaidSuccess,
  npcName,
} from '../lib/npc.js';
import { sfx } from '../lib/audio.js';

const STARTING_GRIMKIN = 3;
const STAMINA_MAX = 5;
const STAMINA_REGEN_MS = 12 * 60 * 1000;
const LOAN_INTEREST = 0.15;
const TICKER_MAX = 40;

function seedPlayer() {
  return {
    id: 'local-player',
    username: 'Operator',
    gold: 500,
    rep_score: 0,
    infamy_score: 0,
    heat_level: 0,
    faction: null,
    rank: 1,
    kennel_size: 12,
    stamina: STAMINA_MAX,
    stamina_max: STAMINA_MAX,
    stamina_regen_at: Date.now() + STAMINA_REGEN_MS,
    raid_licenses: 1,
    vendetta_tokens: 0,
    prestige: 0,
    prestige_bonus_pct: 0,
  };
}

function seedStarterKennel() {
  const out = [];
  for (let i = 0; i < STARTING_GRIMKIN; i++) {
    out.push(generateGrimkin({ seed: `starter-${Date.now()}-${i}`, ownerId: 'local-player' }));
  }
  return out;
}

function seedSaturation() {
  const out = {};
  for (const z of ZONES) out[z.id] = { value: SATURATION_MAX, last_at: Date.now() };
  return out;
}

function seedItems() {
  return [
    { id: 'snare', quantity: 3 },
    { id: 'bait', quantity: 1 },
    { id: 'listening_kit', quantity: 1 },
    { id: 'stim', quantity: 2 },
  ];
}

function tickerEntry(kind, message) {
  return { id: 'tk-' + Math.random().toString(36).slice(2, 8), at: Date.now(), kind, message };
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ── CORE ────────────────────────────────────────────────────────────
      player: seedPlayer(),
      grimkin: seedStarterKennel(),
      parts: [],
      breedingQueue: [],
      marketListings: [],
      blackMarketListings: [],
      bounties: [],
      arenaHistory: [],
      worldEvents: [],
      scavengeRun: null,
      log: [],

      // ── NEW SYSTEMS ────────────────────────────────────────────────────
      items: seedItems(),
      saturation: seedSaturation(),
      loans: [],
      studListings: [],
      insurancePolicies: [],
      raidTargets: [],
      raidHistory: [],
      sabotageHistory: [],
      districts: defaultDistrictState(),
      prices: defaultPriceState(),
      ticker: [],
      defectionPenalty: null,
      foundersCredit: [], // [{ founder_player_id, descendant_id, generation }]
      lastNpcSpawnAt: 0,
      lastPriceTickAt: 0,
      lastIncomeTickAt: Date.now(),

      // ── LOG / TICKER ───────────────────────────────────────────────────
      pushLog: (entry) =>
        set((s) => ({ log: [{ at: Date.now(), ...entry }, ...s.log].slice(0, 100) })),

      pushTicker: (kind, message) =>
        set((s) => ({ ticker: [tickerEntry(kind, message), ...s.ticker].slice(0, TICKER_MAX) })),

      // ── PLAYER ─────────────────────────────────────────────────────────
      adjustGold: (delta, reason = '') =>
        set((s) => ({
          player: { ...s.player, gold: Math.max(0, s.player.gold + delta) },
          log: [{ at: Date.now(), kind: 'gold', delta, reason }, ...s.log].slice(0, 100),
        })),

      adjustHeat: (delta) => {
        const prev = get().player.heat_level;
        set((s) => ({
          player: { ...s.player, heat_level: Math.max(0, Math.min(100, s.player.heat_level + delta)) },
        }));
        if (delta > 0 && prev < 80 && get().player.heat_level >= 80) sfx.alarm();
      },

      adjustInfamy: (delta) =>
        set((s) => ({
          player: { ...s.player, infamy_score: Math.max(0, s.player.infamy_score + delta) },
        })),

      setFaction: (faction) => {
        const prev = get().player.faction;
        if (prev && prev !== faction) {
          // Defection penalty: NPC hit squad — 7 in-app minutes for demo.
          set((s) => ({
            defectionPenalty: {
              faction_from: prev,
              faction_to: faction,
              started_at: Date.now(),
              ends_at: Date.now() + 7 * 60 * 1000,
            },
          }));
          get().pushTicker('defection', `Operator defected ${prev.toUpperCase()} → ${(faction || 'UNALIGNED').toUpperCase()}. Bounties incoming.`);
          // Auto-spawn a hit-squad bounty.
          const b = makeNpcBounty();
          b.bounty_type = 'elimination';
          b.poster_name = `${prev.toUpperCase()} HITSQUAD`;
          b.reward = Math.max(b.reward, 800);
          set((s) => ({ bounties: [b, ...s.bounties] }));
        }
        set((s) => ({ player: { ...s.player, faction } }));
      },

      regenStamina: () => {
        const s = get();
        if (s.player.stamina >= s.player.stamina_max) return;
        if (Date.now() < s.player.stamina_regen_at) return;
        const ticks = Math.min(
          s.player.stamina_max - s.player.stamina,
          Math.floor((Date.now() - s.player.stamina_regen_at) / STAMINA_REGEN_MS) + 1,
        );
        set((st) => ({
          player: {
            ...st.player,
            stamina: Math.min(st.player.stamina_max, st.player.stamina + ticks),
            stamina_regen_at: Date.now() + STAMINA_REGEN_MS,
          },
        }));
      },

      // ── ITEMS / LOADOUT ────────────────────────────────────────────────
      buyItem: (itemId, qty = 1) => {
        const item = ITEMS[itemId];
        if (!item) return { error: 'Unknown item.' };
        const cost = item.price * qty;
        const s = get();
        if (s.player.gold < cost) return { error: 'Insufficient gold.' };
        set((st) => {
          const items = [...st.items];
          const existing = items.find((i) => i.id === itemId);
          if (existing) existing.quantity += qty;
          else items.push({ id: itemId, quantity: qty });
          return {
            items,
            player: { ...st.player, gold: st.player.gold - cost },
          };
        });
        return { ok: true };
      },

      consumeItem: (itemId, qty = 1) => {
        set((s) => {
          const items = s.items
            .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - qty } : i))
            .filter((i) => i.quantity > 0);
          return { items };
        });
      },

      useStim: () => {
        const s = get();
        const stim = s.items.find((i) => i.id === 'stim');
        if (!stim || stim.quantity <= 0) return { error: 'No stims.' };
        if (s.player.stamina >= s.player.stamina_max) return { error: 'Stamina already full.' };
        set((st) => ({
          player: { ...st.player, stamina: Math.min(st.player.stamina_max, st.player.stamina + 1) },
        }));
        get().consumeItem('stim', 1);
        return { ok: true };
      },

      // ── SCAVENGE ───────────────────────────────────────────────────────
      startScavenge: ({ zoneId = 'silt', loadout = [] } = {}) => {
        const s = get();
        if (s.scavengeRun && s.scavengeRun.completesAt > Date.now()) {
          return { error: 'A run is already underway.' };
        }
        const zone = zoneById(zoneId);
        if (s.player.stamina < zone.stamina_cost) return { error: `Need ${zone.stamina_cost} stamina.` };
        // Consume stamina + loadout items.
        set((st) => ({
          player: {
            ...st.player,
            stamina: st.player.stamina - zone.stamina_cost,
            stamina_regen_at: st.player.stamina === st.player.stamina_max
              ? Date.now() + STAMINA_REGEN_MS
              : st.player.stamina_regen_at,
          },
        }));
        for (const id of loadout) get().consumeItem(id, 1);
        // Drain saturation for this zone.
        set((st) => ({
          saturation: {
            ...st.saturation,
            [zoneId]: {
              value: Math.max(0, (st.saturation[zoneId]?.value ?? SATURATION_MAX) - SATURATION_DRAIN_PER_RUN),
              last_at: Date.now(),
            },
          },
        }));
        const run = {
          id: 'sc-' + Math.random().toString(36).slice(2, 10),
          zoneId,
          loadout: [...loadout],
          startedAt: Date.now(),
          completesAt: Date.now() + zone.duration_ms,
        };
        set({ scavengeRun: run });
        get().pushLog({ kind: 'scavenge', message: `Run started in ${zone.name}.` });
        sfx.click();
        return run;
      },

      cancelScavenge: () => {
        if (!get().scavengeRun) return;
        set({ scavengeRun: null });
        get().pushLog({ kind: 'scavenge', message: `Run aborted.` });
      },

      completeScavenge: () => {
        const s = get();
        const run = s.scavengeRun;
        if (!run) return { error: 'No run in progress.' };
        if (run.completesAt > Date.now()) return { error: 'Run not finished.' };

        const zone = zoneById(run.zoneId);
        const adj = applyLoadout({
          outcome: zone.outcome,
          rarity_bias: zone.rarity_bias,
          loadout: run.loadout,
        });
        // Saturation modifier: low saturation tilts outcome toward empty.
        const saturation = s.saturation[run.zoneId]?.value ?? SATURATION_MAX;
        const saturationFactor = saturation / SATURATION_MAX;
        const outcome = {
          empty: (adj.outcome.empty || 0) * (2 - saturationFactor),
          catch: (adj.outcome.catch || 0) * saturationFactor,
          hot_catch: (adj.outcome.hot_catch || 0) * saturationFactor,
          parts: (adj.outcome.parts || 0) * saturationFactor,
        };
        const sum = outcome.empty + outcome.catch + outcome.hot_catch + outcome.parts;
        const roll = Math.random() * sum;
        let bucket = 'empty';
        let acc = outcome.empty;
        if (roll > acc) { bucket = 'catch'; acc += outcome.catch; }
        if (roll > acc) { bucket = 'hot_catch'; acc += outcome.hot_catch; }
        if (roll > acc) { bucket = 'parts'; }

        let result;
        if (bucket === 'empty') {
          result = { outcome: 'empty', zone: zone.name };
          get().pushLog({ kind: 'scavenge', message: `${zone.name}: empty-handed.` });
        } else if (bucket === 'parts') {
          // Found scavenged parts instead of a Grimkin.
          const part = {
            id: 'part-' + Math.random().toString(36).slice(2, 10),
            owner_id: s.player.id,
            part_type: ['organ', 'venom', 'bone'][Math.floor(Math.random() * 3)],
            source_grimkin_id: null,
            source_species: 'unknown',
            quality: 30 + Math.floor(Math.random() * 50),
            quantity: 1 + Math.floor(Math.random() * 2),
            created_at: new Date().toISOString(),
          };
          set((st) => ({ parts: [part, ...st.parts] }));
          get().pushLog({ kind: 'scavenge', message: `${zone.name}: scavenged ${part.quantity}× ${part.part_type}.` });
          result = { outcome: 'parts', part, zone: zone.name };
        } else {
          // Catch — apply rarity bias.
          const g = generateGrimkin({
            seed: `wild-${run.id}`,
            ownerId: s.player.id,
            rarityBias: adj.rarity_bias,
          });
          const tempData = TEMPERAMENTS[g.temperament];
          // Skittish has a chance to fail catch.
          if (tempData?.catch_failure_chance && Math.random() < tempData.catch_failure_chance) {
            get().pushLog({ kind: 'scavenge', message: `${zone.name}: ${g.species} bolted. Empty-handed.` });
            set({ scavengeRun: null });
            sfx.loss();
            return { outcome: 'empty', zone: zone.name, fled: true };
          }
          set((st) => ({ grimkin: [g, ...st.grimkin] }));
          let heatBump = bucket === 'hot_catch' ? zone.heat_on_hot_catch : 0;
          if (tempData?.heat_on_catch) heatBump += tempData.heat_on_catch;
          heatBump = Math.round(heatBump * adj.heatModifier);
          if (heatBump > 0) get().adjustHeat(heatBump);
          get().pushLog({
            kind: 'catch',
            message: `${zone.name}: caught ${g.rarity.toUpperCase()} ${g.species} "${g.name}"${heatBump > 0 ? ` (+${heatBump} heat)` : ''}.`,
          });
          sfx.catch();
          result = { outcome: bucket, grimkin: g, zone: zone.name, heatBump };
        }
        set({ scavengeRun: null });
        return result;
      },

      catchWild: () => {
        const g = generateGrimkin({ seed: `wild-${Date.now()}`, ownerId: get().player.id });
        set((s) => ({ grimkin: [g, ...s.grimkin] }));
        get().pushLog({ kind: 'catch', message: `Caught ${g.rarity.toUpperCase()} ${g.species} "${g.name}".` });
        return g;
      },

      removeGrimkin: (id) =>
        set((s) => ({ grimkin: s.grimkin.filter((g) => g.id !== id) })),

      updateGrimkin: (id, patch) =>
        set((s) => ({ grimkin: s.grimkin.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      harvest: (id) => {
        const g = get().grimkin.find((x) => x.id === id);
        if (!g) return null;
        const yieldParts = harvestYield(g);
        set((s) => ({
          grimkin: s.grimkin.map((x) => (x.id === id ? { ...x, status: 'harvested', listed_on: null } : x)),
          parts: [
            ...yieldParts.map((p) => ({
              id: 'part-' + Math.random().toString(36).slice(2, 10),
              owner_id: s.player.id,
              source_grimkin_id: g.id,
              source_species: g.species,
              ...p,
              created_at: new Date().toISOString(),
            })),
            ...s.parts,
          ],
        }));
        get().pushLog({ kind: 'harvest', message: `${g.name} processed. ${yieldParts.length} part types yielded.` });
        sfx.loss();
        return yieldParts;
      },

      // ── BREEDING ───────────────────────────────────────────────────────
      queueBreed: ({ parentAId, parentBId, durationMs = 60_000 }) => {
        const s = get();
        const a = s.grimkin.find((g) => g.id === parentAId);
        const b = s.grimkin.find((g) => g.id === parentBId);
        if (!a || !b) return null;
        const cost = 75;
        if (s.player.gold < cost) return { error: 'Insufficient gold (75g required).' };
        const entry = {
          id: 'br-' + Math.random().toString(36).slice(2, 10),
          parentA: a, parentB: b,
          startedAt: Date.now(),
          completesAt: Date.now() + durationMs,
          status: 'incubating',
        };
        set((st) => ({
          breedingQueue: [entry, ...st.breedingQueue],
          player: { ...st.player, gold: st.player.gold - cost },
        }));
        get().pushLog({ kind: 'breed', message: `Pair queued: ${a.name} × ${b.name}.` });
        return entry;
      },

      completeBreed: (entryId) => {
        const entry = get().breedingQueue.find((e) => e.id === entryId);
        if (!entry) return null;
        const child = breedOffspring({ parentA: entry.parentA, parentB: entry.parentB });
        child.owner_id = get().player.id;
        set((s) => ({
          breedingQueue: s.breedingQueue.map((e) =>
            e.id === entryId ? { ...e, status: 'hatched', result_grimkin_id: child.id } : e,
          ),
          grimkin: [child, ...s.grimkin],
        }));
        get().pushLog({
          kind: 'hatch',
          message: `Hatched ${child.rarity.toUpperCase()} ${child.species} "${child.name}".`,
        });
        sfx.hatch();
        // Founder credit tracking.
        get().registerFounderCredit(child);
        return child;
      },

      dismissBreed: (entryId) =>
        set((s) => ({ breedingQueue: s.breedingQueue.filter((e) => e.id !== entryId) })),

      registerFounderCredit: (descendant) => {
        // Walk lineage; for each ancestor we still own, register a credit.
        const lineage = descendant.lineage || [];
        if (!lineage.length) return;
        const grim = get().grimkin;
        const credits = [];
        for (const ancestorId of lineage) {
          const ancestor = grim.find((g) => g.id === ancestorId);
          if (ancestor) {
            credits.push({
              founder_grimkin_id: ancestor.id,
              founder_name: ancestor.name,
              descendant_id: descendant.id,
              descendant_name: descendant.name,
              at: Date.now(),
            });
          }
        }
        if (credits.length) {
          set((s) => ({ foundersCredit: [...credits, ...s.foundersCredit].slice(0, 200) }));
        }
      },

      // ── MARKETS ────────────────────────────────────────────────────────
      listOnMarket: ({ grimkinId, price }) => {
        const s = get();
        const g = s.grimkin.find((x) => x.id === grimkinId);
        if (!g) return null;
        const listing = {
          id: 'ml-' + Math.random().toString(36).slice(2, 10),
          seller_id: s.player.id,
          grimkin: { ...g, listed_on: 'market' },
          price,
          listing_type: 'fixed',
          ends_at: Date.now() + 24 * 60 * 60 * 1000,
          created_at: Date.now(),
        };
        set((st) => ({
          marketListings: [listing, ...st.marketListings],
          grimkin: st.grimkin.map((x) => (x.id === grimkinId ? { ...x, listed_on: 'market' } : x)),
        }));
        get().pushLog({ kind: 'list', message: `Listed ${g.name} for ${price}g.` });
        return listing;
      },

      cancelListing: (listingId) => {
        const listing = get().marketListings.find((l) => l.id === listingId);
        if (!listing) return;
        set((s) => ({
          marketListings: s.marketListings.filter((l) => l.id !== listingId),
          grimkin: s.grimkin.map((x) =>
            x.id === listing.grimkin.id ? { ...x, listed_on: null } : x,
          ),
        }));
      },

      buyMarketListing: (listingId) => {
        const s = get();
        const listing = s.marketListings.find((l) => l.id === listingId);
        if (!listing) return { error: 'Listing gone.' };
        if (s.player.gold < listing.price) return { error: 'Insufficient gold.' };
        if (!listing.is_npc) return { error: 'Cannot buy your own listing.' };
        const purchased = { ...listing.grimkin, owner_id: s.player.id, listed_on: null };
        set((st) => ({
          marketListings: st.marketListings.filter((l) => l.id !== listingId),
          grimkin: [purchased, ...st.grimkin],
          player: { ...st.player, gold: st.player.gold - listing.price },
        }));
        get().pushLog({ kind: 'buy', message: `Bought ${purchased.name} for ${listing.price}g.` });
        sfx.bid();
        return { ok: true };
      },

      listOnBlackMarket: ({ grimkinId, openingBid, contrabandRating = 1 }) => {
        const s = get();
        if (s.player.infamy_score < 10) return { error: 'Infamy too low.' };
        const g = s.grimkin.find((x) => x.id === grimkinId);
        if (!g) return null;
        const fee = Math.max(25, Math.round(openingBid * 0.05));
        if (s.player.gold < fee) return { error: `Listing fee ${fee}g — insufficient gold.` };
        const listing = {
          id: 'bm-' + Math.random().toString(36).slice(2, 10),
          seller_id: s.player.id,
          item_type: 'grimkin',
          grimkin: { ...g, listed_on: 'black_market' },
          current_bid: openingBid,
          highest_bidder: null,
          contraband_rating: contrabandRating,
          ends_at: Date.now() + 10 * 60 * 1000,
          created_at: Date.now(),
        };
        set((st) => ({
          blackMarketListings: [listing, ...st.blackMarketListings],
          player: { ...st.player, gold: st.player.gold - fee, heat_level: Math.min(100, st.player.heat_level + contrabandRating * 2) },
          grimkin: st.grimkin.map((x) => (x.id === grimkinId ? { ...x, listed_on: 'black_market' } : x)),
        }));
        get().pushLog({ kind: 'blackmarket', message: `Listed "${g.name}" on the floor. Fee ${fee}g.` });
        return listing;
      },

      // ── BOUNTIES ───────────────────────────────────────────────────────
      postBounty: ({ bountyType, targetSpec, reward, expiresInMs = 60 * 60 * 1000 }) => {
        const s = get();
        if (s.player.gold < reward) return { error: 'Escrow exceeds available gold.' };
        const bounty = {
          id: 'bn-' + Math.random().toString(36).slice(2, 10),
          poster_id: s.player.id,
          bounty_type: bountyType,
          target_spec: targetSpec,
          reward,
          escrow_held: true,
          status: 'open',
          claimer_id: null,
          created_at: Date.now(),
          expires_at: Date.now() + expiresInMs,
        };
        set((st) => ({
          bounties: [bounty, ...st.bounties],
          player: { ...st.player, gold: st.player.gold - reward },
        }));
        get().pushLog({ kind: 'bounty', message: `Posted ${bountyType} bounty — ${reward}g.` });
        return bounty;
      },

      claimBounty: (bountyId) => {
        const bounty = get().bounties.find((b) => b.id === bountyId);
        if (!bounty || bounty.status !== 'open') return null;
        set((s) => ({
          bounties: s.bounties.map((b) =>
            b.id === bountyId ? { ...b, status: 'claimed', claimer_id: s.player.id } : b,
          ),
          player: { ...s.player, gold: s.player.gold + bounty.reward, infamy_score: s.player.infamy_score + 2 },
        }));
        get().pushLog({ kind: 'bounty', message: `Claimed bounty. +${bounty.reward}g, +2 infamy.` });
        sfx.win();
        return bounty;
      },

      // ── ARENA ──────────────────────────────────────────────────────────
      sendToArena: ({ grimkinId, arenaId }) => {
        const s = get();
        const mine = s.grimkin.find((g) => g.id === grimkinId);
        if (!mine) return null;
        const opponent = generateGrimkin({ seed: `arena-${Date.now()}`, forceRarity: mine.rarity });
        const result = resolveFight({ fighterA: mine, fighterB: opponent, arenaId });
        const won = result.winnerId === mine.id;

        if (won) {
          set((st) => ({
            player: { ...st.player, gold: st.player.gold + result.payouts.winner, rep_score: st.player.rep_score + 1 },
            grimkin: st.grimkin.map((g) => g.id === grimkinId ? { ...g, condition: result.winnerCondition } : g),
          }));
          sfx.win();
        } else {
          const loserCond = result.loserCondition;
          if (loserCond === 'dead') {
            // Insurance payout if covered.
            const policy = get().insurancePolicies.find((p) => p.grimkin_id === grimkinId);
            if (policy) {
              set((st) => ({
                player: { ...st.player, gold: st.player.gold + policy.payout },
                insurancePolicies: st.insurancePolicies.filter((p) => p.id !== policy.id),
              }));
              get().pushLog({ kind: 'insurance', message: `Policy paid out: ${policy.payout}g.` });
            }
            set((st) => ({
              grimkin: st.grimkin.map((g) => g.id === grimkinId ? { ...g, status: 'dead', condition: 'Husk' } : g),
            }));
          } else {
            set((st) => ({
              grimkin: st.grimkin.map((g) => g.id === grimkinId ? { ...g, condition: loserCond } : g),
            }));
          }
          sfx.loss();
        }
        const fight = {
          id: 'af-' + Math.random().toString(36).slice(2, 10),
          arenaId, opponent,
          mine: { id: mine.id, name: mine.name },
          result, at: Date.now(),
        };
        set((st) => ({ arenaHistory: [fight, ...st.arenaHistory].slice(0, 50) }));
        get().pushLog({
          kind: 'arena',
          message: won
            ? `${mine.name} won. +${result.payouts.winner}g.`
            : `${mine.name} lost. Condition: ${result.loserCondition}.`,
        });
        return fight;
      },

      // ── LOANS ──────────────────────────────────────────────────────────
      takeLoan: ({ principal, collateralGrimkinId, dueInMs = 30 * 60 * 1000 }) => {
        const s = get();
        const g = s.grimkin.find((x) => x.id === collateralGrimkinId);
        if (!g) return { error: 'Pick valid collateral.' };
        const loan = {
          id: 'ln-' + Math.random().toString(36).slice(2, 10),
          principal,
          due_at: Date.now() + dueInMs,
          collateral_grimkin_id: collateralGrimkinId,
          collateral_name: g.name,
          interest_pct: LOAN_INTEREST,
          status: 'active',
        };
        set((st) => ({
          loans: [loan, ...st.loans],
          player: { ...st.player, gold: st.player.gold + principal },
        }));
        get().pushLog({ kind: 'loan', message: `Borrowed ${principal}g from a loan shark. Collateral: ${g.name}.` });
        return loan;
      },

      repayLoan: (loanId) => {
        const s = get();
        const loan = s.loans.find((l) => l.id === loanId);
        if (!loan) return;
        const owed = Math.round(loan.principal * (1 + loan.interest_pct));
        if (s.player.gold < owed) return { error: `Need ${owed}g.` };
        set((st) => ({
          loans: st.loans.map((l) => l.id === loanId ? { ...l, status: 'repaid' } : l),
          player: { ...st.player, gold: st.player.gold - owed },
        }));
        get().pushLog({ kind: 'loan', message: `Repaid ${owed}g loan.` });
        return { ok: true };
      },

      tickLoans: () => {
        const s = get();
        let took = null;
        const stillActive = [];
        const updated = [];
        for (const loan of s.loans) {
          if (loan.status !== 'active') { updated.push(loan); continue; }
          if (loan.due_at <= Date.now()) {
            // Default: seize collateral.
            took = loan;
            updated.push({ ...loan, status: 'defaulted' });
          } else {
            stillActive.push(loan);
            updated.push(loan);
          }
        }
        if (took) {
          set((st) => ({
            loans: updated,
            grimkin: st.grimkin.filter((g) => g.id !== took.collateral_grimkin_id),
          }));
          get().pushLog({ kind: 'loan', message: `LOAN DEFAULT. ${took.collateral_name} seized.` });
          get().pushTicker('default', `Loan shark seized ${took.collateral_name} from operator.`);
          sfx.alarm();
        }
      },

      // ── STUD SERVICES ──────────────────────────────────────────────────
      listAsStud: ({ grimkinId, feePerBreed }) => {
        const s = get();
        const g = s.grimkin.find((x) => x.id === grimkinId);
        if (!g) return { error: 'Unknown Grimkin.' };
        if (g.stats.fertility < 30) return { error: 'Fertility too low for stud listing.' };
        const listing = {
          id: 'st-' + Math.random().toString(36).slice(2, 10),
          grimkin_id: grimkinId,
          grimkin_snapshot: { name: g.name, species: g.species, rarity: g.rarity },
          fee_per_breed: feePerBreed,
          breeds_used: 0,
          created_at: Date.now(),
        };
        set((st) => ({
          studListings: [listing, ...st.studListings],
          grimkin: st.grimkin.map((x) => x.id === grimkinId ? { ...x, listed_on: 'stud' } : x),
        }));
        get().pushLog({ kind: 'stud', message: `${g.name} listed at stud for ${feePerBreed}g/breed.` });
        return listing;
      },

      cancelStud: (listingId) => {
        const listing = get().studListings.find((l) => l.id === listingId);
        if (!listing) return;
        set((s) => ({
          studListings: s.studListings.filter((l) => l.id !== listingId),
          grimkin: s.grimkin.map((g) => g.id === listing.grimkin_id ? { ...g, listed_on: null } : g),
        }));
      },

      // Simulated NPC stud requests trickle in based on listing quality.
      tickStudIncome: () => {
        const s = get();
        if (s.studListings.length === 0) return;
        let earned = 0;
        const updated = s.studListings.map((l) => {
          // Each listing earns 1 use per 90s of game time on average.
          if (Math.random() < 0.05) {
            earned += l.fee_per_breed;
            return { ...l, breeds_used: l.breeds_used + 1 };
          }
          return l;
        });
        if (earned > 0) {
          set((st) => ({
            studListings: updated,
            player: { ...st.player, gold: st.player.gold + earned },
          }));
          get().pushLog({ kind: 'stud', message: `Stud services earned ${earned}g.` });
        }
      },

      // ── INSURANCE ──────────────────────────────────────────────────────
      insureGrimkin: ({ grimkinId, payout }) => {
        const s = get();
        const g = s.grimkin.find((x) => x.id === grimkinId);
        if (!g) return { error: 'Unknown Grimkin.' };
        const premiumPerDay = Math.max(5, Math.round(payout * 0.04));
        if (s.player.gold < premiumPerDay) return { error: `Need ${premiumPerDay}g upfront.` };
        if (s.insurancePolicies.find((p) => p.grimkin_id === grimkinId)) {
          return { error: 'Already insured.' };
        }
        const policy = {
          id: 'in-' + Math.random().toString(36).slice(2, 10),
          grimkin_id: grimkinId,
          grimkin_name: g.name,
          premium_per_day: premiumPerDay,
          payout,
          last_charged_at: Date.now(),
          created_at: Date.now(),
        };
        set((st) => ({
          insurancePolicies: [policy, ...st.insurancePolicies],
          player: { ...st.player, gold: st.player.gold - premiumPerDay },
        }));
        get().pushLog({ kind: 'insurance', message: `${g.name} insured. Premium ${premiumPerDay}g/day.` });
        return policy;
      },

      cancelInsurance: (policyId) =>
        set((s) => ({ insurancePolicies: s.insurancePolicies.filter((p) => p.id !== policyId) })),

      // ── RAIDS ──────────────────────────────────────────────────────────
      buyRaidLicense: () => {
        const s = get();
        const cost = 250;
        if (s.player.gold < cost) return { error: 'Need 250g.' };
        if (s.player.infamy_score < 5) return { error: 'Infamy too low.' };
        set((st) => ({
          player: { ...st.player, gold: st.player.gold - cost, raid_licenses: st.player.raid_licenses + 1 },
        }));
        return { ok: true };
      },

      spawnRaidTargets: () => {
        const targets = [];
        for (let i = 0; i < 3; i++) targets.push(makeNpcRaidTarget());
        set({ raidTargets: targets });
      },

      executeRaid: (targetId) => {
        const s = get();
        if (s.player.raid_licenses <= 0) return { error: 'No raid licenses.' };
        const target = s.raidTargets.find((t) => t.id === targetId);
        if (!target) return { error: 'Target gone.' };
        const playerFerocity = s.grimkin.filter((g) => g.status === 'alive')
          .reduce((sum, g) => sum + g.stats.ferocity, 0);
        const successChance = rollRaidSuccess({ playerFerocity, difficulty: target.difficulty });
        const success = Math.random() < successChance;
        const history = {
          id: 'rh-' + Math.random().toString(36).slice(2, 10),
          target_name: target.target_name,
          at: Date.now(),
          success,
          taken: null,
        };
        if (success) {
          const taken = target.kennel[Math.floor(Math.random() * target.kennel.length)];
          taken.owner_id = s.player.id;
          history.taken = { name: taken.name, species: taken.species, rarity: taken.rarity };
          set((st) => ({
            player: {
              ...st.player,
              raid_licenses: st.player.raid_licenses - 1,
              infamy_score: st.player.infamy_score + 4,
              heat_level: Math.min(100, st.player.heat_level + 8),
            },
            grimkin: [taken, ...st.grimkin],
            raidTargets: st.raidTargets.filter((t) => t.id !== targetId),
            raidHistory: [history, ...st.raidHistory].slice(0, 50),
          }));
          get().pushLog({ kind: 'raid', message: `RAID HIT ${target.target_name}. Took ${taken.name}.` });
          get().pushTicker('raid', `${target.target_name}'s kennel was hit. ${taken.name} taken.`);
          sfx.win();
        } else {
          set((st) => ({
            player: {
              ...st.player,
              raid_licenses: st.player.raid_licenses - 1,
              heat_level: Math.min(100, st.player.heat_level + 15),
              vendetta_tokens: st.player.vendetta_tokens + 1,
            },
            raidTargets: st.raidTargets.filter((t) => t.id !== targetId),
            raidHistory: [history, ...st.raidHistory].slice(0, 50),
          }));
          get().pushLog({ kind: 'raid', message: `RAID FAILED on ${target.target_name}. Heat +15.` });
          get().pushTicker('raid', `${target.target_name} repelled a raid. Heat rising.`);
          sfx.alarm();
        }
        return { success, history };
      },

      // ── SABOTAGE ───────────────────────────────────────────────────────
      sabotageListing: (listingId) => {
        const s = get();
        const cost = 3; // Infamy.
        if (s.player.infamy_score < cost) return { error: 'Insufficient infamy.' };
        const listing = s.blackMarketListings.find((l) => l.id === listingId);
        if (!listing) return { error: 'Listing gone.' };
        if (!listing.is_npc) return { error: 'Cannot sabotage your own listings.' };
        // Spike contraband rating + apply heat hit on the listing.
        set((st) => ({
          player: { ...st.player, infamy_score: st.player.infamy_score - cost },
          blackMarketListings: st.blackMarketListings.map((l) =>
            l.id === listingId
              ? { ...l, contraband_rating: l.contraband_rating + 3, sabotaged: true, current_bid: Math.round(l.current_bid * 0.7) }
              : l,
          ),
          sabotageHistory: [
            { id: 'sb-' + Math.random().toString(36).slice(2, 8), at: Date.now(), target: listing.seller_name },
            ...st.sabotageHistory,
          ].slice(0, 30),
        }));
        get().pushLog({ kind: 'sabotage', message: `Sabotaged listing by ${listing.seller_name}.` });
        get().pushTicker('sabotage', `Anonymous tip leaked ${listing.seller_name}'s floor listing.`);
        sfx.bid();
        return { ok: true };
      },

      // ── NPC WORLD SIM ──────────────────────────────────────────────────
      tickWorld: () => {
        const s = get();
        const now = Date.now();
        // Spawn cadence: every ~25s for any kind of NPC activity.
        if (now - s.lastNpcSpawnAt < 25_000) return;
        const roll = Math.random();
        if (roll < 0.35) {
          const listing = makeNpcMarketListing();
          set((st) => ({ marketListings: [listing, ...st.marketListings].slice(0, 30) }));
          get().pushTicker('listing', `${listing.grimkin.species} listed by ${listing.seller_name} at ${listing.price}g.`);
        } else if (roll < 0.6) {
          const listing = makeNpcBlackMarketListing();
          set((st) => ({ blackMarketListings: [listing, ...st.blackMarketListings].slice(0, 20) }));
          get().pushTicker('listing', `Floor opens on ${listing.grimkin.species} — opening ${listing.current_bid}g.`);
        } else if (roll < 0.8) {
          const bounty = makeNpcBounty();
          set((st) => ({ bounties: [bounty, ...st.bounties].slice(0, 30) }));
          get().pushTicker('bounty', `${bounty.poster_name} posts ${bounty.bounty_type} bounty: ${bounty.reward}g.`);
        } else if (roll < 0.95) {
          // Random world flavor.
          const blurbs = [
            `Murk Storm sweeps the Silt.`,
            `Wardens report ‘unusual activity’ near Bonebridge.`,
            `${npcName()} claimed a Death Circuit purse.`,
            `Rookery prices spike on a Forsaken auction.`,
          ];
          get().pushTicker('flavor', blurbs[Math.floor(Math.random() * blurbs.length)]);
        } else {
          // If heat is high, a Warden raid attempt.
          if (s.player.heat_level >= 70 && s.grimkin.length > 1) {
            const seized = s.grimkin.find((g) => g.status === 'alive' && !g.listed_on);
            if (seized) {
              set((st) => ({
                grimkin: st.grimkin.filter((g) => g.id !== seized.id),
                player: { ...st.player, heat_level: Math.max(0, st.player.heat_level - 20) },
              }));
              get().pushLog({ kind: 'warden', message: `WARDEN RAID: ${seized.name} seized.` });
              get().pushTicker('warden', `Wardens raided an operator's kennel. One Grimkin seized.`);
              sfx.alarm();
            }
          }
        }
        // NPC bids on player's black-market listings.
        set((st) => {
          const next = st.blackMarketListings.map((l) => {
            if (l.is_npc) return l;
            if (l.ends_at <= now) return l;
            if (Math.random() < 0.3) {
              const inc = Math.max(10, Math.round(l.current_bid * (0.04 + Math.random() * 0.08)));
              return {
                ...l,
                current_bid: l.current_bid + inc,
                highest_bidder: 'ANON-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
              };
            }
            return l;
          });
          return { blackMarketListings: next };
        });
        set({ lastNpcSpawnAt: now });
      },

      tickPrices: () => {
        const s = get();
        if (Date.now() - s.lastPriceTickAt < 45_000) return;
        set((st) => ({ prices: tickPrices(st.prices), lastPriceTickAt: Date.now() }));
      },

      tickSaturation: () => {
        const s = get();
        const now = Date.now();
        const next = { ...s.saturation };
        let changed = false;
        for (const z of ZONES) {
          const entry = next[z.id] || { value: SATURATION_MAX, last_at: now };
          if (entry.value >= SATURATION_MAX) continue;
          const dt = now - (entry.last_at ?? now);
          const regen = (dt / (60 * 60 * 1000)) * SATURATION_REGEN_PER_HOUR;
          if (regen > 0) {
            next[z.id] = { value: Math.min(SATURATION_MAX, entry.value + regen), last_at: now };
            changed = true;
          }
        }
        if (changed) set({ saturation: next });
      },

      tickDistrictIncome: () => {
        const s = get();
        const now = Date.now();
        const elapsed = now - s.lastIncomeTickAt;
        if (elapsed < 60_000) return; // Tick every minute.
        let earned = 0;
        for (const dState of s.districts) {
          if (dState.controller === 'player') {
            const district = districtById(dState.id);
            if (district) earned += Math.round(district.passive_income_per_hour * (elapsed / 3_600_000));
          }
        }
        if (earned > 0) {
          set((st) => ({
            player: { ...st.player, gold: st.player.gold + earned },
            lastIncomeTickAt: now,
          }));
          get().pushLog({ kind: 'district', message: `District income: +${earned}g.` });
        } else {
          set({ lastIncomeTickAt: now });
        }
      },

      contestDistrict: (districtId) => {
        const s = get();
        const cost = 1000;
        if (s.player.gold < cost) return { error: `Need ${cost}g to contest.` };
        if (s.player.infamy_score < 20) return { error: 'Infamy too low.' };
        const district = s.districts.find((d) => d.id === districtId);
        if (!district) return { error: 'Unknown district.' };
        if (district.controller === 'player') return { error: 'Already yours.' };
        const success = Math.random() < 0.45 + s.player.infamy_score / 200;
        set((st) => ({
          player: { ...st.player, gold: st.player.gold - cost, heat_level: Math.min(100, st.player.heat_level + 12) },
          districts: st.districts.map((d) =>
            d.id === districtId
              ? success
                ? { ...d, controller: 'player', contested_since: Date.now() }
                : { ...d, contested_since: Date.now() }
              : d,
          ),
        }));
        if (success) {
          get().pushLog({ kind: 'district', message: `Took control of ${districtById(districtId).name}.` });
          get().pushTicker('district', `${districtById(districtId).name} flipped to operator control.`);
          sfx.win();
        } else {
          get().pushLog({ kind: 'district', message: `Contest failed in ${districtById(districtId).name}. Heat +12.` });
          sfx.loss();
        }
        return { success };
      },

      // ── PRESTIGE ───────────────────────────────────────────────────────
      retireForPrestige: () => {
        const s = get();
        if (s.player.rank < 50) return { error: 'Need Rank 50 (Kingpin).' };
        const nextPrestige = s.player.prestige + 1;
        const nextBonus = nextPrestige * 5;
        set({
          ...{
            player: { ...seedPlayer(), prestige: nextPrestige, prestige_bonus_pct: nextBonus, gold: Math.round(500 * (1 + nextBonus / 100)) },
            grimkin: seedStarterKennel(),
            parts: [], breedingQueue: [], marketListings: [], blackMarketListings: [],
            bounties: [], arenaHistory: [], worldEvents: [], scavengeRun: null,
            items: seedItems(), saturation: seedSaturation(), loans: [], studListings: [],
            insurancePolicies: [], raidTargets: [], raidHistory: [], sabotageHistory: [],
            districts: defaultDistrictState(), prices: defaultPriceState(),
            ticker: [], defectionPenalty: null, foundersCredit: [],
            lastNpcSpawnAt: 0, lastPriceTickAt: 0, lastIncomeTickAt: Date.now(),
            log: [],
          },
        });
        get().pushTicker('prestige', `OPERATOR RETIRED. Bloodline elevated to Prestige ${nextPrestige}.`);
        sfx.win();
        return { ok: true };
      },

      // ── DEV / RESET ────────────────────────────────────────────────────
      hardReset: () =>
        set({
          player: seedPlayer(),
          grimkin: seedStarterKennel(),
          parts: [], breedingQueue: [], marketListings: [], blackMarketListings: [],
          bounties: [], arenaHistory: [], worldEvents: [], scavengeRun: null,
          items: seedItems(), saturation: seedSaturation(), loans: [], studListings: [],
          insurancePolicies: [], raidTargets: [], raidHistory: [], sabotageHistory: [],
          districts: defaultDistrictState(), prices: defaultPriceState(),
          ticker: [], defectionPenalty: null, foundersCredit: [],
          lastNpcSpawnAt: 0, lastPriceTickAt: 0, lastIncomeTickAt: Date.now(),
          log: [],
        }),
    }),
    {
      name: 'darkmon:v1',
      version: 2,
    },
  ),
);

export function appraiseGrimkin(g) {
  return appraise(g);
}

export { sellValue };
