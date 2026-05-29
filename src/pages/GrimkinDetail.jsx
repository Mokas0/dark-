import { Link, useParams } from 'react-router-dom';
import { useGameStore } from '../state/useGameStore.js';
import { GrimkinSprite } from '../components/GrimkinSprite.jsx';
import { LineageTree } from '../components/LineageTree.jsx';
import { appraise } from '../lib/grimkin.js';

export function GrimkinDetail() {
  const { id } = useParams();
  const grimkin = useGameStore((s) => s.grimkin);
  const target = grimkin.find((g) => g.id === id);

  if (!target) {
    return (
      <div className="text-text-dim italic text-sm">
        Grimkin not in your records.{' '}
        <Link to="/hub/kennel" className="text-accent-blood">Return to kennel.</Link>
      </div>
    );
  }

  const lookup = (pid) => grimkin.find((g) => g.id === pid);
  const hasLineage = target.lineage && target.lineage.length > 0;

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 md:col-span-5 panel p-4 space-y-3">
        <div className="crt-overlay inline-block">
          <GrimkinSprite grimkin={target} size={160} />
        </div>
        <div>
          <div className={`text-2xl display-heading rarity-${target.rarity}`}>{target.name}</div>
          <div className="text-xs text-text-dim uppercase tracking-widest">
            {target.species} · {target.rarity} · {target.condition}
          </div>
        </div>
        <div className="text-xs">
          <div>Appraisal: <span className="text-accent-gold">{appraise(target).toLocaleString()}g</span></div>
          <div>Status: {target.status}</div>
          <div>Age: {target.age}d</div>
        </div>
        <div>
          <div className="label mb-1">Traits</div>
          <div className="flex flex-wrap gap-1">
            {target.traits.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </div>
        {target.mutations?.length > 0 && (
          <div>
            <div className="label text-accent-void mb-1">Mutations</div>
            <div className="flex flex-wrap gap-1">
              {target.mutations.map((m) => (
                <span key={m} className="chip border-accent-void/40 text-accent-void">{m}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="col-span-12 md:col-span-7 panel p-4">
        <div className="label">// STATS</div>
        <div className="mt-3 space-y-2">
          {Object.entries(target.stats).map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-xs">
                <span className="uppercase tracking-widest text-text-dim">{k}</span>
                <span className="tabular-nums">{v}</span>
              </div>
              <div className="stat-bar mt-0.5">
                <div className="h-full bg-accent-blood/70" style={{ width: `${Math.min(100, v)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="label">// LINEAGE</div>
          {hasLineage ? (
            <div className="mt-2 overflow-x-auto">
              <LineageTree grimkin={target} lookup={lookup} />
            </div>
          ) : (
            <p className="text-xs text-text-dim italic mt-2">First-generation. No recorded lineage.</p>
          )}
        </div>
      </section>
    </div>
  );
}
