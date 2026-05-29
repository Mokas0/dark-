import { Link } from 'react-router-dom';
import { useGameStore } from '../state/useGameStore.js';

export function QuickActions({ grimkin }) {
  const harvest = useGameStore((s) => s.harvest);
  const listAsStud = useGameStore((s) => s.listAsStud);

  if (grimkin.status !== 'alive') return null;

  return (
    <div className="opacity-0 group-hover:opacity-100 transition flex flex-wrap gap-1 mt-1">
      <Link to={`/hub/breeding?pick=${grimkin.id}`} className="btn !py-0 !px-1.5 !text-[0.6rem]">
        BREED
      </Link>
      <Link to={`/arena?pick=${grimkin.id}`} className="btn !py-0 !px-1.5 !text-[0.6rem]">
        PIT
      </Link>
      <Link to={`/market?pick=${grimkin.id}`} className="btn !py-0 !px-1.5 !text-[0.6rem]">
        LIST
      </Link>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (grimkin.stats.fertility < 30) return;
          listAsStud({ grimkinId: grimkin.id, feePerBreed: 50 });
        }}
        disabled={grimkin.stats.fertility < 30 || !!grimkin.listed_on}
        className="btn !py-0 !px-1.5 !text-[0.6rem]"
      >
        STUD
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Process ${grimkin.name}? This kills them for parts.`)) harvest(grimkin.id);
        }}
        disabled={!!grimkin.listed_on}
        className="btn btn-blood !py-0 !px-1.5 !text-[0.6rem]"
      >
        PROCESS
      </button>
    </div>
  );
}
