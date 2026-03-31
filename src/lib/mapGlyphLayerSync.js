/**
 * Halos + mini-donnuts carte — projection injectée (D3 geo ou MapLibre project).
 */
import * as d3 from 'd3';
import { HALO_BASE_R } from './constants.js';
import {
  DONUT_GLYPH_Y,
  maxTotalPerCapitaForYear,
  donutSlicesForFeature,
  tweenDonutSlice
} from './mapDonutGlyphs.js';

/**
 * Repositionne les groupes existants (zoom/pan) sans refaire le join données.
 * @param {import('d3-selection').Selection} gGlyphs
 * @param {(feature: GeoJSON.Feature) => [number, number]} projectXY
 */
export function projectGlyphGroups(gGlyphs, projectXY) {
  gGlyphs.selectAll('g.glyph').attr('transform', function (d) {
    const [px, py] = projectXY(/** @type {GeoJSON.Feature} */ (d));
    return `translate(${px},${py})`;
  });
}

/**
 * @param {object} opts
 * @param {import('d3-selection').Selection} opts.gGlyphs
 * @param {(feature: GeoJSON.Feature) => [number, number]} opts.projectXY
 * @param {string|number} opts.year
 * @param {GeoJSON.FeatureCollection} opts.geoData
 * @param {Record<string, Record<string, object>>} opts.statsData
 * @param {(r: number) => string} opts.ratioColorScale
 * @param {string} opts.colorDef
 * @param {string} opts.colorSoc
 * @param {number} opts.transitionMs
 * @param {'per_capita'|'pib_pct'} [opts.metricMode]
 */
export function syncGlyphLayerFull(opts) {
  const {
    gGlyphs,
    projectXY,
    year,
    geoData,
    statsData,
    ratioColorScale,
    colorDef,
    colorSoc,
    transitionMs,
    metricMode: mode = 'per_capita'
  } = opts;
  const y = String(year);

  const features = geoData.features.filter(
    (f) => statsData[y]?.[f.properties.ISO3] !== undefined
  );

  const maxTotal = maxTotalPerCapitaForYear(features, statsData, year, mode);
  const domainMax = maxTotal > 0 ? maxTotal * 1.05 : 1;
  const radiusScale = d3
    .scaleSqrt()
    .domain([0, domainMax])
    .range([8, 26])
    .clamp(true);

  const t = d3.transition().duration(transitionMs).ease(d3.easeCubicOut);

  const groupes = gGlyphs
    .selectAll('g.glyph')
    .data(features, (d) => d.properties.ISO3)
    .join('g')
    .attr('class', 'glyph')
    .attr('transform', (d) => {
      const [px, py] = projectXY(d);
      return `translate(${px},${py})`;
    });

  groupes
    .selectAll('circle.halo')
    .data((d) => [d], (d) => d.properties.ISO3)
    .join('circle')
    .attr('class', 'halo')
    .attr('r', HALO_BASE_R)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(26, 26, 20, 0.28)')
    .each(function (d) {
      const iso3 = d.properties.ISO3;
      const s = statsData[y]?.[iso3];
      if (!s) return;
      const prev = statsData[String(parseInt(y, 10) - 1)]?.[iso3];
      let delta = 0;
      if (prev?.ratio != null && s.ratio != null) {
        delta = Math.abs(s.ratio - prev.ratio);
      }
      d3.select(this)
        .attr('stroke-width', 0.45 + Math.min(delta * 52, 7.5))
        .attr('opacity', 0.3 + Math.min(delta * 3.2, 0.62));
    });

  const mini = groupes
    .selectAll('g.mini-donut')
    .data((d) => [d], (d) => d.properties.ISO3)
    .join('g')
    .attr('class', 'mini-donut')
    .attr('transform', `translate(0,${DONUT_GLYPH_Y})`);

  mini.each(function (d) {
    const s = statsData[y]?.[d.properties.ISO3];
    const total =
      s != null
        ? mode === 'pib_pct'
          ? Math.max(0, Number(s.def_pib) || 0) + Math.max(0, Number(s.soc_pib) || 0)
          : Math.max(0, Number(s.def_pc) || 0) + Math.max(0, Number(s.soc_pc) || 0)
        : 0;
    const outerR = radiusScale(total);

    const { slices, ratioStroke, total: tot } = donutSlicesForFeature(
      d,
      statsData,
      year,
      outerR,
      colorDef,
      colorSoc,
      ratioColorScale
    );

    const gEl = d3.select(this);

    gEl
      .selectAll('circle.donut-back')
      .data([d], (f) => f.properties.ISO3)
      .join(
        (enter) =>
          enter
            .append('circle')
            .attr('class', 'donut-back')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 0)
            .attr('fill', 'rgba(224, 221, 212, 0.96)')
            .attr('stroke', 'rgba(30, 25, 15, 0.35)')
            .attr('stroke-width', 1)
            .attr('opacity', 1),
        (upd) => upd,
        (exit) => exit.remove()
      )
      .call((sel) =>
        sel
          .transition(t)
          .attr('r', outerR + 2.2)
          .attr('stroke', 'rgba(30, 25, 15, 0.35)')
      );

    if (tot <= 1e-9) {
      gEl.selectAll('path.donut-slice').remove();
      return;
    }

    gEl
      .selectAll('path.donut-slice')
      .data(slices, (sl) => sl.index)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('class', 'donut-slice')
            .attr('fill', (sl) => sl.color)
            .attr('stroke', 'rgba(30, 25, 15, 0.35)')
            .attr('stroke-width', 0.45)
            .transition(t)
            .attrTween('d', function (sl) {
              const from = {
                startAngle: sl.startAngle,
                endAngle: sl.startAngle,
                innerRadius: sl.innerRadius,
                outerRadius: sl.outerRadius
              };
              const i = d3.interpolate(from, sl);
              return (u) => {
                if (u >= 1) this.__donutPrev = sl;
                return d3.arc()(i(u));
              };
            }),
        (update) =>
          update
            .attr('fill', (sl) => sl.color)
            .transition(t)
            .attrTween('d', function (sl) {
              return tweenDonutSlice(sl).call(this);
            }),
        (exit) =>
          exit.transition(t).style('opacity', 0).remove()
      );
  });
}
