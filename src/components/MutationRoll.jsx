import { motion } from 'framer-motion';

export function MutationRoll({ child }) {
  if (!child) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="panel p-4 border-accent-void/40"
    >
      <div className="label text-accent-void">HATCH REPORT</div>
      <div className="text-lg display-heading mt-1">{child.name}</div>
      <div className="text-xs text-text-dim mt-1">
        {child.species} · <span className={`rarity-${child.rarity}`}>{child.rarity.toUpperCase()}</span>
      </div>
      {child.mutations?.length > 0 && (
        <div className="mt-3 text-sm text-accent-void">
          MUT // {child.mutations.join(' / ')}
        </div>
      )}
      <div className="mt-3 grid grid-cols-5 gap-2 text-[0.65rem]">
        {Object.entries(child.stats).map(([k, v]) => (
          <div key={k} className="text-center">
            <div className="label">{k.slice(0, 3).toUpperCase()}</div>
            <div className="tabular-nums">{v}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
