/**
 * Heatmap D3 : variation du ratio Défense/Social par rapport à 2002.
 */
import * as d3 from 'd3';

const MARGIN = { top: 28, right: 6, bottom: 28, left: 34 };
const AXIS_TEXT = '#a1a9bb';
const MISSING_FILL = 'rgba(80,88,110,0.45)';

/** Années marquées (repères historiques discrets). */
export const HEATMAP_EVENT_MARKERS = [
  { year: 2004, short: '2004' },
  { year: 2008, short: '2008' },
  { year: 2014, short: '2014' },
  { year: 2022, short: '2022' }
];

/**
 * @param {SVGSVGElement} svgEl
 * @param {object} p
 * @param {number} p.width
 * @param {{ years: number[], countries: string[], cells: Array<{ iso3: string, year: number, variation: number|null }>, maxAbs: number }} p.matrix
 */
export function renderRatioVariationHeatmap(svgEl, p) {
  const { width, matrix } = p;
  const { years, countries, cells, maxAbs } = matrix;
  const nY = countries.length;
  const innerW = Math.max(60, width - MARGIN.left - MARGIN.right);
  const cellH = Math.min(18, Math.max(8, 280 / Math.max(nY, 1)));
  const innerH = nY * cellH;
  const H = MARGIN.top + innerH + MARGIN.bottom;

  const x = d3.scaleBand().domain(years.map(String)).range([0, innerW]).paddingInner(0.08);
  const y = d3.scaleBand().domain(countries).range([0, innerH]).paddingInner(0.06);

  const M = Math.max(maxAbs, 0.02);
  /* Neutre central plus clair pour se détacher du fond sombre des cartes. */
  const color = d3
    .scaleDiverging(d3.interpolateRgbBasis(['#2d6a4f', '#e8dcc8', '#6a1b0f']))
    .domain([-M, 0, M]);

  const svg = d3.select(svgEl);
  svg.attr('viewBox', `0 0 ${width} ${H}`).attr('width', '100%').attr('height', H);

  let root = svg.select('g.hm-root');
  if (root.empty()) {
    root = svg.append('g').attr('class', 'hm-root');
    root.append('g').attr('class', 'hm-events');
    root.append('g').attr('class', 'hm-cells');
    root.append('g').attr('class', 'hm-axis-x');
    root.append('g').attr('class', 'hm-axis-y');
  }
  root.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  const evG = root.select('.hm-events');
  evG.selectAll('line.hm-ev').remove();
  for (const ev of HEATMAP_EVENT_MARKERS) {
    const xi = x(String(ev.year));
    if (xi == null) continue;
    const cx = xi + x.bandwidth() / 2;
    evG
      .append('line')
      .attr('class', 'hm-ev')
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', -4)
      .attr('y2', innerH + 2)
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .attr('stroke-dasharray', '3,3')
      .attr('pointer-events', 'none');
  }

  const cellMap = new Map(cells.map((c) => [`${c.iso3}|${c.year}`, c.variation]));

  const cellG = root.select('.hm-cells');
  cellG
    .selectAll('rect.hm-cell')
    .data(
      countries.flatMap((iso) => years.map((yr) => ({ iso3: iso, year: yr }))),
      (d) => `${d.iso3}|${d.year}`
    )
    .join(
      (enter) =>
        enter
          .append('rect')
          .attr('class', 'hm-cell')
          .attr('rx', 1)
          .attr('ry', 1),
      (update) => update,
      (exit) => exit.remove()
    )
    .attr('x', (d) => x(String(d.year)) ?? 0)
    .attr('y', (d) => y(d.iso3) ?? 0)
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('fill', (d) => {
      const v = cellMap.get(`${d.iso3}|${d.year}`);
      if (v == null || !isFinite(v)) return MISSING_FILL;
      return color(v);
    });

  const axX = root.select('.hm-axis-x').attr('transform', `translate(0,${innerH})`);
  const tickYears = years.filter((_, i) => i % 4 === 0 || i === years.length - 1);
  axX
    .call(
      d3
        .axisBottom(x)
        .tickValues(tickYears.map(String))
        .tickFormat((t) => String(t))
    )
    .call((g) => {
      g.select('.domain').attr('stroke', 'rgba(255,255,255,0.14)');
      g.selectAll('text').attr('fill', AXIS_TEXT).attr('font-size', '11px');
    });

  const axY = root.select('.hm-axis-y');
  axY
    .call(d3.axisLeft(y).tickSize(0))
    .call((g) => {
      g.select('.domain').remove();
      g.selectAll('text').attr('fill', AXIS_TEXT).attr('font-size', '11px');
    });
}
