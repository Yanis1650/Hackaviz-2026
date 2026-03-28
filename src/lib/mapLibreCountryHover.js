/**
 * Survol pays sur couche MapLibre fill — même phrase que la carte SVG.
 * Garde : ignore les événements si la slide n’est pas l’année active (plusieurs cartes en DOM).
 */

import { EUROPE_FILL_LAYER_ID } from './maplibreChoropleth.js';
import { logMapHover } from './mapHoverDebug.js';

/**
 * @param {import('maplibre-gl').Map} map
 * @param {() => {
 *   year: number,
 *   slideYear: number,
 *   activeTimelineYear: number,
 *   statsData: Record<string, Record<string, { ratio?: number }>>,
 *   countryNames: Map<string, string>|null|undefined,
 *   onHover: (p: { visible: boolean, text?: string, clientX: number, clientY: number }) => void
 * }} getCtx
 * @param {{ debugLabel?: string }} [opts]
 */
export function attachMapLibreCountryHover(map, getCtx, opts = {}) {
  const label = opts.debugLabel ?? '?';
  /** Année timeline globale : ne jamais replier sur l’année de la slide (sinon toutes les cartes passent la garde). */
  const isActiveSlide = (ctx) =>
    typeof ctx.activeTimelineYear === 'number' &&
    !Number.isNaN(ctx.activeTimelineYear) &&
    ctx.slideYear === ctx.activeTimelineYear;

  const onMove = (e) => {
    const ctx = getCtx();
    const f0 = e.features?.[0];
    const isoHint = f0?.properties?.ISO3 ?? '?';
    if (!isActiveSlide(ctx)) {
      map.getCanvas().style.cursor = '';
      logMapHover(
        `skip-${label}-${ctx.slideYear}-${ctx.activeTimelineYear}-${isoHint}`,
        `${label} GARDE: ignoré (slideYear=${ctx.slideYear} activeTimeline=${ctx.activeTimelineYear} typeTimeline=${typeof ctx.activeTimelineYear})`,
        { iso: isoHint }
      );
      return;
    }
    const { onHover, year, statsData, countryNames } = ctx;
    const f = e.features?.[0];
    if (!f?.properties) return;
    const iso = f.properties.ISO3;
    const name =
      countryNames?.get?.(iso) ?? f.properties.NAME ?? iso;
    const s = statsData[String(year)]?.[iso];
    let text = '';
    if (s?.ratio != null && !isNaN(Number(s.ratio))) {
      const pct = (Number(s.ratio) * 100).toFixed(1);
      text = `En ${year}, ${name} a consacré ${pct}% de son budget combiné à la Défense.`;
    } else {
      text = 'Données indisponibles pour ce pays.';
    }
    map.getCanvas().style.cursor = 'pointer';
    logMapHover(
      `ok-${label}-${year}-${iso}`,
      `${label} → onHover`,
      { year, iso, text: text.slice(0, 72) }
    );
    onHover({
      visible: true,
      text,
      clientX: e.originalEvent.clientX,
      clientY: e.originalEvent.clientY
    });
  };

  const onLeave = () => {
    const ctx = getCtx();
    if (!isActiveSlide(ctx)) {
      return;
    }
    map.getCanvas().style.cursor = '';
    logMapHover(`leave-${label}`, `${label} mouseleave → masquer tooltip`);
    ctx.onHover({ visible: false, clientX: 0, clientY: 0 });
  };

  map.on('mousemove', EUROPE_FILL_LAYER_ID, onMove);
  map.on('mouseleave', EUROPE_FILL_LAYER_ID, onLeave);

  return () => {
    map.off('mousemove', EUROPE_FILL_LAYER_ID, onMove);
    map.off('mouseleave', EUROPE_FILL_LAYER_ID, onLeave);
  };
}
