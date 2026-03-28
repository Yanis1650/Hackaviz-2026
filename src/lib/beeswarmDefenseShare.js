/**
 * Beeswarm — part Défense dans (Défense + Social), axe 0–20 %, forces D3.
 */
import * as d3 from 'd3';

export const BEESWARM_MARGIN = { top: 4, right: 6, bottom: 20, left: 6 };
/** Hauteur totale cible du SVG (incl. marges). */
export const BEESWARM_SVG_H = 112;
export const NODE_R = 9;
export const X_DOMAIN = [0, 0.2];

/**
 * @param {number} innerW
 * @returns {import('d3-scale').ScaleLinear<number, number>}
 */
export function createShareXScale(innerW) {
  return d3.scaleLinear().domain(X_DOMAIN).range([0, innerW]).clamp(true);
}

/**
 * @param {number} ratio
 * @param {number} meanEu
 * @returns {string}
 */
export function shareNodeColor(ratio, meanEu) {
  return ratio > meanEu
    ? 'var(--color-defense, #e41a1c)'
    : 'var(--color-social, #377eb8)';
}

/** Style discret pour l’axe X (pourcentages). */
function styleAxisGroup(g) {
  g.select('.domain').attr('stroke', 'rgba(255,255,255,0.12)');
  g.selectAll('line').attr('stroke', 'rgba(255,255,255,0.08)');
  g.selectAll('text').attr('fill', '#a1a9bb').attr('font-size', '11px');
}

/**
 * Dessine l’axe 0–20 % sous le nuage.
 * @param {import('d3-selection').Selection<SVGGElement, unknown, null, undefined>} gAxis
 * @param {import('d3-scale').ScaleLinear<number, number>} xScale
 * @param {number} innerH
 */
export function drawShareAxis(gAxis, xScale, innerH) {
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(5)
    .tickFormat((t) => `${Math.round(Number(t) * 100)}%`);
  gAxis.attr('transform', `translate(0,${innerH})`).call(xAxis).call(styleAxisGroup);
}

/**
 * @param {Array<{ ratio: number, x?: number, y?: number }>} nodes
 * @param {import('d3-scale').ScaleLinear<number, number>} xScale
 * @param {number} innerH
 * @param {number} nodeR
 * @param {() => void} onTick
 */
export function runShareSwarmSimulation(nodes, xScale, innerH, nodeR, onTick) {
  const cy = innerH / 2;
  for (const d of nodes) {
    if (d.x == null || isNaN(d.x)) d.x = xScale(d.ratio);
    if (d.y == null || isNaN(d.y)) d.y = cy;
  }
  const sim = d3
    .forceSimulation(nodes)
    .force('x', d3.forceX((d) => xScale(d.ratio)).strength(0.92))
    .force('y', d3.forceY(cy).strength(0.12))
    .force('collide', d3.forceCollide(nodeR + 1.2))
    .alphaDecay(0.022)
    .velocityDecay(0.35);
  sim.on('tick', onTick);
  sim.alpha(1).restart();
  return sim;
}
