import { useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { DISTRICTS, districtById } from '../lib/districts.js';

const FACTION_TONE = {
  unclaimed: 'text-text-dim',
  player: 'text-accent-gold',
  renderers: 'text-accent-toxic',
  pitmasters: 'text-accent-blood',
  broodlords: 'text-accent-void',
};

export function World() {
  const districtState = useGameStore((s) => s.districts);
  const contest = useGameStore((s) => s.contestDistrict);
  const [msg, setMsg] = useState(null);

  const stateById = Object.fromEntries(districtState.map((d) => [d.id, d]));

  const tryContest = (id) => {
    const r = contest(id);
    if (r?.error) setMsg(r.error);
    else setMsg(r.success ? 'TERRITORY HELD' : 'CONTEST FAILED');
  };

  const owned = districtState.filter((d) => d.controller === 'player').length;
  const hourlyIncome = districtState
    .filter((d) => d.controller === 'player')
    .reduce((sum, d) => sum + (districtById(d.id)?.passive_income_per_hour || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="label">// THE MURK</div>
          <h1 className="display-heading text-2xl mt-1">Districts</h1>
          <p className="text-xs text-text-dim mt-1">
            Six districts. Six economies. Whoever flies the banner here collects rent on every transaction.
          </p>
        </div>
        <div className="text-right text-xs">
          <div>Districts held: <span className="text-accent-gold">{owned}/{DISTRICTS.length}</span></div>
          <div>Passive income: <span className="text-accent-gold">{hourlyIncome.toLocaleString()}g/hr</span></div>
        </div>
      </div>
      {msg && <p className="text-xs text-accent-blood">{msg}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DISTRICTS.map((d) => {
          const s = stateById[d.id];
          const tone = FACTION_TONE[s?.controller] || FACTION_TONE.unclaimed;
          const isYours = s?.controller === 'player';
          return (
            <div key={d.id} className={`panel p-4 crt-overlay ${isYours ? 'border-accent-gold/50' : ''}`}>
              <div className={`label ${tone}`}>// {d.name.toUpperCase()}</div>
              <p className="text-xs text-text-dim mt-2">{d.description}</p>
              <div className="mt-3 text-[0.6rem] uppercase tracking-widest text-text-dim border-t border-border pt-2">
                Controlled by: <span className={tone}>{(s?.controller || 'unclaimed').toUpperCase()}</span>
              </div>
              <div className="text-[0.6rem] uppercase tracking-widest text-text-dim">
                Passive: <span className="text-accent-gold">{d.passive_income_per_hour}g/hr</span>
              </div>
              <button
                onClick={() => tryContest(d.id)}
                disabled={isYours}
                className="btn btn-blood w-full mt-3"
              >
                {isYours ? 'HELD' : 'CONTEST · 1000g'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
