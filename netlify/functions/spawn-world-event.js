import { serverClient, ok, bad } from './_supabase.js';

const EVENT_TYPES = [
  { kind: 'murk_storm',    label: 'Murk Storm — wild spawn rate x2',         duration_min: 120 },
  { kind: 'black_flush',   label: 'Black Flush — listing fees nullified',     duration_min: 30 },
  { kind: 'pit_night',     label: 'Pit Night — arena prizes tripled',         duration_min: 90 },
  { kind: 'warden_sweep',  label: 'Warden Sweep — black market offline',      duration_min: 15 },
  { kind: 'singularity',   label: 'Singularity Sighting — wild legendary',    duration_min: 20 },
];

// Designed to be triggered by Netlify scheduled functions (cron).
// Adds an entry to world_events table; clients subscribe via Supabase Realtime.

export const handler = async () => {
  let supabase;
  try {
    supabase = serverClient();
  } catch (e) {
    return bad(500, e.message);
  }
  const e = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + e.duration_min * 60_000);
  const { data, error } = await supabase
    .from('world_events')
    .insert({ kind: e.kind, label: e.label, starts_at: startsAt, ends_at: endsAt })
    .select()
    .single();
  if (error) return bad(500, error.message);
  return ok({ event: data });
};
