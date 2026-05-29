-- DARKMON initial schema. Apply via Supabase SQL editor or `supabase db push`.

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- SYNDICATES
-- ----------------------------------------------------------------------------
create table if not exists syndicates (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  leader_id uuid,
  treasury int not null default 0,
  territory jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table if not exists players (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  gold int not null default 500,
  rep_score int not null default 0,
  infamy_score int not null default 0,
  heat_level int not null default 0,
  faction text check (faction in ('renderers','pitmasters','broodlords')),
  syndicate_id uuid references syndicates(id) on delete set null,
  rank int not null default 1,
  kennel_size int not null default 12,
  created_at timestamptz not null default now()
);

alter table syndicates
  add constraint syndicates_leader_fk
  foreign key (leader_id) references players(id) on delete set null;

-- ----------------------------------------------------------------------------
-- GRIMKIN
-- ----------------------------------------------------------------------------
create table if not exists grimkin (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references players(id) on delete set null,
  species text not null,
  rarity text not null check (rarity in ('common','murk','forsaken','abyssal','void','singularity')),
  traits jsonb not null default '[]'::jsonb,
  stats jsonb not null,
  condition text not null default 'Pristine' check (condition in ('Pristine','Scarred','Broken','Husk')),
  age int not null default 0,
  lineage jsonb not null default '[]'::jsonb,
  mutations jsonb not null default '[]'::jsonb,
  status text not null default 'alive' check (status in ('alive','dead','harvested','escaped')),
  listed_on text check (listed_on in ('market','black_market','arena','bounty','stud')),
  created_at timestamptz not null default now()
);
create index if not exists grimkin_owner_idx on grimkin(owner_id);
create index if not exists grimkin_rarity_idx on grimkin(rarity);

-- ----------------------------------------------------------------------------
-- MARKETS
-- ----------------------------------------------------------------------------
create table if not exists market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references players(id) on delete cascade,
  grimkin_id uuid not null references grimkin(id) on delete cascade,
  price int not null check (price > 0),
  listing_type text not null check (listing_type in ('fixed','auction')) default 'fixed',
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists black_market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references players(id) on delete cascade,
  item_type text not null check (item_type in ('grimkin','part','egg')),
  item_id uuid not null,
  current_bid int not null default 0,
  highest_bidder uuid references players(id) on delete set null,
  contraband_rating int not null default 1,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists bm_active_idx on black_market_listings(ends_at);

-- ----------------------------------------------------------------------------
-- BOUNTIES
-- ----------------------------------------------------------------------------
create table if not exists bounties (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references players(id) on delete cascade,
  bounty_type text not null check (bounty_type in ('capture','elimination','specimen')),
  target_spec jsonb not null,
  reward int not null check (reward > 0),
  escrow_held bool not null default true,
  status text not null default 'open' check (status in ('open','claimed','expired','cancelled')),
  claimer_id uuid references players(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ----------------------------------------------------------------------------
-- ARENA
-- ----------------------------------------------------------------------------
create table if not exists arena_fights (
  id uuid primary key default gen_random_uuid(),
  arena_type text not null,
  fighter1_id uuid references grimkin(id) on delete set null,
  fighter2_id uuid references grimkin(id) on delete set null,
  owner1_id uuid references players(id) on delete set null,
  owner2_id uuid references players(id) on delete set null,
  entry_fee int not null default 0,
  result jsonb,
  status text not null default 'pending' check (status in ('pending','resolved','cancelled')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- BREEDING
-- ----------------------------------------------------------------------------
create table if not exists breeding_queue (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references players(id) on delete cascade,
  parent1_id uuid not null references grimkin(id) on delete cascade,
  parent2_id uuid not null references grimkin(id) on delete cascade,
  completes_at timestamptz not null,
  status text not null default 'incubating' check (status in ('incubating','hatched','aborted')),
  result_grimkin_id uuid references grimkin(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PARTS INVENTORY
-- ----------------------------------------------------------------------------
create table if not exists parts_inventory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references players(id) on delete cascade,
  part_type text not null check (part_type in ('organ','venom','essence','bone')),
  source_grimkin_id uuid,
  source_species text,
  quality int not null default 50,
  quantity int not null default 1,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TRANSACTIONS / AUDIT
-- ----------------------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  from_player uuid references players(id) on delete set null,
  to_player uuid references players(id) on delete set null,
  amount int not null default 0,
  item_id uuid,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- WORLD EVENTS
-- ----------------------------------------------------------------------------
create table if not exists world_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  label text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null
);

-- ----------------------------------------------------------------------------
-- RPC: credit_player_gold
-- ----------------------------------------------------------------------------
create or replace function credit_player_gold(player_id uuid, amount int)
returns void
language plpgsql
security definer
as $$
begin
  update players set gold = gold + amount where id = player_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table players                 enable row level security;
alter table grimkin                 enable row level security;
alter table market_listings         enable row level security;
alter table black_market_listings   enable row level security;
alter table bounties                enable row level security;
alter table arena_fights            enable row level security;
alter table breeding_queue          enable row level security;
alter table parts_inventory         enable row level security;
alter table transactions            enable row level security;
alter table syndicates              enable row level security;
alter table world_events            enable row level security;

-- Players: each user reads/writes their own row.
create policy "players self read" on players for select using (true);
create policy "players self update" on players for update using (auth.uid() = id);

-- Grimkin: readable by anyone (market browsing), writable only by owner.
create policy "grimkin read" on grimkin for select using (true);
create policy "grimkin write" on grimkin for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Market listings: read all; write only own.
create policy "market read" on market_listings for select using (true);
create policy "market write" on market_listings for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

-- Black market: read requires infamy >= 10.
create policy "blackmarket read" on black_market_listings for select using (
  exists (select 1 from players p where p.id = auth.uid() and p.infamy_score >= 10)
);
create policy "blackmarket write" on black_market_listings for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

-- Bounties: read all; write only own.
create policy "bounties read" on bounties for select using (true);
create policy "bounties write" on bounties for all using (auth.uid() = poster_id) with check (auth.uid() = poster_id);

-- Arena fights: read all (spectators); writes via server.
create policy "arena read" on arena_fights for select using (true);

-- Breeding queue: owner only.
create policy "breeding read" on breeding_queue for select using (auth.uid() = owner_id);
create policy "breeding write" on breeding_queue for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Parts: owner only.
create policy "parts read" on parts_inventory for select using (auth.uid() = owner_id);
create policy "parts write" on parts_inventory for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Transactions: participants only.
create policy "tx read" on transactions for select using (
  auth.uid() = from_player or auth.uid() = to_player
);

-- Syndicates: read all; writes via server (leader-driven).
create policy "syndicates read" on syndicates for select using (true);

-- World events: read all.
create policy "events read" on world_events for select using (true);

-- ----------------------------------------------------------------------------
-- REALTIME publication
-- ----------------------------------------------------------------------------
-- Add the high-velocity tables to the realtime publication.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table black_market_listings;
alter publication supabase_realtime add table arena_fights;
alter publication supabase_realtime add table bounties;
alter publication supabase_realtime add table breeding_queue;
alter publication supabase_realtime add table world_events;
