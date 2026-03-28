/**
 * Mini-donuts D3 (Défense / Social) sur les glyphes carte.
 */
import * as d3 from 'd3';

/** Anneau lisible quand outer est faible (pays à forte dépense/hab. compressait trop le disque). */
export function donutInnerRadius(outerR) {
  return Math.max(2.2, Math.min(4, outerR - 4.2));
}

export const DONUT_GLYPH_Y = 10;

export function maxTotalPerCapitaForYear(features, statsData, y, mode = 'per_capita') {
  const key = String(y);
  let m = 0;
  for (const f of features) {
    const s = statsData[key]?.[f.properties.ISO3];
    if (!s) continue;
    const t =
      mode === 'pib_pct'
        ? (Number(s.def_pib) || 0) + (Number(s.soc_pib) || 0)
        : (Number(s.def_pc) || 0) + (Number(s.soc_pc) || 0);
    if (t > m) m = t;
  }
  return m > 0 ? m : 1;
}

export function donutSlicesForFeature(
  feature,
  statsData,
  y,
  outerRadius,
  colorDef,
  colorSoc,
  ratioColorScale
) {
  const iso3 = feature.properties.ISO3;
  const s = statsData[String(y)]?.[iso3];
  if (!s) {
    return { slices: [], outerR: outerRadius, ratioStroke: '#666', total: 0 };
  }
  const defPc = Math.max(0, Number(s.def_pc) || 0);
  const socPc = Math.max(0, Number(s.soc_pc) || 0);
  const total = defPc + socPc;
  const pie = d3.pie().value((d) => d).sort(null)([defPc, socPc]);
  const colors = [colorDef, colorSoc];
  const ir = donutInnerRadius(outerRadius);
  for (let i = 0; i < pie.length; i++) {
    pie[i].innerRadius = ir;
    pie[i].outerRadius = outerRadius;
    pie[i].color = colors[i];
  }
  const ratioStroke =
    s.ratio != null && !isNaN(s.ratio) ? ratioColorScale(s.ratio ?? 0) : '#666';
  return { slices: pie, outerR: outerRadius, ratioStroke, total };
}

export function tweenDonutSlice(slice) {
  return function attrTweenDonut() {
    const el = this;
    const prev = el.__donutPrev || {
      startAngle: slice.startAngle,
      endAngle: slice.startAngle,
      innerRadius: slice.innerRadius,
      outerRadius: Math.max(slice.innerRadius + 2, slice.outerRadius * 0.35)
    };
    const next = {
      startAngle: slice.startAngle,
      endAngle: slice.endAngle,
      innerRadius: slice.innerRadius,
      outerRadius: slice.outerRadius
    };
    const i = d3.interpolate(prev, next);
    return (t) => {
      if (t >= 1) el.__donutPrev = next;
      return d3.arc()(i(t));
    };
  };
}
