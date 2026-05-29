import { serverClient, ok, bad } from './_supabase.js';
import { resolveFight } from '../../src/lib/combat.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'POST only.');
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return bad(400, 'Invalid JSON.');
  }
  const { fightId } = payload;
  if (!fightId) return bad(400, 'fightId required.');

  const supabase = serverClient();
  const { data: fight, error } = await supabase
    .from('arena_fights')
    .select('id, arena_type, fighter1_id, fighter2_id, owner1_id, owner2_id, entry_fee, status')
    .eq('id', fightId)
    .single();
  if (error || !fight) return bad(404, 'Fight not found.');
  if (fight.status !== 'pending') return bad(409, 'Fight already resolved.');

  const { data: fighters } = await supabase
    .from('grimkin')
    .select('*')
    .in('id', [fight.fighter1_id, fight.fighter2_id]);
  if (!fighters || fighters.length !== 2) return bad(404, 'Fighter(s) missing.');

  const [a, b] =
    fighters[0].id === fight.fighter1_id ? [fighters[0], fighters[1]] : [fighters[1], fighters[0]];

  const result = resolveFight({
    fighterA: a,
    fighterB: b,
    arenaId: fight.arena_type,
    seed: `${fight.id}|${Date.now()}`,
  });

  await supabase.from('arena_fights').update({ result, status: 'resolved' }).eq('id', fightId);

  // Apply prize + condition changes.
  const winnerOwner = result.winnerId === fight.fighter1_id ? fight.owner1_id : fight.owner2_id;
  await supabase.rpc('credit_player_gold', {
    player_id: winnerOwner,
    amount: result.payouts.winner,
  });

  return ok({ result });
};
