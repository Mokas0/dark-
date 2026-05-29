import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../state/useGameStore.js';
import { setAudioEnabled, isAudioEnabled } from '../lib/audio.js';

const FACTIONS = [
  { id: 'renderers', name: 'The Renderers', desc: 'Organ harvesters. Better part yields.' },
  { id: 'pitmasters', name: 'The Pitmasters', desc: 'Arena specialists. Reduced entry fees.' },
  { id: 'broodlords', name: 'The Broodlords', desc: 'Breeding mills. Faster incubation.' },
];

export function Profile() {
  const { id } = useParams();
  const player = useGameStore((s) => s.player);
  const insurance = useGameStore((s) => s.insurancePolicies);
  const studs = useGameStore((s) => s.studListings);
  const founders = useGameStore((s) => s.foundersCredit);
  const setFaction = useGameStore((s) => s.setFaction);
  const hardReset = useGameStore((s) => s.hardReset);
  const retireForPrestige = useGameStore((s) => s.retireForPrestige);

  const [audio, setAudio] = useState(isAudioEnabled());
  const [msg, setMsg] = useState(null);

  if (id !== player.id) {
    return <p className="text-text-dim text-sm italic">Profile not found in your network.</p>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="panel p-4">
        <div className="label">// OPERATOR FILE</div>
        <h1 className="display-heading text-3xl mt-1">{player.username}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
          <Stat label="Gold" value={player.gold.toLocaleString()} hue="text-accent-gold" />
          <Stat label="Rep" value={player.rep_score} />
          <Stat label="Infamy" value={player.infamy_score} hue="text-accent-void" />
          <Stat label="Heat" value={player.heat_level} hue="text-accent-blood" />
          <Stat label="Rank" value={player.rank} />
          <Stat label="Prestige" value={`P${player.prestige}`} hue="text-accent-gold" />
          <Stat label="Raid Lic." value={player.raid_licenses} hue="text-accent-blood" />
          <Stat label="Vendettas" value={player.vendetta_tokens} hue="text-accent-void" />
        </div>
      </div>

      <div className="panel p-4">
        <div className="label">// FACTION ALIGNMENT</div>
        <p className="text-xs text-text-dim mt-2">
          Pick a faction. Defect and the old faction posts a hit squad bounty on you.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {FACTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFaction(f.id === player.faction ? null : f.id)}
              className={`panel-inset p-3 text-left ${
                player.faction === f.id ? 'border-accent-blood' : ''
              }`}
            >
              <div className="text-sm">{f.name}</div>
              <div className="text-[0.65rem] text-text-dim mt-1">{f.desc}</div>
              {player.faction === f.id && (
                <div className="text-[0.65rem] text-accent-blood mt-2">// ALIGNED</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <div className="label">// INSURANCE POLICIES</div>
        {insurance.length === 0 ? (
          <p className="text-xs text-text-dim italic mt-2">No active policies.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-xs">
            {insurance.map((p) => (
              <li key={p.id} className="py-2 flex justify-between">
                <span>{p.grimkin_name}</span>
                <span className="text-text-dim">{p.premium_per_day}g/day · payout {p.payout}g</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel p-4">
        <div className="label">// STUD LISTINGS</div>
        {studs.length === 0 ? (
          <p className="text-xs text-text-dim italic mt-2">No active stud listings.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-xs">
            {studs.map((s) => (
              <li key={s.id} className="py-2 flex justify-between">
                <span>{s.grimkin_snapshot.name} · {s.grimkin_snapshot.rarity}</span>
                <span className="text-accent-gold">{s.fee_per_breed}g/breed · used {s.breeds_used}×</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel p-4">
        <div className="label">// FOUNDER CREDITS</div>
        {founders.length === 0 ? (
          <p className="text-xs text-text-dim italic mt-2">No bloodlines on record yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-xs max-h-48 overflow-y-auto pr-1">
            {founders.slice(0, 20).map((f, i) => (
              <li key={i} className="py-1.5 flex justify-between text-text-dim">
                <span><span className="text-accent-gold">{f.founder_name}</span> → {f.descendant_name}</span>
                <span>{new Date(f.at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel p-4">
        <div className="label">// PRESTIGE</div>
        <p className="text-xs text-text-dim mt-2">
          At Rank 50 (Kingpin), retire your operator. Reset your run with a permanent
          bonus. Each Prestige adds 5% to all gold gains and starting wealth.
        </p>
        <button
          onClick={() => {
            const r = retireForPrestige();
            if (r?.error) setMsg(r.error);
          }}
          disabled={player.rank < 50}
          className="btn btn-gold mt-3"
        >
          RETIRE (P{player.prestige} → P{player.prestige + 1})
        </button>
        {msg && <p className="text-xs text-accent-blood mt-2">{msg}</p>}
      </div>

      <div className="panel p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="label">// SETTINGS</div>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={audio}
              onChange={(e) => { setAudioEnabled(e.target.checked); setAudio(e.target.checked); }}
            />
            Audio
          </label>
          <button
            onClick={() => { if (confirm('Wipe local progress?')) hardReset(); }}
            className="btn"
          >
            HARD RESET
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hue = 'text-text-primary' }) {
  return (
    <div className="panel-inset p-2">
      <div className="label">{label}</div>
      <div className={`text-lg tabular-nums ${hue}`}>{value}</div>
    </div>
  );
}
