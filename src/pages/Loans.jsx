import { useState } from 'react';
import { useGameStore } from '../state/useGameStore.js';
import { Countdown } from '../components/Countdown.jsx';

export function Loans() {
  const player = useGameStore((s) => s.player);
  const grimkin = useGameStore((s) => s.grimkin);
  const loans = useGameStore((s) => s.loans);
  const takeLoan = useGameStore((s) => s.takeLoan);
  const repayLoan = useGameStore((s) => s.repayLoan);

  const [principal, setPrincipal] = useState('300');
  const [collateralId, setCollateralId] = useState('');
  const [msg, setMsg] = useState(null);

  const eligible = grimkin.filter((g) => g.status === 'alive' && !g.listed_on);

  const take = () => {
    setMsg(null);
    if (!collateralId) return setMsg('Pick collateral.');
    const r = takeLoan({ principal: Number(principal), collateralGrimkinId: collateralId });
    if (r?.error) setMsg(r.error);
    else { setPrincipal('300'); setCollateralId(''); }
  };

  const repay = (id) => {
    const r = repayLoan(id);
    if (r?.error) setMsg(r.error);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="label text-accent-gold">// LOAN SHARKS</div>
        <h1 className="display-heading text-2xl mt-1">Borrow Black</h1>
        <p className="text-xs text-text-dim mt-1">
          {Math.round(0.15 * 100)}% interest. 30 minutes to repay. Default and your collateral walks.
        </p>
      </div>

      <div className="panel p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="label mb-1">Principal</div>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm tabular-nums"
          />
        </div>
        <div>
          <div className="label mb-1">Collateral</div>
          <select
            value={collateralId}
            onChange={(e) => setCollateralId(e.target.value)}
            className="w-full bg-bg-deep border border-border px-2 py-1.5 text-sm"
          >
            <option value="">— Choose —</option>
            {eligible.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.species} · {g.rarity}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <button onClick={take} className="btn btn-gold w-full">BORROW</button>
          {msg && <p className="text-xs text-accent-blood mt-2">{msg}</p>}
        </div>
      </div>

      <div className="panel p-4">
        <div className="label mb-2">// ACTIVE LOANS</div>
        {loans.length === 0 ? (
          <p className="text-xs text-text-dim italic">No loans on record.</p>
        ) : (
          <ul className="divide-y divide-border">
            {loans.map((l) => {
              const owed = Math.round(l.principal * (1 + l.interest_pct));
              return (
                <li key={l.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <div>{l.principal}g → owed {owed}g · {l.collateral_name}</div>
                    <div className="text-text-dim">
                      {l.status === 'active' && <>Due in <Countdown to={l.due_at} /></>}
                      {l.status === 'repaid' && <span className="text-accent-toxic">REPAID</span>}
                      {l.status === 'defaulted' && <span className="text-accent-blood">DEFAULTED — collateral seized</span>}
                    </div>
                  </div>
                  {l.status === 'active' && (
                    <button onClick={() => repay(l.id)} className="btn btn-gold">REPAY · {owed}g</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
