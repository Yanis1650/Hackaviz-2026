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

/** Années avec ligne + libellé en tête (crises / chocs). */
const HEATMAP_LABELED_YEARS = new Set([2008, 2014, 2022]);

/**
 * @typedef {{ iso3: string, year: number, variation: number|null, ratio: number|null }} HeatmapCellDatum
 */

/**
 * @param {SVGSVGElement} svgEl
 * @param {object} p
 * @param {number} p.width
 * @param {{ years: number[], countries: string[], cells: Array<{ iso3: string, year: number, variation: number|null, ratio: number|null }>, maxAbs: number }} p.matrix
 * @param {boolean} [p.compact]
 * @param {number} [p.activeYear] — colonne surlignée (année timeline / slide).
 * @param {{ show: (ev: PointerEvent, d: HeatmapCellDatum) => void, move: (ev: PointerEvent, d: HeatmapCellDatum) => void, hide: () => void }|undefined} [p.onHeatmapTooltip]
 */
export function renderRatioVariationHeatmap(svgEl, p) {
  const { width, matrix, compact = false, activeYear, onHeatmapTooltip } = p;
  const { years, countries, cells, maxAbs } = matrix;
  const nY = countries.length;
  const margin = compact
    ? { top: 20, right: 4, bottom: 22, left: 30 }
    : MARGIN;
  const innerW = Math.max(60, width - margin.left - margin.right);
  const cellH = compact
    ? Math.min(11, Math.max(6, 200 / Math.max(nY, 1)))
    : Math.min(18, Math.max(8, 280 / Math.max(nY, 1)));
  const innerH = nY * cellH;
  const H = margin.top + innerH + margin.bottom;

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
    root.append('g').attr('class', 'hm-cursor');
    root.append('g').attr('class', 'hm-axis-x');
    root.append('g').attr('class', 'hm-axis-y');
  }
  root.attr('transform', `translate(${margin.left},${margin.top})`);

  if (root.select('.hm-cursor').empty()) {
    root.append('g').attr('class', 'hm-cursor');
  }

  const evG = root.select('.hm-events');
  evG.selectAll('g.hm-ev-group').remove();
  const labelFs = compact ? '7px' : '8px';
  for (const ev of HEATMAP_EVENT_MARKERS) {
    const xi = x(String(ev.year));
    if (xi == null) continue;
    const cx = xi + x.bandwidth() / 2;
    const labeled = HEATMAP_LABELED_YEARS.has(ev.year);
    const g = evG.append('g').attr('class', 'hm-ev-group');
    g.append('line')
      .attr('class', 'hm-ev')
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', labeled ? -2 : -4)
      .attr('y2', innerH + 2)
      .attr(
        'stroke',
        labeled ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)'
      )
      .attr('stroke-dasharray', '3,3')
      .attr('pointer-events', 'none');
    if (labeled) {
      g.append('text')
        .attr('x', cx)
        .attr('y', -9)
        .attr('text-anchor', 'middle')
        .attr('fill', AXIS_TEXT)
        .attr('font-size', labelFs)
        .attr('font-weight', '600')
        .attr('opacity', 0.88)
        .attr('pointer-events', 'none')
        .text(ev.short);
    }
  }

  const cellByKey = new Map(cells.map((c) => [`${c.iso3}|${c.year}`, c]));
  /** @type {HeatmapCellDatum[]} */
  const cellData = countries.flatMap((iso) =>
    years.map((yr) => {
      const c = cellByKey.get(`${iso}|${yr}`);
      return {
        iso3: iso,
        year: yr,
        variation: c?.variation ?? null,
        ratio: c?.ratio ?? null
      };
    })
  );

  const cellG = root.select('.hm-cells');
  cellG
    .selectAll('rect.hm-cell')
    .data(cellData, (d) => `${d.iso3}|${d.year}`)
    .join(
      (enter) =>
        enter
          .append('rect')
          .attr('class', 'hm-cell')
          .attr('rx', 1)
          .attr('ry', 1)
          .attr('pointer-events', 'all'),
      (update) => update.attr('pointer-events', 'all'),
      (exit) => exit.remove()
    )
    .attr('x', (d) => x(String(d.year)) ?? 0)
    .attr('y', (d) => y(d.iso3) ?? 0)
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .style('cursor', 'default')
    .attr('fill', (d) => {
      const v = d.variation;
      if (v == null || !isFinite(v)) return MISSING_FILL;
      return color(v);
    });

  const hmRects = cellG.selectAll('rect.hm-cell');
  hmRects.on('pointerenter.heatmaptip', null);
  hmRects.on('pointermove.heatmaptip', null);
  hmRects.on('pointerleave.heatmaptip', null);

  if (onHeatmapTooltip) {
    hmRects
      .on('pointerenter.heatmaptip', (ev, d) => onHeatmapTooltip.show(ev, d))
      .on('pointermove.heatmaptip', (ev, d) => onHeatmapTooltip.move(ev, d))
      .on('pointerleave.heatmaptip', () => onHeatmapTooltip.hide());
  }

  const cursorG = root.select('.hm-cursor');
  cursorG.selectAll('rect.hm-year-highlight').remove();
  if (activeYear != null && years.includes(activeYear)) {
    const xi = x(String(activeYear));
    if (xi != null) {
      cursorG
        .append('rect')
        .attr('class', 'hm-year-highlight')
        .attr('x', xi)
        .attr('y', 0)
        .attr('width', x.bandwidth())
        .attr('height', innerH)
        .attr('fill', 'rgba(255, 224, 102, 0.14)')
        .attr('stroke', 'rgba(255, 224, 102, 0.5)')
        .attr('stroke-width', compact ? 0.75 : 1)
        .attr('pointer-events', 'none')
        .attr('rx', 1)
        .attr('ry', 1);
    }
  }

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
