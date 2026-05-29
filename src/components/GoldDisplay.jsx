import { useEffect, useRef, useState } from 'react';

export function GoldDisplay({ gold }) {
  const prev = useRef(gold);
  const [delta, setDelta] = useState(null);

  useEffect(() => {
    if (gold !== prev.current) {
      const d = gold - prev.current;
      setDelta(d);
      prev.current = gold;
      const t = setTimeout(() => setDelta(null), 1500);
      return () => clearTimeout(t);
    }
  }, [gold]);

  return (
    <div className="flex items-center gap-1 text-accent-gold font-mono">
      <span className="text-[0.65rem] uppercase tracking-widest text-text-dim">GOLD</span>
      <span className="tabular-nums text-sm font-bold">{gold.toLocaleString()}</span>
      {delta != null && (
        <span
          className={`text-[0.65rem] tabular-nums ${delta > 0 ? 'text-accent-toxic' : 'text-accent-blood'}`}
        >
          {delta > 0 ? '+' : ''}
          {delta}
        </span>
      )}
    </div>
  );
}
