import { useEffect, useState } from 'react';

const EVENTS = [
  { id: 'storm', label: 'MURK STORM — wild spawn rate doubled. 2h window.', color: 'text-accent-void' },
  { id: 'flush', label: 'BLACK FLUSH — listing fees nullified. 30m window.', color: 'text-accent-toxic' },
  { id: 'pit',   label: 'PIT NIGHT — arena prizes tripled. Spectator bets hot.', color: 'text-accent-blood' },
  { id: 'sweep', label: 'WARDEN SWEEP — black market offline. Lay low.', color: 'text-accent-gold' },
];

// Rotates a flavor banner so the world feels alive. The real world-event system
// would come from Supabase + a cron-driven Netlify function.

export function WorldEventBanner() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % EVENTS.length), 12000);
    return () => clearInterval(t);
  }, []);

  const e = EVENTS[idx];
  return (
    <div className="border-t border-border bg-bg-deep/70 text-[0.7rem] uppercase tracking-widest overflow-hidden">
      <div className={`max-w-[1400px] mx-auto px-4 py-1 ${e.color} animate-flicker`}>
        // {e.label}
      </div>
    </div>
  );
}
