import { useMemo } from 'react';
import { useGameStore, sellValue } from '../state/useGameStore.js';
import { PART_BASELINES } from '../lib/prices.js';

const PART_COLORS = {
  venom: 'text-accent-toxic',
  organ: 'text-accent-blood',
  essence: 'text-accent-void',
  bone: 'text-text-dim',
};

export function Inventory() {
  const parts = useGameStore((s) => s.parts);
  const prices = useGameStore((s) => s.prices);
  const adjustGold = useGameStore((s) => s.adjustGold);

  const grouped = useMemo(() => {
    const out = {};
    for (const p of parts) {
      const key = p.part_type;
      if (!out[key]) out[key] = [];
      out[key].push(p);
    }
    return out;
  }, [parts]);

  const sellPart = (p) => {
    const price = sellValue(p, prices);
    adjustGold(price, `Sold ${p.quantity}× ${p.part_type}`);
    useGameStore.setState((s) => ({ parts: s.parts.filter((x) => x.id !== p.id) }));
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="label">// INVENTORY</div>
        <h1 className="display-heading text-2xl mt-1">Parts Ledger</h1>
        <p className="text-xs text-text-dim mt-1">
          Renderers pay by quality. Sell cheap, sell often — or stockpile for the event window.
        </p>
      </div>

      <div className="panel p-4">
        <div className="label">// LIVE PRICES</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {Object.keys(PART_BASELINES).map((k) => {
            const p = prices[k];
            return (
              <div key={k} className="panel-inset p-2">
                <div className={`label ${PART_COLORS[k] || ''}`}>{k.toUpperCase()}</div>
                <div className="text-lg tabular-nums text-accent-gold">{p?.current ?? '—'}g</div>
                <div
                  className={`text-[0.6rem] tabular-nums ${
                    (p?.trend ?? 0) >= 0 ? 'text-accent-toxic' : 'text-accent-blood'
                  }`}
                >
                  {(p?.trend ?? 0) >= 0 ? '+' : ''}
                  {p?.trend ?? 0}/tick
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {parts.length === 0 && (
        <p className="text-xs text-text-dim italic">
          No parts. Process Grimkin in the kennel to begin a yield record.
        </p>
      )}

      {Object.entries(grouped).map(([type, list]) => (
        <section key={type} className="panel p-4">
          <h2 className={`label ${PART_COLORS[type] || ''}`}>// {type.toUpperCase()}</h2>
          <ul className="mt-2 divide-y divide-border">
            {list.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <div className="text-text-primary">
                    {p.quantity}× <span className={PART_COLORS[type]}>{p.part_type}</span> ({p.source_species})
                  </div>
                  <div className="text-text-dim">
                    Quality {p.quality} · src: {p.source_species}
                  </div>
                </div>
                <button onClick={() => sellPart(p)} className="btn btn-gold">
                  SELL · {sellValue(p, prices).toLocaleString()}g
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
