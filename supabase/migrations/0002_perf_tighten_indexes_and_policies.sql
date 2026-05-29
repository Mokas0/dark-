-- Adds covering indexes for every foreign key, and splits each "FOR ALL" RLS
-- write policy into explicit INSERT/UPDATE/DELETE so it no longer overlaps the
-- dedicated read policy on SELECT (multiple_permissive_policies lint).

-- 1) Covering indexes for unindexed foreign keys.
create index if not exists arena_fights_fighter1_idx       on arena_fights(fighter1_id);
create index if not exists arena_fights_fighter2_idx       on arena_fights(fighter2_id);
create index if not exists arena_fights_owner1_idx         on arena_fights(owner1_id);
create index if not exists arena_fights_owner2_idx         on arena_fights(owner2_id);
create index if not exists bm_listings_seller_idx          on black_market_listings(seller_id);
create index if not exists bm_listings_highest_bidder_idx  on black_market_listings(highest_bidder);
create index if not exists bounties_poster_idx             on bounties(poster_id);
create index if not exists bounties_claimer_idx            on bounties(claimer_id);
create index if not exists breeding_owner_idx              on breeding_queue(owner_id);
create index if not exists breeding_parent1_idx            on breeding_queue(parent1_id);
create index if not exists breeding_parent2_idx            on breeding_queue(parent2_id);
create index if not exists breeding_result_idx             on breeding_queue(result_grimkin_id);
create index if not exists market_seller_idx               on market_listings(seller_id);
create index if not exists market_grimkin_idx              on market_listings(grimkin_id);
create index if not exists parts_owner_idx                 on parts_inventory(owner_id);
create index if not exists players_syndicate_idx           on players(syndicate_id);
create index if not exists syndicates_leader_idx           on syndicates(leader_id);
create index if not exists tx_from_idx                     on transactions(from_player);
create index if not exists tx_to_idx                       on transactions(to_player);

-- 2) Split each "write" FOR ALL policy into explicit per-action policies.

-- grimkin
drop policy if exists "grimkin write" on grimkin;
create policy "grimkin insert" on grimkin for insert with check ((select auth.uid()) = owner_id);
create policy "grimkin update" on grimkin for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "grimkin delete" on grimkin for delete using ((select auth.uid()) = owner_id);

-- market_listings
drop policy if exists "market write" on market_listings;
create policy "market insert" on market_listings for insert with check ((select auth.uid()) = seller_id);
create policy "market update" on market_listings for update using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);
create policy "market delete" on market_listings for delete using ((select auth.uid()) = seller_id);

-- black_market_listings
drop policy if exists "blackmarket write" on black_market_listings;
create policy "blackmarket insert" on black_market_listings for insert with check ((select auth.uid()) = seller_id);
create policy "blackmarket update" on black_market_listings for update using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);
create policy "blackmarket delete" on black_market_listings for delete using ((select auth.uid()) = seller_id);

-- bounties
drop policy if exists "bounties write" on bounties;
create policy "bounties insert" on bounties for insert with check ((select auth.uid()) = poster_id);
create policy "bounties update" on bounties for update using ((select auth.uid()) = poster_id) with check ((select auth.uid()) = poster_id);
create policy "bounties delete" on bounties for delete using ((select auth.uid()) = poster_id);

-- breeding_queue
drop policy if exists "breeding write" on breeding_queue;
create policy "breeding insert" on breeding_queue for insert with check ((select auth.uid()) = owner_id);
create policy "breeding update" on breeding_queue for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "breeding delete" on breeding_queue for delete using ((select auth.uid()) = owner_id);

-- parts_inventory
drop policy if exists "parts write" on parts_inventory;
create policy "parts insert" on parts_inventory for insert with check ((select auth.uid()) = owner_id);
create policy "parts update" on parts_inventory for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "parts delete" on parts_inventory for delete using ((select auth.uid()) = owner_id);
