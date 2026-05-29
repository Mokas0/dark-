import { useMemo } from 'react';
import { mulberry32, seedFromString } from '../lib/rng.js';

// Procedurally generated pixel-ish Grimkin sigil. Deterministic from id+species.
// Renders as an inline SVG — no asset pipeline needed.

const PALETTES = {
  common:      ['#3a3a4a', '#6a6a80', '#cc2222'],
  murk:        ['#1a2a44', '#6fa8dc', '#cc2222'],
  forsaken:    ['#1a2a1f', '#2fc96a', '#cc2222'],
  abyssal:     ['#2a1a3a', '#7a2fc9', '#c9a227'],
  void:        ['#3a0a14', '#cc2222', '#c9a227'],
  singularity: ['#3a2a0a', '#c9a227', '#cc2222'],
};

export function GrimkinSprite({ grimkin, size = 96 }) {
  const cells = useMemo(() => {
    const rng = mulberry32(seedFromString(grimkin.id + grimkin.species));
    const grid = 12;
    const out = [];
    // Symmetric pixel mask.
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid / 2; x++) {
        const on = rng() > 0.55;
        if (!on) continue;
        const tier = rng() < 0.15 ? 2 : rng() < 0.4 ? 1 : 0;
        out.push({ x, y, tier });
        out.push({ x: grid - 1 - x, y, tier });
      }
    }
    return { grid, out };
  }, [grimkin.id, grimkin.species]);

  const palette = PALETTES[grimkin.rarity] ?? PALETTES.common;
  const cell = size / cells.grid;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="block"
      aria-label={`${grimkin.species} sigil`}
    >
      <rect width={size} height={size} fill="#0a0a0f" />
      {cells.out.map((c, i) => (
        <rect
          key={i}
          x={c.x * cell}
          y={c.y * cell}
          width={cell}
          height={cell}
          fill={palette[c.tier]}
        />
      ))}
      {/* scanline overlay */}
      <g opacity="0.25">
        {Array.from({ length: Math.floor(size / 2) }).map((_, i) => (
          <rect key={i} x={0} y={i * 2} width={size} height={1} fill="#000" />
        ))}
      </g>
    </svg>
  );
}
