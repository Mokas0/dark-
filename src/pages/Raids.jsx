import { useEffect, useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';

export function Raids() {
  const player = useGameStore((s) => s.player);
  const raidTargets = useGameStore((s) => s.raidTargets);
  const raidHistory = useGameStore((s) => s.raidHistory);
  const spawnRaidTargets = useGameStore((s) => s.spawnRaidTargets);
  const executeRaid = useGameStore((s) => s.executeRaid);
  const buyRaidLicense = useGameStore((s) => s.buyRaidLicense);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (raidTargets.length === 0) spawnRaidTargets();
  }, [raidTargets.length, spawnRaidTargets]);

  const raid = (id) => {
    const r = executeRaid(id);
    if (r?.error) setMsg(r.error);
    else {
      setMsg(r.success ? 'HIT' : 'FAILED');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="label text-accent-blood">// RAIDS</div>
        <h1 className="display-heading text-2xl mt-1">Kennel Hits</h1>
        <p className="text-xs text-text-dim mt-1">
          Spend a license. Hit another operator's kennel. On success, lift a Grimkin.
          On failure, take heat and earn a Vendetta Token.
        </p>
      </div>

      <div className="panel p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs">
          <div>Raid Licenses: <span className="text-accent-blood">{player.raid_licenses}</span></div>
          <div>Vendetta Tokens: <span className="text-accent-void">{player.vendetta_tokens}</span></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const r = buyRaidLicense(); if (r?.error) setMsg(r.error); }} className="btn btn-blood">
            BUY LICENSE · 250g
          </button>
          <button onClick={spawnRaidTargets} className="btn">REFRESH TARGETS</button>
        </div>
      </div>

      {msg && <p className="text-xs text-accent-blood">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {raidTargets.map((t) => (
          <div key={t.id} className="panel p-4">
            <div className="label">// TARGET</div>
            <div className="text-sm mt-1">{t.target_name}</div>
            <div className="text-[0.65rem] text-text-dim uppercase tracking-widest">
              {t.target_faction} · difficulty {t.difficulty}/5
            </div>
            <div className="mt-2 text-xs text-text-dim">
              Kennel: {t.kennel.length} Grimkin · top rarity {topRarity(t.kennel)}
            </div>
            <button
              onClick={() => raid(t.id)}
              disabled={player.raid_licenses <= 0}
              className="btn btn-blood w-full mt-3"
            >
              EXECUTE
            </button>
          </div>
        ))}
      </div>

      {raidHistory.length > 0 && (
        <div className="panel p-4">
          <div className="label mb-2">// RAID LOG</div>
          <ul className="divide-y divide-border text-xs">
            {raidHistory.slice(0, 10).map((h) => (
              <li key={h.id} className="py-2 flex justify-between">
                <span>{h.target_name}</span>
                <span className={h.success ? 'text-accent-toxic' : 'text-accent-blood'}>
                  {h.success ? `+${h.taken?.name}` : 'FAILED'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function topRarity(kennel) {
  const order = ['singularity', 'void', 'abyssal', 'forsaken', 'murk', 'common'];
  for (const r of order) {
    if (kennel.find((g) => g.rarity === r)) return r.toUpperCase();
  }
  return 'COMMON';
}
