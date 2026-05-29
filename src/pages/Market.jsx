import { useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { GrimkinCard } from '../components/GrimkinCard.jsx';
import { appraise } from '../lib/grimkin.js';

export function Market() {
  const grimkin = useGameStore((s) => s.grimkin);
  const listings = useGameStore((s) => s.marketListings);
  const listOnMarket = useGameStore((s) => s.listOnMarket);
  const cancelListing = useGameStore((s) => s.cancelListing);
  const adjustGold = useGameStore((s) => s.adjustGold);

  const [selected, setSelected] = useState(null);
  const [price, setPrice] = useState('');

  const liveUnlisted = grimkin.filter((g) => g.status === 'alive' && !g.listed_on);

  const list = () => {
    if (!selected || !price) return;
    listOnMarket({ grimkinId: selected.id, price: Number(price) });
    setSelected(null);
    setPrice('');
  };

  const fakeBuyer = (listing) => {
    // Stand-in for another player buying. The system credits you.
    adjustGold(listing.price, `Sold ${listing.grimkin.name} on open market.`);
    cancelListing(listing.id);
    useGameStore.setState((s) => ({
      grimkin: s.grimkin.filter((g) => g.id !== listing.grimkin.id),
    }));
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12">
        <div className="label">// OPEN MARKET</div>
        <h1 className="display-heading text-2xl mt-1">The Floor</h1>
        <p className="text-xs text-text-dim mt-1">
          Fixed-price listings. Legal-ish. Tax skims a few percent off the top. No Heat.
        </p>
      </section>

      <section className="col-span-12 md:col-span-5 panel p-4 space-y-3">
        <div className="label">// LIST A GRIMKIN</div>
        <select
          value={selected?.id || ''}
          onChange={(e) => setSelected(liveUnlisted.find((g) => g.id === e.target.value) || null)}
          className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm"
        >
          <option value="">— Choose a Grimkin —</option>
          {liveUnlisted.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} · {g.species} · {g.rarity}
            </option>
          ))}
        </select>

        {selected && (
          <>
            <GrimkinCard grimkin={selected} compact />
            <p className="text-[0.65rem] text-text-dim">
              Suggested floor: {appraise(selected).toLocaleString()}g
            </p>
          </>
        )}

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Asking price (gold)"
          className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm tabular-nums"
        />

        <button onClick={list} className="btn btn-gold w-full">POST LISTING</button>
      </section>

      <section className="col-span-12 md:col-span-7 panel p-4">
        <div className="label">// YOUR ACTIVE LISTINGS</div>
        {listings.length === 0 ? (
          <p className="text-xs text-text-dim italic mt-2">Nothing on the floor.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {listings.map((l) => (
              <li key={l.id} className="panel-inset p-3 flex justify-between items-center">
                <div>
                  <div className={`rarity-${l.grimkin.rarity}`}>{l.grimkin.name}</div>
                  <div className="text-[0.65rem] text-text-dim uppercase tracking-widest">
                    {l.grimkin.species} · {l.grimkin.rarity}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-accent-gold tabular-nums">{l.price.toLocaleString()}g</span>
                  <button onClick={() => fakeBuyer(l)} className="btn btn-gold">SIM BUYER</button>
                  <button onClick={() => cancelListing(l.id)} className="btn">PULL</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
