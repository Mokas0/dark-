import { useEffect, useRef } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { sfx } from '../lib/audio.js';

const KIND_COLOR = {
  listing: 'text-accent-gold',
  bounty: 'text-accent-blood',
  flavor: 'text-text-dim',
  raid: 'text-accent-blood',
  sabotage: 'text-accent-void',
  district: 'text-accent-toxic',
  default: 'text-accent-void',
  warden: 'text-accent-blood',
  prestige: 'text-accent-gold',
  defection: 'text-accent-blood',
};

export function TickerFeed() {
  const ticker = useGameStore((s) => s.ticker);
  const tickWorld = useGameStore((s) => s.tickWorld);
  const tickPrices = useGameStore((s) => s.tickPrices);
  const tickSaturation = useGameStore((s) => s.tickSaturation);
  const tickStud = useGameStore((s) => s.tickStudIncome);
  const tickLoans = useGameStore((s) => s.tickLoans);
  const tickIncome = useGameStore((s) => s.tickDistrictIncome);
  const seenIds = useRef(new Set());

  useEffect(() => {
    const t = setInterval(() => {
      tickWorld();
      tickPrices();
      tickSaturation();
      tickStud();
      tickLoans();
      tickIncome();
    }, 5000);
    return () => clearInterval(t);
  }, [tickWorld, tickPrices, tickSaturation, tickStud, tickLoans, tickIncome]);

  useEffect(() => {
    if (!ticker.length) return;
    const newest = ticker[0];
    if (!seenIds.current.has(newest.id)) {
      seenIds.current.add(newest.id);
      if (seenIds.current.size > 200) {
        seenIds.current = new Set(ticker.slice(0, 30).map((t) => t.id));
      }
      sfx.ticker();
    }
  }, [ticker]);

  if (!ticker.length) return null;
  const newest = ticker[0];
  const color = KIND_COLOR[newest.kind] || KIND_COLOR.default;
  return (
    <div className="border-t border-border bg-bg-deep/70 text-[0.7rem] uppercase tracking-widest overflow-hidden">
      <div className={`max-w-[1400px] mx-auto px-4 py-1 ${color} truncate`}>
        // {newest.message}
      </div>
    </div>
  );
}
