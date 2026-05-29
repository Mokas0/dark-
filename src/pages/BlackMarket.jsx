import { useEffect, useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { GrimkinCard } from '../components/GrimkinCard.jsx';
import { Countdown } from '../components/Countdown.jsx';
import { appraise } from '../lib/grimkin.js';
import { sfx } from '../lib/audio.js';

export function BlackMarket() {
  const player = useGameStore((s) => s.player);
  const listings = useGameStore((s) => s.blackMarketListings);
  const grimkin = useGameStore((s) => s.grimkin);
  const listOnBlackMarket = useGameStore((s) => s.listOnBlackMarket);
  const adjustGold = useGameStore((s) => s.adjustGold);
  const adjustInfamy = useGameStore((s) => s.adjustInfamy);
  const sabotageListing = useGameStore((s) => s.sabotageListing);

  const [selected, setSelected] = useState(null);
  const [openingBid, setOpeningBid] = useState('');
  const [error, setError] = useState(null);

  const lockedOut = player.infamy_score < 10;

  // Simulate rolling bids from anonymous IDs while listings are live.
  useEffect(() => {
    if (lockedOut) return;
    const t = setInterval(() => {
      useGameStore.setState((s) => {
        if (!s.blackMarketListings.length) return s;
        const next = s.blackMarketListings.map((l) => {
          if (l.ends_at <= Date.now()) return l;
          if (Math.random() < 0.25) {
            const inc = Math.max(10, Math.round(l.current_bid * (0.04 + Math.random() * 0.08)));
            return {
              ...l,
              current_bid: l.current_bid + inc,
              highest_bidder: `ANON-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            };
          }
          return l;
        });
        return { blackMarketListings: next };
      });
    }, 4000);
    return () => clearInterval(t);
  }, [lockedOut]);

  const candidates = grimkin.filter((g) => g.status === 'alive' && !g.listed_on);

  const post = () => {
    setError(null);
    if (!selected || !openingBid) return setError('Pick a Grimkin and an opening bid.');
    const r = listOnBlackMarket({
      grimkinId: selected.id,
      openingBid: Number(openingBid),
      contrabandRating: 2,
    });
    if (r?.error) setError(r.error);
    else {
      setSelected(null);
      setOpeningBid('');
    }
  };

  const settle = (listing) => {
    // The auction closes. Seller (you) collects current_bid.
    adjustGold(listing.current_bid, `Black market sale of ${listing.grimkin.name}`);
    adjustInfamy(5);
    useGameStore.setState((s) => ({
      blackMarketListings: s.blackMarketListings.filter((l) => l.id !== listing.id),
      grimkin: s.grimkin.filter((g) => g.id !== listing.grimkin.id),
    }));
  };

  if (lockedOut) {
    return (
      <div className="panel p-8 max-w-xl mx-auto text-center">
        <div className="display-heading text-3xl text-accent-void">DOOR'S CLOSED.</div>
        <p className="text-xs text-text-dim mt-3 leading-relaxed">
          You need Infamy ≥ 10 to step onto the floor. Run dirty bounties or sell
          stolen goods until the right people know your face.
        </p>
        <p className="text-[0.65rem] text-text-dim mt-6">// current infamy: {player.infamy_score}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12">
        <div className="label text-accent-void">// BLACK MARKET</div>
        <h1 className="display-heading text-2xl mt-1">The Floor</h1>
        <p className="text-xs text-text-dim mt-1">
          Rolling 10-minute auctions. Anonymous bidders. Heat rises when you list.
          The floor is hot tonight.
        </p>
      </section>

      <section className="col-span-12 md:col-span-5 panel p-4 space-y-3 border-accent-void/30">
        <div className="label">// SUBMIT TO THE FLOOR</div>
        <select
          value={selected?.id || ''}
          onChange={(e) => setSelected(candidates.find((g) => g.id === e.target.value) || null)}
          className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm"
        >
          <option value="">— Choose contraband —</option>
          {candidates.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} · {g.species} · {g.rarity}
            </option>
          ))}
        </select>
        {selected && (
          <>
            <GrimkinCard grimkin={selected} compact />
            <p className="text-[0.65rem] text-text-dim">
              Appraisal: {appraise(selected).toLocaleString()}g · Fee: 5% (min 25g)
            </p>
          </>
        )}
        <input
          type="number"
          value={openingBid}
          onChange={(e) => setOpeningBid(e.target.value)}
          placeholder="Opening bid (gold)"
          className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm tabular-nums"
        />
        {error && <p className="text-xs text-accent-blood">{error}</p>}
        <button onClick={post} className="btn btn-void w-full">OPEN AUCTION</button>
      </section>

      <section className="col-span-12 md:col-span-7 panel p-4">
        <div className="label">// LIVE FLOOR</div>
        {listings.length === 0 ? (
          <p className="text-xs text-text-dim italic mt-2">Floor is quiet. Suspiciously so.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {listings.map((l) => {
              const ended = l.ends_at <= Date.now();
              const npc = !!l.is_npc;
              return (
                <li key={l.id} className={`panel-inset p-3 flex justify-between items-center ${l.sabotaged ? 'border-accent-void' : ''}`}>
                  <div>
                    <div className={`rarity-${l.grimkin.rarity}`}>
                      {l.grimkin.name}
                      {l.sabotaged && <span className="ml-2 text-[0.6rem] text-accent-void">SABOTAGED</span>}
                    </div>
                    <div className="text-[0.65rem] text-text-dim uppercase tracking-widest">
                      {npc ? `seller ${l.seller_name}` : `bid by ${l.highest_bidder || '— none —'}`}
                    </div>
                    <div className="text-[0.55rem] text-accent-blood">
                      contraband · {l.contraband_rating}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-accent-blood tabular-nums text-lg animate-pulse-blood inline-block px-2">
                        {l.current_bid.toLocaleString()}g
                      </div>
                      <div className="text-[0.65rem] text-text-dim">
                        ends in <Countdown to={l.ends_at} />
                      </div>
                    </div>
                    {npc && !l.sabotaged && (
                      <button
                        onClick={() => sabotageListing(l.id)}
                        className="btn btn-void"
                        title="Spike contraband rating, drop the bid. Costs 3 infamy."
                      >
                        SABOTAGE
                      </button>
                    )}
                    {ended && !npc && (
                      <button onClick={() => settle(l)} className="btn btn-void">
                        SETTLE
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
