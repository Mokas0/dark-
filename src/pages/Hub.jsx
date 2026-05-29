import { Link } from 'react-router-dom';
import { useGameStore } from '../state/useGameStore.js';
import { GrimkinCard } from '../components/GrimkinCard.jsx';
import { appraise } from '../lib/grimkin.js';

export function Hub() {
  const player = useGameStore((s) => s.player);
  const grimkin = useGameStore((s) => s.grimkin);
  const log = useGameStore((s) => s.log);
  const catchWild = useGameStore((s) => s.catchWild);

  const liveGrimkin = grimkin.filter((g) => g.status === 'alive');
  const totalValue = liveGrimkin.reduce((sum, g) => sum + appraise(g), 0);

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="label">// OPERATOR</div>
            <h1 className="display-heading text-3xl mt-1">
              {player.username}
            </h1>
            <div className="text-xs text-text-dim mt-1">
              Rank {player.rank} · Rep {player.rep_score} · Infamy {player.infamy_score} · Heat {player.heat_level}
            </div>
          </div>
          <div className="text-right">
            <div className="label">Kennel Holdings</div>
            <div className="text-2xl text-accent-gold tabular-nums">
              {totalValue.toLocaleString()}g
            </div>
            <div className="text-[0.65rem] text-text-dim">{liveGrimkin.length} live Grimkin</div>
          </div>
        </div>
      </section>

      <section className="col-span-12 md:col-span-8 panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="label text-text-primary">// THE STREETS</h2>
          <button onClick={catchWild} className="btn btn-blood">SCAVENGE</button>
        </div>
        <p className="text-xs text-text-dim leading-relaxed">
          Crawl the alleys. Most strays are common — but the storm sometimes spits up something
          worth gutting. Each scavenge costs nothing but draws no Heat. For now.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {liveGrimkin.slice(0, 4).map((g) => (
            <GrimkinCard key={g.id} grimkin={g} compact />
          ))}
        </div>
        <Link to="/hub/kennel" className="block text-right text-[0.7rem] uppercase tracking-widest text-text-dim hover:text-accent-blood">
          VIEW KENNEL →
        </Link>
      </section>

      <aside className="col-span-12 md:col-span-4 panel p-4">
        <h2 className="label text-text-primary">// LIVE FEED</h2>
        <ul className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {log.length === 0 && (
            <li className="text-xs text-text-dim italic">No transmissions. The wire is quiet.</li>
          )}
          {log.map((entry) => (
            <li key={entry.at} className="text-xs text-text-dim border-l border-border pl-2">
              <span className="text-accent-blood mr-1">[{entry.kind?.toUpperCase()}]</span>
              {entry.message ?? `${entry.delta > 0 ? '+' : ''}${entry.delta}g · ${entry.reason}`}
            </li>
          ))}
        </ul>
      </aside>

      <section className="col-span-12 md:col-span-6 panel p-4">
        <h2 className="label text-text-primary">// QUICK ROUTES</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/hub/breeding" className="btn">BREEDING MILL</Link>
          <Link to="/hub/inventory" className="btn">PARTS LEDGER</Link>
          <Link to="/market" className="btn btn-gold">OPEN MARKET</Link>
          <Link to="/black-market" className="btn btn-void">BLACK MARKET</Link>
          <Link to="/bounties" className="btn">BOUNTY BOARD</Link>
          <Link to="/arena" className="btn btn-blood">ARENA</Link>
        </div>
      </section>

      <section className="col-span-12 md:col-span-6 panel p-4">
        <h2 className="label text-text-primary">// FACTION STANDINGS</h2>
        <div className="mt-3 space-y-2 text-xs">
          <Standing name="Renderers" pct={20} hue="toxic" />
          <Standing name="Pitmasters" pct={5} hue="blood" />
          <Standing name="Broodlords" pct={0} hue="void" />
        </div>
        <p className="text-[0.65rem] text-text-dim mt-3">
          Align with one. Cross another. Pay the price.
        </p>
      </section>
    </div>
  );
}

function Standing({ name, pct, hue }) {
  const bar = { toxic: 'bg-accent-toxic', blood: 'bg-accent-blood', void: 'bg-accent-void' }[hue];
  return (
    <div>
      <div className="flex justify-between">
        <span>{name}</span>
        <span className="text-text-dim tabular-nums">{pct}</span>
      </div>
      <div className="stat-bar mt-0.5">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
