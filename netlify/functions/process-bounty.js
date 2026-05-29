import { serverClient, ok, bad } from './_supabase.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'POST only.');
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return bad(400, 'Invalid JSON.');
  }
  const { bountyId, claimerId, evidence } = payload;
  if (!bountyId || !claimerId) return bad(400, 'bountyId and claimerId required.');

  const supabase = serverClient();
  const { data: bounty, error } = await supabase
    .from('bounties')
    .select('*')
    .eq('id', bountyId)
    .single();
  if (error || !bounty) return bad(404, 'Bounty not found.');
  if (bounty.status !== 'open') return bad(409, 'Bounty not claimable.');

  // Trust check — production would validate the evidence against target_spec.
  // For example, on a capture bounty: verify Grimkin matching the species + rarity
  // is now owned by claimerId.
  if (bounty.bounty_type === 'capture' && evidence?.grimkinId) {
    const { data: g } = await supabase
      .from('grimkin')
      .select('id, species, rarity, owner_id, status')
      .eq('id', evidence.grimkinId)
      .single();
    if (
      !g ||
      g.owner_id !== claimerId ||
      g.species !== bounty.target_spec.species ||
      g.rarity !== bounty.target_spec.rarity ||
      g.status !== 'alive'
    ) {
      return bad(400, 'Evidence does not satisfy bounty spec.');
    }
  }

  await supabase
    .from('bounties')
    .update({ status: 'claimed', claimer_id: claimerId, escrow_held: false })
    .eq('id', bountyId);
  await supabase.rpc('credit_player_gold', { player_id: claimerId, amount: bounty.reward });

  return ok({ ok: true, reward: bounty.reward });
};
