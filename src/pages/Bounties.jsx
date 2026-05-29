import { useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';

const TYPES = [
  { id: 'capture', label: 'Capture', desc: 'Bring a specimen alive.' },
  { id: 'elimination', label: 'Elimination', desc: 'Kill another operator\'s Grimkin.' },
  { id: 'specimen', label: 'Specimen', desc: 'Deliver harvested parts.' },
];

export function Bounties() {
  const bounties = useGameStore((s) => s.bounties);
  const postBounty = useGameStore((s) => s.postBounty);
  const claimBounty = useGameStore((s) => s.claimBounty);

  const [type, setType] = useState('capture');
  const [species, setSpecies] = useState('');
  const [rarity, setRarity] = useState('common');
  const [reward, setReward] = useState('');
  const [error, setError] = useState(null);

  const post = () => {
    setError(null);
    if (!reward) return setError('Reward required.');
    const r = postBounty({
      bountyType: type,
      targetSpec: { species: species || 'any', rarity },
      reward: Number(reward),
    });
    if (r?.error) setError(r.error);
    else {
      setSpecies('');
      setReward('');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12">
        <div className="label text-accent-blood">// BOUNTY BOARD</div>
        <h1 className="display-heading text-2xl mt-1">Contracts</h1>
        <p className="text-xs text-text-dim mt-1">
          Post a contract or claim one. Escrow is non-negotiable — gold is locked the moment ink dries.
        </p>
      </section>

      <section className="col-span-12 md:col-span-5 panel p-4 space-y-3">
        <div className="label">// POST A CONTRACT</div>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`btn ${type === t.id ? 'border-accent-blood text-accent-blood' : ''}`}
              title={t.desc}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-[0.65rem] text-text-dim">
          {TYPES.find((t) => t.id === type).desc}
        </div>

        <input
          type="text"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="Target species (or blank for any)"
          className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm"
        />
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm"
        >
          <option value="common">Common</option>
          <option value="murk">Murk</option>
          <option value="forsaken">Forsaken</option>
          <option value="abyssal">Abyssal</option>
          <option value="void">Void</option>
        </select>
        <input
          type="number"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          placeholder="Reward (escrowed)"
          className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm tabular-nums"
        />
        {error && <p className="text-xs text-accent-blood">{error}</p>}
        <button onClick={post} className="btn btn-blood w-full">POST CONTRACT</button>
      </section>

      <section className="col-span-12 md:col-span-7 panel p-4">
        <div className="label">// OPEN CONTRACTS</div>
        {bounties.length === 0 ? (
          <p className="text-xs text-text-dim italic mt-2">No contracts open.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {bounties.map((b) => (
              <li key={b.id} className="panel-inset p-3 flex justify-between items-center">
                <div className="text-xs">
                  <div className="text-text-primary uppercase tracking-widest">
                    {b.bounty_type} · {b.target_spec.species} · {b.target_spec.rarity}
                  </div>
                  <div className="text-text-dim">
                    {b.status === 'open'
                      ? `Posted ${new Date(b.created_at).toLocaleTimeString()}`
                      : `Claimed`}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-accent-gold tabular-nums">{b.reward.toLocaleString()}g</span>
                  {b.status === 'open' && (
                    <button onClick={() => claimBounty(b.id)} className="btn btn-blood">
                      CLAIM
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
