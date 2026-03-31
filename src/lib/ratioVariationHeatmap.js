/**
 * Heatmap D3 : variation du ratio Défense/Social par rapport à 2002.
 */
import * as d3 from 'd3';
import { TIMELINE_EVENTS } from './narration.js';

const MARGIN = { top: 6, right: 6, bottom: 8, left: 39 };
const AXIS_TEXT = '#5a5648';
const MISSING_FILL = 'rgba(138, 130, 120, 0.45)';

/** Lignes d’événements : ton terne lisible sur heatmap claire. */
const HM_EV_LINE = '#5a5040';

/**
 * @typedef {{ iso3: string, year: number, variation: number|null, ratio: number|null, def_pib: number|null, soc_pib: number|null, code2: string }} HeatmapCellDatum
 */

/**
 * @param {SVGSVGElement} svgEl
 * @param {object} p
 * @param {number} p.width
 * @param {{ years: number[], countries: string[], cells: Array<{ iso3: string, year: number, variation: number|null, ratio: number|null, def_pib?: number|null, soc_pib?: number|null, code2?: string }>, maxAbs: number }} p.matrix
 * @param {boolean} [p.compact]
 * @param {number} [p.activeYear] — colonne surlignée (année timeline / slide).
 * @param {string|null|undefined} [p.highlightedIso3] — ligne pays (ex. clic carte).
 * @param {{ show: (ev: PointerEvent, d: HeatmapCellDatum) => void, move: (ev: PointerEvent, d: HeatmapCellDatum) => void, hide: () => void }|undefined} [p.onHeatmapTooltip]
 */
