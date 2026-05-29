// Dynamic part prices — drift over time based on a simple random-walk + a soft
// mean-reversion toward a baseline. Real implementation would feed off actual
// player supply via Supabase; for now this gives the same emergent feeling.

export const PART_BASELINES = {
  organ:   100,
  venom:   140,
  essence: 320,
  bone:    25,
};

export function defaultPriceState() {
  const out = {};
  for (const [k, v] of Object.entries(PART_BASELINES)) {
    out[k] = {
      current: v,
      trend: 0,
      history: [{ at: Date.now(), value: v }],
    };
  }
  return out;
}

export function tickPrices(prices) {
  const out = {};
  for (const [k, v] of Object.entries(PART_BASELINES)) {
    const prev = prices?.[k]?.current ?? v;
    const drift = (Math.random() - 0.5) * 0.08;
    const reversion = (v - prev) * 0.04;
    const next = Math.max(Math.round(v * 0.3), Math.round(prev * (1 + drift) + reversion));
    const history = [...(prices?.[k]?.history ?? []), { at: Date.now(), value: next }].slice(-24);
    out[k] = { current: next, trend: next - prev, history };
  }
  return out;
}

// Sell value calculation that uses dynamic prices.
export function sellValue(part, prices) {
  const basePerUnit = prices?.[part.part_type]?.current ?? PART_BASELINES[part.part_type] ?? 50;
  const qualityFactor = part.quality / 100;
  return Math.round(basePerUnit * qualityFactor * part.quantity);
}
