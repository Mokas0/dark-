import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Renders a 3-generation ancestor tree using d3.hierarchy. The current Grimkin
// is the root; lineage is walked up via the local kennel index.

export function LineageTree({ grimkin, lookup }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const buildNode = (g, depth) => {
      const parents = (g.lineage || []).map((pid) => lookup(pid)).filter(Boolean);
      return {
        name: g.name,
        rarity: g.rarity,
        children: depth > 0 ? parents.map((p) => buildNode(p, depth - 1)) : undefined,
      };
    };

    const data = buildNode(grimkin, 2);

    const width = 360;
    const dx = 28;
    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().nodeSize([dx, 90]);
    treeLayout(root);

    let minX = Infinity, maxX = -Infinity;
    root.each((d) => {
      if (d.x < minX) minX = d.x;
      if (d.x > maxX) maxX = d.x;
    });
    const height = maxX - minX + dx * 2;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', [0, minX - dx, width, height]).attr('width', width).attr('height', height);

    const g = svg.append('g').attr('font-family', 'JetBrains Mono, monospace').attr('font-size', 10);

    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#2a2a3a')
      .attr('stroke-width', 1)
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x((d) => d.y)
          .y((d) => d.x),
      );

    const node = g
      .append('g')
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', (d) => `translate(${d.y},${d.x})`);

    node
      .append('circle')
      .attr('r', 4)
      .attr('fill', (d) => rarityColor(d.data.rarity));

    node
      .append('text')
      .attr('dx', 8)
      .attr('dy', 3)
      .attr('fill', '#e8e0d0')
      .text((d) => d.data.name);
  }, [grimkin, lookup]);

  return <svg ref={ref} className="block" />;
}

function rarityColor(r) {
  return (
    {
      common: '#6a6a80',
      murk: '#6fa8dc',
      forsaken: '#2fc96a',
      abyssal: '#7a2fc9',
      void: '#cc2222',
      singularity: '#c9a227',
    }[r] ?? '#6a6a80'
  );
}
