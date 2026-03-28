/**
 * Nuage défense (% PIB) × protection sociale (% PIB) — axes fixes, ligne 2 % OTAN, animation année.
 */
import * as d3 from 'd3';
import { REGION_COLORS } from './countryRegions.js';
import { updateScatterAxisCaptions } from './macroScatterCaptions.js';
import { updateNatoReferenceLine } from './macroScatterNato.js';
import { formatPctAxisX, formatPctAxisY } from './scatterPibFormat.js';

export const SCATTER_MARGIN = { top: 10, right: 6, bottom: 36, left: 48 };
export const SCATTER_MARGIN_EMBED = { top: 16, right: 4, bottom: 34, left: 44 };
export const SCATTER_SVG_H = 200;
export const SCATTER_SVG_H_EMBED = 220;

const GRID_STROKE = 'rgba(255,255,255,0.08)';
const AXIS_TEXT = '#a1a9bb';
const DOT_STROKE = 'rgba(255,255,255,0.35)';

/**
 * Ligne d’info pays pour title SVG ou tooltip HTML.
 * @param {{ iso3: string, code2: string, def_pib: number, soc_pib: number }} d
 * @param {Map<string, string>|null|undefined} countryNames
 */
export function ligneLabelScatter(d, countryNames) {
  const nom = countryNames?.get?.(d.iso3);
  const head = nom ? `${nom} (${d.code2})` : d.code2;
  return `${head} — Défense ${d.def_pib.toFixed(1)} % PIB · Social ${d.soc_pib.toFixed(1)} % PIB`;
}

/**
 * @param {SVGSVGElement} svgEl
 * @param {object} p
 * @param {number} p.width
 * @param {number} p.year
 * @param {number} p.transitionMs
 * @param {object} p.statsStore
 * @param {boolean} [p.embedded]
 * @param {string|null|undefined} [p.selectedIso3]
 * @param {(iso3: string) => void} [p.onDotClick]
 * @param {Map<string, string>|null|undefined} [p.countryNames]
 * @param {{ show: (ev: PointerEvent, d: object) => void, move: (ev: PointerEvent, d: object) => void, hide: () => void }|undefined} [p.onScatterTooltip]
 */
