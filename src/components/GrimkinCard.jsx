import { Link } from 'react-router-dom';
import { GrimkinSprite } from './GrimkinSprite.jsx';
import { appraise, rarityClass, rarityGlow, RARITY_TIERS } from '../lib/grimkin.js';

const STAT_KEYS = [
  { key: 'vitality', label: 'VIT' },
  { key: 'ferocity', label: 'FER' },
  { key: 'fertility', label: 'FRT' },
  { key: 'purity', label: 'PUR' },
  { key: 'toxicity', label: 'TOX' },
];

export function GrimkinCard({ grimkin, footer, compact = false, onClick, selected = false }) {
  const value = appraise(grimkin);
  const rarityTier = RARITY_TIERS.find((t) => t.id === grimkin.rarity);

  return (
    <div
      onClick={onClick}
      className={`panel p-3 flex flex-col gap-2 transition ${rarityGlow(grimkin.rarity)} ${
        onClick ? 'cursor-pointer hover:translate-y-[-2px]' : ''
      } ${selected ? 'outline outline-2 outline-accent-blood' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="crt-overlay">
          <GrimkinSprite grimkin={grimkin} size={compact ? 64 : 88} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={`font-bold truncate ${rarityClass(grimkin.rarity)}`}>{grimkin.name}</h3>
            <span className="text-[0.6rem] uppercase tracking-widest text-text-dim">
              {rarityTier?.name}
            </span>
          </div>
          <p className="label">
            {grimkin.species} · age {grimkin.age}d · {grimkin.condition}
          </p>
          {grimkin.status !== 'alive' && (
            <p className="text-[0.65rem] uppercase tracking-widest text-accent-blood mt-0.5">
              status: {grimkin.status}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {grimkin.traits.slice(0, compact ? 2 : 4).map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
            {grimkin.traits.length > (compact ? 2 : 4) && (
              <span className="chip">+{grimkin.traits.length - (compact ? 2 : 4)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {STAT_KEYS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="label text-[0.55rem]">{label}</span>
            <div className="stat-bar">
              <div
                className="h-full bg-accent-blood/70"
                style={{ width: `${Math.min(100, grimkin.stats[key])}%` }}
              />
            </div>
            <span className="text-[0.6rem] tabular-nums text-text-dim">
              {grimkin.stats[key]}
            </span>
          </div>
        ))}
      </div>

      {grimkin.mutations?.length > 0 && (
        <div className="text-[0.6rem] text-accent-void uppercase tracking-widest">
          MUT: {grimkin.mutations.join(' / ')}
        </div>
      )}

      <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-widest text-text-dim border-t border-border pt-2">
        <span>Appraisal: <span className="text-accent-gold">{value.toLocaleString()}g</span></span>
        <Link
          to={`/grimkin/${grimkin.id}`}
          className="text-text-dim hover:text-accent-blood"
          onClick={(e) => e.stopPropagation()}
        >
          DETAILS →
        </Link>
      </div>

      {footer}
    </div>
  );
}
