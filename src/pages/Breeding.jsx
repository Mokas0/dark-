import { useMemo, useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { GrimkinCard } from '../components/GrimkinCard.jsx';
import { Countdown } from '../components/Countdown.jsx';
import { MutationRoll } from '../components/MutationRoll.jsx';

export function Breeding() {
  const grimkin = useGameStore((s) => s.grimkin);
  const queue = useGameStore((s) => s.breedingQueue);
  const queueBreed = useGameStore((s) => s.queueBreed);
  const completeBreed = useGameStore((s) => s.completeBreed);
  const dismissBreed = useGameStore((s) => s.dismissBreed);

  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [error, setError] = useState(null);
  const [hatched, setHatched] = useState(null);

  const candidates = useMemo(
    () => grimkin.filter((g) => g.status === 'alive' && !g.listed_on),
    [grimkin],
  );

  const compatible = useMemo(() => {
    if (!a || !b) return null;
    if (a.id === b.id) return { ok: false, reason: 'Same Grimkin selected.' };
    const sharedLineage = new Set([a.id, ...(a.lineage || [])]);
    let penalty = 0;
    for (const id of [b.id, ...(b.lineage || [])]) if (sharedLineage.has(id)) penalty += 15;
    return {
      ok: true,
      penalty,
      averageFertility: Math.round((a.stats.fertility + b.stats.fertility) / 2),
    };
  }, [a, b]);

  const start = () => {
    setError(null);
    if (!a || !b) return setError('Select two Grimkin to pair.');
    if (compatible && !compatible.ok) return setError(compatible.reason);
    const r = queueBreed({ parentAId: a.id, parentBId: b.id });
    if (r?.error) setError(r.error);
    setA(null);
    setB(null);
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 panel p-4">
        <div className="label">// BREEDING MILL</div>
        <h1 className="display-heading text-2xl mt-1">Pair & Incubate</h1>
        <p className="text-xs text-text-dim mt-1">
          Pair fee: 75g. Incubation: 60s (dev). Higher purity yields cleaner offspring.
          The Murk has standards — inbreeding will be detected.
        </p>
      </section>

      <section className="col-span-12 md:col-span-4 panel p-4">
        <div className="label">SLOT A {a ? `· ${a.name}` : ''}</div>
        {a ? (
          <GrimkinCard grimkin={a} compact footer={
            <button onClick={() => setA(null)} className="btn">UNSELECT</button>
          } />
        ) : (
          <p className="text-xs text-text-dim mt-2 italic">Select a Grimkin below.</p>
        )}
      </section>

      <section className="col-span-12 md:col-span-4 panel p-4">
        <div className="label">SLOT B {b ? `· ${b.name}` : ''}</div>
        {b ? (
          <GrimkinCard grimkin={b} compact footer={
            <button onClick={() => setB(null)} className="btn">UNSELECT</button>
          } />
        ) : (
          <p className="text-xs text-text-dim mt-2 italic">Select a Grimkin below.</p>
        )}
      </section>

      <section className="col-span-12 md:col-span-4 panel p-4 space-y-3">
        <div className="label">// PAIR REPORT</div>
        {compatible ? (
          <div className="text-xs space-y-1">
            <div>
              Compat: <span className={compatible.ok ? 'text-accent-toxic' : 'text-accent-blood'}>
                {compatible.ok ? 'ACCEPTED' : 'REJECTED'}
              </span>
            </div>
            {compatible.ok && (
              <>
                <div>Fertility avg: <span className="text-accent-gold">{compatible.averageFertility}</span></div>
                <div>
                  Inbreeding penalty:{' '}
                  <span className={compatible.penalty > 0 ? 'text-accent-blood' : 'text-text-dim'}>
                    {compatible.penalty > 0 ? `-${compatible.penalty} purity` : 'clean'}
                  </span>
                </div>
              </>
            )}
            {!compatible.ok && <div className="text-text-dim">{compatible.reason}</div>}
          </div>
        ) : (
          <p className="text-xs text-text-dim italic">Select two parents.</p>
        )}
        {error && <p className="text-xs text-accent-blood">{error}</p>}
        <button onClick={start} className="btn btn-blood w-full">QUEUE PAIR (75g)</button>
      </section>

      <section className="col-span-12 panel p-4">
        <div className="label mb-3">// INCUBATION QUEUE</div>
        {queue.length === 0 ? (
          <p className="text-xs text-text-dim italic">No pairs incubating.</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((entry) => {
              const ready = entry.completesAt <= Date.now() || entry.status === 'hatched';
              return (
                <li key={entry.id} className="panel-inset p-3 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="text-text-primary">
                      {entry.parentA.name} × {entry.parentB.name}
                    </div>
                    <div className="text-text-dim">
                      {entry.status === 'hatched'
                        ? 'HATCHED — see your kennel.'
                        : <>Ready in <Countdown to={entry.completesAt} /></>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {ready && entry.status !== 'hatched' && (
                      <button
                        onClick={() => setHatched(completeBreed(entry.id))}
                        className="btn btn-blood"
                      >
                        HATCH
                      </button>
                    )}
                    <button onClick={() => dismissBreed(entry.id)} className="btn">DISMISS</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {hatched && (
        <section className="col-span-12 md:col-span-6">
          <MutationRoll child={hatched} />
          <button onClick={() => setHatched(null)} className="btn mt-2">CLOSE REPORT</button>
        </section>
      )}

      <section className="col-span-12 panel p-4">
        <div className="label mb-2">// SELECT FROM KENNEL</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {candidates.map((g) => (
            <GrimkinCard
              key={g.id}
              grimkin={g}
              compact
              selected={a?.id === g.id || b?.id === g.id}
              onClick={() => {
                if (!a) setA(g);
                else if (!b && g.id !== a.id) setB(g);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
