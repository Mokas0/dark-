import { serverClient, ok, bad } from './_supabase.js';
import { harvestYield } from '../../src/lib/grimkin.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'POST only.');
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return bad(400, 'Invalid JSON.');
  }
  const { grimkinId } = payload;
  if (!grimkinId) return bad(400, 'grimkinId required.');

  const supabase = serverClient();
  const { data: g, error } = await supabase
    .from('grimkin')
    .select('*')
    .eq('id', grimkinId)
    .single();
  if (error || !g) return bad(404, 'Grimkin not found.');
  if (g.status !== 'alive' && g.status !== 'dead') return bad(409, 'Cannot harvest.');

  const parts = harvestYield(g);
  await supabase.from('grimkin').update({ status: 'harvested' }).eq('id', g.id);
  await supabase.from('parts_inventory').insert(
    parts.map((p) => ({
      owner_id: g.owner_id,
      source_grimkin_id: g.id,
      source_species: g.species,
      part_type: p.part_type,
      quality: p.quality,
      quantity: p.quantity,
    })),
  );

  return ok({ parts });
};