export function renderRatioVariationHeatmap(svgEl, p) {
  const { width, matrix, compact = false, activeYear, highlightedIso3, onHeatmapTooltip } = p;
  const { years, countries, cells, maxAbs } = matrix;
  const nY = countries.length;
  const margin = compact
    ? { top: 4, right: 4, bottom: 6, left: 35 }
    : MARGIN;
  /** Espace sous l’axe des années : ticks + libellés années + repères événements (sans chevauchement). */
  const footerH = compact ? 44 : 52;
  const innerW = Math.max(60, width - margin.left - margin.right);
  const cellH = compact
    ? Math.min(13, Math.max(6, 200 / Math.max(nY, 1)))
    : Math.min(18, Math.max(8, 280 / Math.max(nY, 1)));
  const innerH = nY * cellH;
  const H = margin.top + innerH + footerH + margin.bottom;

  const x = d3.scaleBand().domain(years.map(String)).range([0, innerW]).paddingInner(0.08);
  const y = d3.scaleBand().domain(countries).range([0, innerH]).paddingInner(0.06);

  const M = Math.max(maxAbs, 0.02);
  const color = d3
    .scaleDiverging(
      d3.interpolateRgbBasis([
        '#cad4bc',
        '#aec49a',
        '#96b282',
        '#7ea06a',
        '#d4d0be',
        '#e4c4a8',
        '#d8aa88',
        '#cc9068',
        '#be7648'
      ])
    )
    .domain([-M, 0, M]);

  const svg = d3.select(svgEl);
  svg.attr('viewBox', `0 0 ${width} ${H}`).attr('width', '100%').attr('height', H);

  let root = svg.select('g.hm-root');
  if (root.empty()) {
    root = svg.append('g').attr('class', 'hm-root');
    root.append('g').attr('class', 'hm-cells');
    root.append('g').attr('class', 'hm-events');
    root.append('g').attr('class', 'hm-history');
    root.append('g').attr('class', 'hm-cursor');
    root.append('g').attr('class', 'hm-axis-x');
    root.append('g').attr('class', 'hm-axis-y');
    root.append('g').attr('class', 'hm-ev-foot');
  }
  if (root.select('.hm-ev-foot').empty()) {
    root.append('g').attr('class', 'hm-ev-foot');
  }
  root.attr('transform', `translate(${margin.left},${margin.top})`);

  if (root.select('.hm-history').empty()) {
    root.insert('g', '.hm-cursor').attr('class', 'hm-history');
  }

  if (root.select('.hm-cursor').empty()) {
    root.append('g').attr('class', 'hm-cursor');
  }

  const cellByKey = new Map(cells.map((c) => [`${c.iso3}|${c.year}`, c]));
  /** Libellés axe Y : ISO 3166-1 alpha-2 (plus court que ISO3, lisible dans la marge). */
  const code2First = new Map();
  for (const c of cells) {
    const c2 = c.code2?.trim();
    if (c2 && !code2First.has(c.iso3)) code2First.set(c.iso3, c2.toUpperCase());
  }
  const yTickLabel = new Map(countries.map((iso) => [iso, code2First.get(iso) ?? iso]));
  /** @type {HeatmapCellDatum[]} */
  const cellData = countries.flatMap((iso) =>
    years.map((yr) => {
      const c = cellByKey.get(`${iso}|${yr}`);
      return {
        iso3: iso,
        year: yr,
        variation: c?.variation ?? null,
        ratio: c?.ratio ?? null,
        def_pib: c?.def_pib ?? null,
        soc_pib: c?.soc_pib ?? null,
        code2: c?.code2 ?? ''
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
    .style('cursor', 'pointer')
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

  /* Lignes verticales événements (pleine hauteur de la grille). */
  const evG = root.select('.hm-events');
  evG.selectAll('g.hm-ev-group').remove();
  const yearSet = new Set(years);

  for (const ev of TIMELINE_EVENTS) {
    if (!yearSet.has(ev.year)) continue;
    const xi = x(String(ev.year));
    if (xi == null) continue;
    const cx = xi + x.bandwidth() / 2;
    const g = evG.append('g').attr('class', 'hm-ev-group');
    g.append('line')
      .attr('class', 'hm-ev')
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', HM_EV_LINE)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', compact ? 1.65 : 2)
      .attr('stroke-dasharray', '10,7')
      .attr('stroke-linecap', 'round')
      .attr('pointer-events', 'none');
  }

  const histG = root.select('.hm-history');
  histG.selectAll('*').remove();
  if (highlightedIso3 && countries.includes(highlightedIso3)) {
    /** @type {{ x: number, y: number }[]} */
    const trailPts = [];
    for (const yr of years) {
      const c = cellByKey.get(`${highlightedIso3}|${yr}`);
      const ok = c && c.ratio != null && isFinite(c.ratio);
      if (!ok) continue;
      const xi = x(String(yr));
      const yi = y(highlightedIso3);
      if (xi == null || yi == null) continue;
      trailPts.push({
        x: xi + x.bandwidth() / 2,
        y: yi + y.bandwidth() / 2
      });
    }
    if (trailPts.length >= 2) {
      const line = d3
        .line()
        .x((d) => d.x)
        .y((d) => d.y);
      histG
        .append('path')
        .attr('class', 'hm-history-line')
        .attr('d', line(trailPts))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(26, 26, 20, 0.35)')
        .attr('stroke-width', compact ? 1 : 1.2)
        .attr('pointer-events', 'none');
    }
    const dotR = compact ? 2.1 : 3.1;
    histG
      .selectAll('circle.hm-history-dot')
      .data(trailPts)
      .join('circle')
      .attr('class', 'hm-history-dot')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', dotR)
      .attr('fill', '#f5f3ee')
      .attr('stroke', 'rgba(26, 26, 20, 0.35)')
      .attr('stroke-width', compact ? 0.55 : 0.8)
      .attr('pointer-events', 'none');
  }

  const cursorG = root.select('.hm-cursor');
  cursorG.selectAll('rect.hm-year-highlight').remove();
  cursorG.selectAll('rect.hm-country-highlight').remove();
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
        .attr('fill', 'rgba(26, 26, 20, 0.07)')
        .attr('stroke', 'rgba(26, 26, 20, 0.32)')
        .attr('stroke-width', compact ? 0.75 : 1)
        .attr('pointer-events', 'none')
        .attr('rx', 1)
        .attr('ry', 1);
    }
  }
  if (highlightedIso3 && countries.includes(highlightedIso3)) {
    const yi = y(highlightedIso3);
    const bh = y.bandwidth();
    if (yi != null && bh > 0) {
      cursorG
        .append('rect')
        .attr('class', 'hm-country-highlight')
        .attr('x', 0)
        .attr('y', yi)
        .attr('width', innerW)
        .attr('height', bh)
        .attr('fill', 'rgba(30, 25, 15, 0.1)')
        .attr('stroke', 'rgba(30, 25, 15, 0.45)')
        .attr('stroke-width', compact ? 1.35 : 2.05)
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
        .tickSize(4)
        .tickPadding(5)
    )
    .call((g) => {
      g.select('.domain').attr('stroke', 'rgba(26,26,20,0.14)');
      g.selectAll('text')
        .attr('fill', AXIS_TEXT)
        .attr('font-size', compact ? '10px' : '10.5px')
        .attr('font-weight', '600');
    });

  const axY = root.select('.hm-axis-y');
  axY
    .call(
      d3
        .axisLeft(y)
        .tickSize(0)
        .tickFormat((d) => yTickLabel.get(String(d)) ?? String(d))
    )
    .call((g) => {
      g.select('.domain').remove();
      g.selectAll('text').attr('fill', AXIS_TEXT).attr('font-size', '11px');
    });

  /* Libellés + petits triangles sous la grille (sous les années d’axe). */
  const footG = root.select('.hm-ev-foot');
  footG.selectAll('*').remove();
  const markerFill = '#5a5040';
  const markerLabel = '#3a3028';
  const capFs = '9px';
  const triW = compact ? 6 : 7;
  /* Sous les libellés d’années (~fin vers innerH+21), puis triangle et légende événement. */
  const triTipY = innerH + (compact ? 22 : 23);
  const triBaseY = innerH + (compact ? 30 : 32);
  const labelY = innerH + (compact ? 38 : 40);

  for (const ev of TIMELINE_EVENTS) {
    if (!yearSet.has(ev.year)) continue;
    const xi = x(String(ev.year));
    if (xi == null) continue;
    const cx = xi + x.bandwidth() / 2;
    const g = footG.append('g').attr('class', 'hm-ev-foot-item');

    g.append('path')
      .attr(
        'd',
        `M ${cx} ${triTipY} L ${cx - triW} ${triBaseY} L ${cx + triW} ${triBaseY} Z`
      )
      .attr('fill', markerFill)
      .attr('opacity', 0.92)
      .attr('pointer-events', 'none');

    g.append('text')
      .attr('x', cx)
      .attr('y', labelY)
      .attr('text-anchor', 'middle')
      .attr('fill', markerLabel)
      .attr('font-size', capFs)
      .attr('font-weight', '700')
      .attr('letter-spacing', '0.02em')
      .attr('pointer-events', 'none')
      .text(ev.label);
  }

  /* Cellules en dessous, lignes pointillées au-dessus de la grille ; axes puis légendes événements. */
  for (const sel of [
    '.hm-cells',
    '.hm-events',
    '.hm-history',
    '.hm-cursor',
    '.hm-axis-x',
    '.hm-axis-y',
    '.hm-ev-foot'
  ]) {
    root.select(sel).raise();
  }
}
