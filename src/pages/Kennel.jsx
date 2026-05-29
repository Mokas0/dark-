import { useMemo, useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { GrimkinCard } from '../components/GrimkinCard.jsx';
import { RARITY_TIERS, appraise } from '../lib/grimkin.js';

export function Kennel() {
  const grimkin = useGameStore((s) => s.grimkin);
  const player = useGameStore((s) => s.player);
  const policies = useGameStore((s) => s.insurancePolicies);
  const harvest = useGameStore((s) => s.harvest);
  const removeGrimkin = useGameStore((s) => s.removeGrimkin);
  const insureGrimkin = useGameStore((s) => s.insureGrimkin);
  const [filter, setFilter] = useState('alive');

  const filtered = useMemo(() => {
    if (filter === 'alive') return grimkin.filter((g) => g.status === 'alive');
    if (filter === 'listed') return grimkin.filter((g) => g.listed_on);
    if (filter === 'dead') return grimkin.filter((g) => g.status !== 'alive');
    return grimkin;
  }, [grimkin, filter]);

  const byRarity = useMemo(() => {
    const out = {};
    for (const t of RARITY_TIERS) out[t.id] = 0;
    for (const g of grimkin) if (g.status === 'alive') out[g.rarity] = (out[g.rarity] || 0) + 1;
    return out;
  }, [grimkin]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="label">// KENNEL</div>
          <h1 className="display-heading text-3xl">{player.username}'s Holdings</h1>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {RARITY_TIERS.map((t) => (
            <span key={t.id} className={`chip rarity-${t.id} border-border`}>
              {t.name} · {byRarity[t.id] || 0}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'alive', label: 'LIVE' },
          { id: 'listed', label: 'LISTED' },
          { id: 'dead', label: 'PROCESSED' },
          { id: 'all', label: 'ALL' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`btn ${filter === tab.id ? 'border-accent-blood text-accent-blood' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-dim text-sm italic">No Grimkin match the filter. The cages are empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GrimkinCard
              key={g.id}
              grimkin={g}
              footer={
                g.status === 'alive' ? (
                  <div className="flex gap-2">
                    {policies.find((p) => p.grimkin_id === g.id) ? (
                      <span className="chip border-accent-toxic/40 text-accent-toxic">INSURED</span>
                    ) : (
                      <button
                        onClick={() => {
                          const payout = Math.round(appraise(g) * 0.6);
                          insureGrimkin({ grimkinId: g.id, payout });
                        }}
                        className="btn flex-1"
                      >
                        INSURE
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => removeGrimkin(g.id)} className="btn">
                    DISPOSE
                  </button>
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
