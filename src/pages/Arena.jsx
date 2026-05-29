import { useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { ARENAS } from '../lib/combat.js';
import { GrimkinCard } from '../components/GrimkinCard.jsx';

export function Arena() {
  const grimkin = useGameStore((s) => s.grimkin);
  const sendToArena = useGameStore((s) => s.sendToArena);
  const history = useGameStore((s) => s.arenaHistory);
  const player = useGameStore((s) => s.player);

  const [arena, setArena] = useState(ARENAS[0]);
  const [selected, setSelected] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const eligible = grimkin.filter((g) => g.status === 'alive' && !g.listed_on);

  const fight = () => {
    if (!selected) return;
    if (player.gold < arena.entry) return;
    const r = sendToArena({ grimkinId: selected.id, arenaId: arena.id });
    setLastResult(r);
    setSelected(null);
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12">
        <div className="label text-accent-blood">// ARENA</div>
        <h1 className="display-heading text-2xl mt-1">Bloodsport</h1>
        <p className="text-xs text-text-dim mt-1">
          Your Grimkin fights. You watch. You collect. Or you bury them.
        </p>
      </section>

      <section className="col-span-12 md:col-span-4 panel p-4 space-y-3">
        <div className="label">// PICK A TIER</div>
        <div className="space-y-2">
          {ARENAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setArena(a)}
              className={`w-full text-left panel-inset p-2 ${
                arena.id === a.id ? 'border-accent-blood' : ''
              }`}
            >
              <div className="text-sm flex justify-between">
                <span>{a.name}</span>
                <span className="text-accent-gold tabular-nums">{a.entry}g</span>
              </div>
              <div className="text-[0.65rem] text-text-dim">
                Prize {a.prize}g · {a.lethal ? 'LETHAL' : 'non-lethal'}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="col-span-12 md:col-span-4 panel p-4 space-y-3">
        <div className="label">// FIGHTER</div>
        {selected ? (
          <>
            <GrimkinCard grimkin={selected} compact />
            <button onClick={() => setSelected(null)} className="btn">UNSELECT</button>
          </>
        ) : (
          <p className="text-xs text-text-dim italic">Pick from the kennel below.</p>
        )}
        <button
          onClick={fight}
          disabled={!selected || player.gold < arena.entry}
          className="btn btn-blood w-full"
        >
          ENTER · {arena.entry}g
        </button>
      </section>

      <section className="col-span-12 md:col-span-4 panel p-4">
        <div className="label">// LAST FIGHT</div>
        {lastResult ? (
          <div className="text-xs space-y-1 mt-2">
            <div>
              Arena: <span className="text-accent-blood">{arena.name}</span>
            </div>
            <div>
              Result:{' '}
              <span
                className={
                  lastResult.result.winnerId === lastResult.mine.id
                    ? 'text-accent-toxic'
                    : 'text-accent-blood'
                }
              >
                {lastResult.result.winnerId === lastResult.mine.id ? 'WIN' : 'LOSS'}
              </span>
            </div>
            <div>Rounds: {lastResult.result.rounds.length}</div>
            <ul className="text-[0.65rem] text-text-dim mt-2 max-h-32 overflow-y-auto pr-1">
              {lastResult.result.rounds.map((r) => (
                <li key={r.round}>
                  R{r.round} · A swung {r.swingA} · B swung {r.swingB} · hp {r.hpA}/{r.hpB}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-text-dim italic mt-2">No fight on record.</p>
        )}
      </section>

      <section className="col-span-12 panel p-4">
        <div className="label">// SELECT FIGHTER</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {eligible.map((g) => (
            <GrimkinCard
              key={g.id}
              grimkin={g}
              compact
              onClick={() => setSelected(g)}
              selected={selected?.id === g.id}
            />
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="col-span-12 panel p-4">
          <div className="label">// FIGHT HISTORY</div>
          <ul className="mt-2 divide-y divide-border">
            {history.slice(0, 10).map((h) => (
              <li key={h.id} className="py-2 text-xs flex justify-between">
                <span>{h.mine.name} @ {h.arenaId}</span>
                <span
                  className={
                    h.result.winnerId === h.mine.id ? 'text-accent-toxic' : 'text-accent-blood'
                  }
                >
                  {h.result.winnerId === h.mine.id ? 'WIN' : 'LOSS'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
