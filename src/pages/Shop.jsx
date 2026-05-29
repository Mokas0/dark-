import { useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { ITEM_LIST } from '../lib/items.js';

export function Shop() {
  const items = useGameStore((s) => s.items);
  const player = useGameStore((s) => s.player);
  const buyItem = useGameStore((s) => s.buyItem);
  const [msg, setMsg] = useState(null);

  const owned = (id) => items.find((i) => i.id === id)?.quantity ?? 0;

  const buy = (id) => {
    const r = buyItem(id, 1);
    if (r?.error) setMsg(r.error);
    else setMsg(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="label">// SHOP</div>
        <h1 className="display-heading text-2xl mt-1">The Quartermaster</h1>
        <p className="text-xs text-text-dim mt-1">
          Snares, baits, muzzles, listening kits, stims. Pay in coin. No questions.
        </p>
      </div>
      {msg && <p className="text-xs text-accent-blood">{msg}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ITEM_LIST.map((it) => (
          <div key={it.id} className="panel p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-primary uppercase tracking-widest">{it.name}</div>
              <div className="text-[0.65rem] text-text-dim">OWNED: {owned(it.id)}</div>
            </div>
            <p className="text-xs text-text-dim mt-2">{it.description}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-accent-gold tabular-nums">{it.price}g</span>
              <button
                onClick={() => buy(it.id)}
                disabled={player.gold < it.price}
                className="btn btn-gold"
              >
                BUY 1
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
