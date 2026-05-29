import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../state/useGameStore.js';
import { GrimkinCard } from '../components/GrimkinCard.jsx';
import { Countdown } from '../components/Countdown.jsx';
import { appraise } from '../lib/grimkin.js';
import { ZONES, zoneById, SATURATION_MAX } from '../lib/zones.js';
import { ITEMS } from '../lib/items.js';

export function Hub() {
  const player = useGameStore((s) => s.player);
  const grimkin = useGameStore((s) => s.grimkin);
  const log = useGameStore((s) => s.log);
  const items = useGameStore((s) => s.items);
  const saturation = useGameStore((s) => s.saturation);
  const scavengeRun = useGameStore((s) => s.scavengeRun);
  const startScavenge = useGameStore((s) => s.startScavenge);
  const completeScavenge = useGameStore((s) => s.completeScavenge);
  const cancelScavenge = useGameStore((s) => s.cancelScavenge);

  const [zoneId, setZoneId] = useState('silt');
  const [loadout, setLoadout] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const liveGrimkin = grimkin.filter((g) => g.status === 'alive');
  const totalValue = liveGrimkin.reduce((sum, g) => sum + appraise(g), 0);
  const runActive = !!scavengeRun;
  const runReady = runActive && scavengeRun.completesAt <= Date.now();
  const activeZone = zoneById(zoneId);

  const toggleLoadout = (id) => {
    setLoadout((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const begin = () => {
    setError(null);
    setLastResult(null);
    const r = startScavenge({ zoneId, loadout });
    if (r?.error) setError(r.error);
    else setLoadout([]);
  };

  const collect = () => {
    setLastResult(completeScavenge());
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 panel p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="label">// OPERATOR</div>
            <h1 className="display-heading text-3xl mt-1">{player.username}</h1>
            <div className="text-xs text-text-dim mt-1">
              Rank {player.rank} · Rep {player.rep_score} · Infamy {player.infamy_score} · Heat {player.heat_level}
              {player.prestige > 0 && (
                <span className="ml-2 text-accent-gold">· P{player.prestige} (+{player.prestige_bonus_pct}%)</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="label">Kennel Holdings</div>
            <div className="text-2xl text-accent-gold tabular-nums">{totalValue.toLocaleString()}g</div>
            <div className="text-[0.65rem] text-text-dim">{liveGrimkin.length} live Grimkin</div>
          </div>
        </div>
      </section>

      <section className="col-span-12 lg:col-span-8 panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="label text-text-primary">// THE STREETS</h2>
          {!runActive && <button onClick={begin} className="btn btn-blood">BEGIN RUN</button>}
          {runActive && !runReady && (
            <div className="flex items-center gap-3">
              <span className="label">RUN ENDS</span>
              <Countdown to={scavengeRun.completesAt} />
              <button onClick={cancelScavenge} className="btn">ABORT</button>
            </div>
          )}
          {runReady && (
            <button onClick={collect} className="btn btn-blood animate-pulse-blood">
              COLLECT
            </button>
          )}
        </div>

        {!runActive && (
          <>
            <div>
              <div className="label mb-1">// PICK A ZONE</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ZONES.map((z) => {
                  const sat = saturation[z.id]?.value ?? SATURATION_MAX;
                  return (
                    <button
                      key={z.id}
                      onClick={() => setZoneId(z.id)}
                      className={`panel-inset p-2 text-left ${
                        zoneId === z.id ? 'border-accent-blood' : ''
                      }`}
                    >
                      <div className={`text-sm ${z.palette}`}>{z.name}</div>
                      <div className="text-[0.6rem] text-text-dim mt-0.5">
                        {Math.round(z.duration_ms / 60000)}m
                      </div>
                      <div className="stat-bar mt-1">
                        <div className="h-full bg-accent-toxic" style={{ width: `${sat}%` }} />
                      </div>
                      <div className="text-[0.55rem] text-text-dim mt-0.5">SAT {Math.round(sat)}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-text-dim mt-2">{activeZone.description}</p>
            </div>

            <div>
              <div className="label mb-1">// LOADOUT</div>
              <div className="flex flex-wrap gap-1">
                {items.map((inv) => {
                  const item = ITEMS[inv.id];
                  if (!item) return null;
                  const picked = loadout.includes(inv.id);
                  return (
                    <button
                      key={inv.id}
                      onClick={() => toggleLoadout(inv.id)}
                      disabled={!picked && inv.quantity <= 0}
                      className={`chip cursor-pointer ${
                        picked ? 'border-accent-blood text-accent-blood' : ''
                      }`}
                      title={item.description}
                    >
                      {item.name} · {inv.quantity}
                    </button>
                  );
                })}
                {items.length === 0 && (
                  <span className="text-xs text-text-dim italic">No loadout items. Visit the shop.</span>
                )}
              </div>
            </div>

            {error && <p className="text-xs text-accent-blood">{error}</p>}
          </>
        )}

        {runActive && !runReady && (
          <p className="text-xs text-text-dim">
            You're out there now. The timer ticks whether you watch the hub or work the rest of your operation.
          </p>
        )}

        {lastResult && (
          <div className="panel-inset p-2 text-xs space-y-1">
            <div className="label">// LAST RUN — {lastResult.zone}</div>
            {lastResult.outcome === 'empty' && (
              <span className="text-text-dim">
                Empty-handed.{lastResult.fled ? ' The catch bolted.' : ''}
              </span>
            )}
            {lastResult.outcome === 'catch' && (
              <span className="text-accent-toxic">Caught a {lastResult.grimkin?.species}.</span>
            )}
            {lastResult.outcome === 'hot_catch' && (
              <span className="text-accent-blood">
                Caught {lastResult.grimkin?.species} — you were seen. +{lastResult.heatBump} heat.
              </span>
            )}
            {lastResult.outcome === 'parts' && (
              <span className="text-accent-void">
                Scavenged {lastResult.part?.quantity}× {lastResult.part?.part_type} (Q{lastResult.part?.quality}).
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {liveGrimkin.slice(0, 4).map((g) => <GrimkinCard key={g.id} grimkin={g} compact />)}
        </div>
        <Link to="/hub/kennel" className="block text-right text-[0.7rem] uppercase tracking-widest text-text-dim hover:text-accent-blood">
          VIEW KENNEL →
        </Link>
      </section>

      <aside className="col-span-12 lg:col-span-4 panel p-4">
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
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Link to="/hub/breeding" className="btn">BREEDING</Link>
          <Link to="/hub/inventory" className="btn">PARTS</Link>
          <Link to="/hub/shop" className="btn">SHOP</Link>
          <Link to="/market" className="btn btn-gold">MARKET</Link>
          <Link to="/black-market" className="btn btn-void">BLACK</Link>
          <Link to="/bounties" className="btn">BOUNTIES</Link>
          <Link to="/arena" className="btn btn-blood">ARENA</Link>
          <Link to="/raids" className="btn btn-blood">RAIDS</Link>
          <Link to="/loans" className="btn">LOANS</Link>
        </div>
      </section>

      <section className="col-span-12 md:col-span-6 panel p-4">
        <h2 className="label text-text-primary">// FACTION STANDINGS</h2>
        <div className="mt-3 space-y-2 text-xs">
          <Standing name="Renderers" pct={20} hue="toxic" />
          <Standing name="Pitmasters" pct={5} hue="blood" />
          <Standing name="Broodlords" pct={0} hue="void" />
        </div>
        {player.defectionPenalty?.ends_at > Date.now() && (
          <p className="text-[0.65rem] text-accent-blood mt-3">
            // Defection penalty active. Hit squad bounties posted.
          </p>
        )}
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
