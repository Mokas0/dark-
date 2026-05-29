import { useParams } from 'react-router-dom';
import { useGameStore } from '../state/useGameStore.js';

const FACTIONS = [
  { id: 'renderers', name: 'The Renderers', desc: 'Organ harvesters. Better part yields.' },
  { id: 'pitmasters', name: 'The Pitmasters', desc: 'Arena specialists. Reduced entry fees.' },
  { id: 'broodlords', name: 'The Broodlords', desc: 'Breeding mills. Faster incubation, better mutations.' },
];

export function Profile() {
  const { id } = useParams();
  const player = useGameStore((s) => s.player);
  const setFaction = useGameStore((s) => s.setFaction);
  const hardReset = useGameStore((s) => s.hardReset);

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
        </div>
      </div>

      <div className="panel p-4">
        <div className="label">// FACTION ALIGNMENT</div>
        <p className="text-xs text-text-dim mt-2">
          Pick a faction. You can play all three at a cost — but you can only wear one badge at a time.
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
        <div className="label">// DEV CONTROLS</div>
        <button
          onClick={() => {
            if (confirm('Wipe local progress?')) hardReset();
          }}
          className="btn mt-2"
        >
          HARD RESET
        </button>
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
