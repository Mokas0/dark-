import { serverClient, ok, bad } from './_supabase.js';
import { breedOffspring } from '../../src/lib/grimkin.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'POST only.');
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return bad(400, 'Invalid JSON.');
  }
  const { breedingQueueId } = payload;
  if (!breedingQueueId) return bad(400, 'breedingQueueId required.');

  const supabase = serverClient();
  const { data: entry, error } = await supabase
    .from('breeding_queue')
    .select('id, owner_id, parent1_id, parent2_id, completes_at, status')
    .eq('id', breedingQueueId)
    .single();
  if (error || !entry) return bad(404, 'Breeding queue entry not found.');
  if (entry.status !== 'incubating') return bad(409, 'Already hatched.');
  if (new Date(entry.completes_at).getTime() > Date.now()) return bad(425, 'Not ready.');

  const { data: parents } = await supabase
    .from('grimkin')
    .select('*')
    .in('id', [entry.parent1_id, entry.parent2_id]);
  if (!parents || parents.length !== 2) return bad(404, 'Parent(s) missing.');

  const parentA = parents.find((p) => p.id === entry.parent1_id);
  const parentB = parents.find((p) => p.id === entry.parent2_id);

  const child = breedOffspring({ parentA, parentB, seed: entry.id });
  child.owner_id = entry.owner_id;

  const { data: inserted, error: insertErr } = await supabase
    .from('grimkin')
    .insert({
      owner_id: child.owner_id,
      species: child.species,
      rarity: child.rarity,
      traits: child.traits,
      stats: child.stats,
      condition: child.condition,
      age: 0,
      lineage: child.lineage,
      mutations: child.mutations,
      status: 'alive',
    })
    .select()
    .single();
  if (insertErr) return bad(500, insertErr.message);

  await supabase
    .from('breeding_queue')
    .update({ status: 'hatched', result_grimkin_id: inserted.id })
    .eq('id', breedingQueueId);

  return ok({ child: inserted });
};
