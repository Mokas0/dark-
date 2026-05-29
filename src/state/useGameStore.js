import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateGrimkin, breedOffspring, appraise, harvestYield } from '../lib/grimkin.js';
import { resolveFight } from '../lib/combat.js';

// Local-first store. When Supabase is configured later, the same actions can be
// wired to network calls; the components don't care where the data lives.

const STARTING_GRIMKIN = 3;

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
  };
}

function seedStarterKennel() {
  const out = [];
  for (let i = 0; i < STARTING_GRIMKIN; i++) {
    out.push(generateGrimkin({ seed: `starter-${Date.now()}-${i}`, ownerId: 'local-player' }));
  }
  return out;
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      player: seedPlayer(),
      grimkin: seedStarterKennel(),
      parts: [],
      breedingQueue: [],
      marketListings: [],
      blackMarketListings: [],
      bounties: [],
      arenaHistory: [],
      worldEvents: [],
      log: [],

      // -- LOG --
      pushLog: (entry) =>
        set((s) => ({ log: [{ at: Date.now(), ...entry }, ...s.log].slice(0, 100) })),

      // -- PLAYER --
      adjustGold: (delta, reason = '') =>
        set((s) => {
          const next = s.player.gold + delta;
          return {
            player: { ...s.player, gold: Math.max(0, next) },
            log: [{ at: Date.now(), kind: 'gold', delta, reason }, ...s.log].slice(0, 100),
          };
        }),

      adjustHeat: (delta) =>
        set((s) => ({
          player: { ...s.player, heat_level: Math.max(0, Math.min(100, s.player.heat_level + delta)) },
        })),

      adjustInfamy: (delta) =>
        set((s) => ({
          player: { ...s.player, infamy_score: Math.max(0, s.player.infamy_score + delta) },
        })),

      setFaction: (faction) =>
        set((s) => ({ player: { ...s.player, faction } })),

      // -- GRIMKIN --
      catchWild: () => {
        const g = generateGrimkin({ seed: `wild-${Date.now()}`, ownerId: get().player.id });
        set((s) => ({ grimkin: [g, ...s.grimkin] }));
        get().pushLog({ kind: 'catch', message: `Caught a ${g.rarity.toUpperCase()} ${g.species} — "${g.name}".` });
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
        get().pushLog({
          kind: 'harvest',
          message: `${g.name} processed. Yielded ${yieldParts.length} part type(s).`,
        });
        return yieldParts;
      },

      // -- BREEDING --
      queueBreed: ({ parentAId, parentBId, durationMs = 60_000 }) => {
        const s = get();
        const a = s.grimkin.find((g) => g.id === parentAId);
        const b = s.grimkin.find((g) => g.id === parentBId);
        if (!a || !b) return null;
        const cost = 75;
        if (s.player.gold < cost) return { error: 'Insufficient gold (75g required).' };
        const entry = {
          id: 'br-' + Math.random().toString(36).slice(2, 10),
          parentA: a,
          parentB: b,
          startedAt: Date.now(),
          completesAt: Date.now() + durationMs,
          status: 'incubating',
        };
        set((st) => ({
          breedingQueue: [entry, ...st.breedingQueue],
          player: { ...st.player, gold: st.player.gold - cost },
        }));
        get().pushLog({ kind: 'breed', message: `Pair queued: ${a.name} × ${b.name}. Incubating.` });
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
          message: `Hatched ${child.rarity.toUpperCase()} ${child.species} — "${child.name}".`,
        });
        return child;
      },

      dismissBreed: (entryId) =>
        set((s) => ({ breedingQueue: s.breedingQueue.filter((e) => e.id !== entryId) })),

      // -- MARKET --
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
        get().pushLog({ kind: 'list', message: `Listed ${g.name} on the open market for ${price}g.` });
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

      // -- BLACK MARKET --
      listOnBlackMarket: ({ grimkinId, openingBid, contrabandRating = 1 }) => {
        const s = get();
        if (s.player.infamy_score < 10) return { error: 'Infamy too low for black market access.' };
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
        get().pushLog({
          kind: 'blackmarket',
          message: `Floor opened on "${g.name}". Fee paid: ${fee}g. Heat rising.`,
        });
        return listing;
      },

      // -- BOUNTIES --
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
        get().pushLog({ kind: 'bounty', message: `Posted ${bountyType} bounty — ${reward}g in escrow.` });
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
        get().pushLog({ kind: 'bounty', message: `Bounty claimed. +${bounty.reward}g, +2 infamy.` });
        return bounty;
      },

      // -- ARENA --
      sendToArena: ({ grimkinId, arenaId }) => {
        const s = get();
        const mine = s.grimkin.find((g) => g.id === grimkinId);
        if (!mine) return null;
        // Spawn a wild opponent matched roughly to your rarity.
        const opponent = generateGrimkin({ seed: `arena-${Date.now()}`, forceRarity: mine.rarity });
        const result = resolveFight({ fighterA: mine, fighterB: opponent, arenaId });
        const won = result.winnerId === mine.id;

        const updates = {};
        if (won) {
          updates.player = { ...s.player, gold: s.player.gold + result.payouts.winner, rep_score: s.player.rep_score + 1 };
          updates.grimkin = s.grimkin.map((g) =>
            g.id === grimkinId ? { ...g, condition: result.winnerCondition } : g,
          );
        } else {
          const loserCond = result.loserCondition;
          if (loserCond === 'dead') {
            updates.grimkin = s.grimkin.map((g) =>
              g.id === grimkinId ? { ...g, status: 'dead', condition: 'Husk' } : g,
            );
          } else {
            updates.grimkin = s.grimkin.map((g) =>
              g.id === grimkinId ? { ...g, condition: loserCond } : g,
            );
          }
        }
        const fight = {
          id: 'af-' + Math.random().toString(36).slice(2, 10),
          arenaId,
          opponent,
          mine: { id: mine.id, name: mine.name },
          result,
          at: Date.now(),
        };
        set((st) => ({
          ...updates,
          arenaHistory: [fight, ...st.arenaHistory].slice(0, 50),
        }));
        get().pushLog({
          kind: 'arena',
          message: won
            ? `${mine.name} won in ${arenaId}. +${result.payouts.winner}g.`
            : `${mine.name} lost in ${arenaId}. Condition: ${result.loserCondition}.`,
        });
        return fight;
      },

      // -- DEV / RESET --
      hardReset: () =>
        set({
          player: seedPlayer(),
          grimkin: seedStarterKennel(),
          parts: [],
          breedingQueue: [],
          marketListings: [],
          blackMarketListings: [],
          bounties: [],
          arenaHistory: [],
          worldEvents: [],
          log: [],
        }),
    }),
    {
      name: 'darkmon:v1',
      version: 1,
    },
  ),
);

export function appraiseGrimkin(g) {
  return appraise(g);
}