export function renderMacroScatterChart(svgEl, p) {
  const {
    width,
    year,
    transitionMs,
    statsStore,
    embedded,
    selectedIso3,
    onDotClick,
    countryNames,
    onScatterTooltip
  } = p;
  const domains = statsStore.getScatterGlobalDomains();
  const rows = statsStore.getScatterRowsForYear(year);

  const m = embedded ? SCATTER_MARGIN_EMBED : SCATTER_MARGIN;
  const H = embedded ? SCATTER_SVG_H_EMBED : SCATTER_SVG_H;
  const dotR = embedded ? 9 : 10;
  const axisFs = '11px';
  const innerW = Math.max(40, width - m.left - m.right);
  const innerH = H - m.top - m.bottom;

  const x = d3
    .scaleLinear()
    .domain([domains.minDef, domains.maxDef])
    .range([0, innerW]);
  const y = d3
    .scaleLinear()
    .domain([domains.minSoc, domains.maxSoc])
    .range([innerH, 0]);

  const svg = d3.select(svgEl);
  svg.attr('viewBox', `0 0 ${width} ${H}`).attr('width', '100%').attr('height', H);

  let root = svg.select('g.scatter-root');
  if (root.empty()) {
    root = svg
      .append('g')
      .attr('class', 'scatter-root')
      .attr('transform', `translate(${m.left},${m.top})`);
    root.append('g').attr('class', 'scatter-grid-x');
    root.append('g').attr('class', 'scatter-grid-y');
    root.append('g').attr('class', 'scatter-axis-x');
    root.append('g').attr('class', 'scatter-axis-y');
    root.append('g').attr('class', 'scatter-dots');
  }

  root.select('.scatter-labels').remove();

  const t =
    transitionMs > 0
      ? d3.transition().duration(transitionMs).ease(d3.easeCubicOut)
      : null;

  const gx = root.select('.scatter-grid-x').attr('transform', `translate(0,${innerH})`);
  gx.call(
    d3.axisBottom(x).ticks(5).tickSize(-innerH).tickFormat(() => '')
  );
  gx.select('.domain').remove();
  gx.selectAll('line').attr('stroke', GRID_STROKE).attr('stroke-dasharray', '2,4');
  gx.selectAll('text').remove();

  const gy = root.select('.scatter-grid-y');
  gy.call(d3.axisLeft(y).ticks(5).tickSize(innerW).tickFormat(() => ''));
  gy.select('.domain').remove();
  gy.selectAll('line').attr('stroke', GRID_STROKE).attr('stroke-dasharray', '2,4');
  gy.selectAll('text').remove();

  const axX = root.select('.scatter-axis-x').attr('transform', `translate(0,${innerH})`);
  axX
    .call(d3.axisBottom(x).ticks(5).tickFormat((v) => formatPctAxisX(v)))
    .call((g) => {
      g.select('.domain').attr('stroke', 'rgba(255,255,255,0.14)');
      g.selectAll('line').remove();
      g.selectAll('text').attr('fill', AXIS_TEXT).attr('font-size', axisFs).attr('dy', '10px');
    });

  const axY = root.select('.scatter-axis-y');
  axY
    .call(d3.axisLeft(y).ticks(5).tickFormat((v) => formatPctAxisY(v)))
    .call((g) => {
      g.select('.domain').remove();
      g.selectAll('line').remove();
      g.selectAll('text').attr('fill', AXIS_TEXT).attr('font-size', axisFs);
    });

  updateNatoReferenceLine(root, x, innerH);

  updateScatterAxisCaptions(svg, { m, innerW, innerH, H, axisFs, axisText: AXIS_TEXT });

  const fillFor = (d) => REGION_COLORS[d.region] ?? REGION_COLORS.autre;
  const strokeFor = (d) =>
    selectedIso3 === d.iso3 ? fillFor(d) : DOT_STROKE;
  const strokeWFor = (d) => (selectedIso3 === d.iso3 ? 2.4 : 1.1);
  const opaFor = (d) => (selectedIso3 === d.iso3 ? 0.92 : 0.58);

  const dotG = root.select('.scatter-dots');
  dotG
    .selectAll('circle.sc-dot')
    .data(rows, (d) => d.iso3)
    .join(
      (enter) =>
        enter
          .append('circle')
          .attr('class', 'sc-dot')
          .attr('r', dotR)
          .attr('cx', (d) => x(d.def_pib))
          .attr('cy', (d) => y(d.soc_pib))
          .attr('fill', fillFor)
          .attr('stroke', (d) => strokeFor(d))
          .attr('stroke-width', (d) => strokeWFor(d))
          .attr('opacity', (d) => opaFor(d))
          .attr('pointer-events', 'all')
          .style('cursor', 'pointer'),
      (update) =>
        update.call((sel) => {
          const u = t ? sel.transition(t) : sel;
          u.attr('r', dotR)
            .attr('cx', (d) => x(d.def_pib))
            .attr('cy', (d) => y(d.soc_pib))
            .attr('fill', fillFor)
            .attr('stroke', (d) => strokeFor(d))
            .attr('stroke-width', (d) => strokeWFor(d))
            .attr('opacity', (d) => opaFor(d));
        }),
      (exit) => exit.remove()
    );

  dotG
    .selectAll('circle.sc-dot')
    .on('click.scatterpt', onDotClick ? (ev, d) => {
      ev.stopPropagation();
      onDotClick(d.iso3);
    } : null);

  const dots = dotG.selectAll('circle.sc-dot');
  dots
    .on('pointerenter.scattertip', onScatterTooltip ? (ev, d) => onScatterTooltip.show(ev, d) : null)
    .on('pointermove.scattertip', onScatterTooltip ? (ev, d) => onScatterTooltip.move(ev, d) : null)
    .on('pointerleave.scattertip', onScatterTooltip ? () => onScatterTooltip.hide() : null);

  dots.each(function (d) {
    const c = d3.select(this);
    c.selectAll('title').remove();
    c.append('title').text(ligneLabelScatter(d, countryNames));
  });
}
