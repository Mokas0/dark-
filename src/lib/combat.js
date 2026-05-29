import { mulberry32, rollInt, seedFromString } from './rng.js';

export const ARENAS = [
  { id: 'pit',         name: 'The Pit',         entry: 10,  prize: 20,    lethal: false, rankBoost: 1 },
  { id: 'syndicate',   name: 'Syndicate Ring',  entry: 100, prize: 220,   lethal: false, rankBoost: 5 },
  { id: 'death',       name: 'Death Circuit',   entry: 500, prize: 1300,  lethal: true,  rankBoost: 15 },
  { id: 'colosseum',   name: 'Grand Colosseum', entry: 0,   prize: 8000,  lethal: true,  rankBoost: 50 },
];

export function resolveFight({ fighterA, fighterB, arenaId, seed }) {
  const arena = ARENAS.find((a) => a.id === arenaId) ?? ARENAS[0];
  const seedStr = seed ?? `${fighterA.id}|${fighterB.id}|${Date.now()}`;
  const rng = mulberry32(seedFromString(seedStr));

  const rounds = [];
  let hpA = fighterA.stats.vitality * 3;
  let hpB = fighterB.stats.vitality * 3;

  const startHpA = hpA;
  const startHpB = hpB;

  let round = 0;
  while (hpA > 0 && hpB > 0 && round < 12) {
    round += 1;
    const swingA = Math.round(fighterA.stats.ferocity * (0.6 + rng() * 0.8));
    const swingB = Math.round(fighterB.stats.ferocity * (0.6 + rng() * 0.8));
    hpB -= swingA;
    hpA -= swingB;
    rounds.push({ round, swingA, swingB, hpA: Math.max(0, hpA), hpB: Math.max(0, hpB) });
  }

  let winner = hpA >= hpB ? fighterA : fighterB;
  let loser = winner === fighterA ? fighterB : fighterA;

  // Scarring & death.
  const damageRatioWinner = 1 - Math.max(0, winner === fighterA ? hpA : hpB) / (winner === fighterA ? startHpA : startHpB);
  const damageRatioLoser = 1 - Math.max(0, loser === fighterA ? hpA : hpB) / (loser === fighterA ? startHpA : startHpB);

  const result = {
    arenaId,
    winnerId: winner.id,
    loserId: loser.id,
    rounds,
    payouts: {
      winner: arena.prize,
      loser: 0,
    },
    winnerCondition: damageRatioWinner > 0.7 ? 'Scarred' : 'Pristine',
    loserCondition: arena.lethal
      ? (rollInt(rng, 1, 100) <= 70 ? 'dead' : 'Broken')
      : (damageRatioLoser > 0.85 ? 'Broken' : 'Scarred'),
  };
  return result;
}
