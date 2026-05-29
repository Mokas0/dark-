import { useEffect, useState } from 'react';

export function Countdown({ to, onComplete }) {
  const [remaining, setRemaining] = useState(() => to - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const r = to - Date.now();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [to, onComplete]);

  if (remaining <= 0) return <span className="text-accent-toxic">READY</span>;
  const total = Math.floor(remaining / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return (
    <span className="tabular-nums text-accent-gold">
      {m}:{s}
    </span>
  );
}
