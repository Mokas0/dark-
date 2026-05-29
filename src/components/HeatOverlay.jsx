import { useGameStore } from '../state/useGameStore.js';

export function HeatOverlay() {
  const heat = useGameStore((s) => s.player.heat_level);
  if (heat < 60) return null;
  const intensity = Math.min(1, (heat - 60) / 40);
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 mix-blend-screen ${
        heat >= 80 ? 'animate-pulse' : ''
      }`}
      style={{
        boxShadow: `inset 0 0 ${80 + intensity * 120}px rgba(204, 34, 34, ${0.3 + intensity * 0.4})`,
      }}
    />
  );
}
