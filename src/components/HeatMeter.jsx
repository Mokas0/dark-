export function HeatMeter({ heat }) {
  const pct = Math.min(100, Math.max(0, heat));
  const color =
    pct < 25 ? 'bg-accent-toxic' : pct < 60 ? 'bg-accent-gold' : 'bg-accent-blood';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.65rem] uppercase tracking-widest text-text-dim">HEAT</span>
      <div className="w-20 h-1.5 bg-bg-deep border border-border overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[0.65rem] tabular-nums text-text-dim">{pct}</span>
    </div>
  );
}
