import { useGameStore } from '../state/useGameStore.js';
import { Countdown } from './Countdown.jsx';

export function StaminaPips() {
  const player = useGameStore((s) => s.player);
  const useStim = useGameStore((s) => s.useStim);
  const items = useGameStore((s) => s.items);
  const stims = items.find((i) => i.id === 'stim')?.quantity ?? 0;

  return (
    <div className="flex items-center gap-2">
      <span className="label">STAMINA</span>
      <div className="flex gap-0.5">
        {Array.from({ length: player.stamina_max }).map((_, i) => (
          <span
            key={i}
            className={`w-2.5 h-2.5 border ${
              i < player.stamina
                ? 'bg-accent-toxic border-accent-toxic'
                : 'bg-bg-deep border-border'
            }`}
          />
        ))}
      </div>
      {player.stamina < player.stamina_max && (
        <span className="text-[0.6rem] text-text-dim">
          (+1 in <Countdown to={player.stamina_regen_at} />)
        </span>
      )}
      {stims > 0 && (
        <button onClick={useStim} className="btn !py-0 !px-1.5 !text-[0.6rem]">
          STIM · {stims}
        </button>
      )}
    </div>
  );
}
