const FACTIONS = {
  renderers: { name: 'Renderers', color: 'text-accent-toxic border-accent-toxic/40' },
  pitmasters: { name: 'Pitmasters', color: 'text-accent-blood border-accent-blood/40' },
  broodlords: { name: 'Broodlords', color: 'text-accent-void border-accent-void/40' },
};

export function FactionBadge({ faction }) {
  if (!faction) {
    return (
      <span className="chip text-text-dim border-border">UNALIGNED</span>
    );
  }
  const f = FACTIONS[faction];
  if (!f) return null;
  return <span className={`chip ${f.color}`}>{f.name}</span>;
}
