/**
 * Survol des pays sur la carte D3 — phrase dynamique (% budget combiné Défense).
 */

/**
 * @param {import('d3-selection').Selection} gPays — groupe contenant les path pays
 * @param {() => {
 *   year: number,
 *   statsData: Record<string, Record<string, { ratio?: number }>>,
 *   countryNames: Map<string, string>|null|undefined,
 *   onHover: (p: { visible: boolean, text?: string, clientX: number, clientY: number }) => void
 * }} getCtx
 */
export function attachMapCountryHover(gPays, getCtx) {
  gPays
    .selectAll('path')
    .on('pointerenter.mapct', function (event, d) {
      const { year, statsData, countryNames, onHover } = getCtx();
      const iso = d.properties.ISO3;
      const s = statsData[String(year)]?.[iso];
      const name =
        countryNames?.get?.(iso) ?? d.properties.NAME ?? iso;
      let text = '';
      if (s?.ratio != null && !isNaN(Number(s.ratio))) {
        const pct = (Number(s.ratio) * 100).toFixed(1);
        text = `En ${year}, ${name} a consacré ${pct}% de son budget combiné à la Défense.`;
      } else {
        text = 'Données indisponibles pour ce pays.';
      }
      onHover({
        visible: true,
        text,
        clientX: event.clientX,
        clientY: event.clientY
      });
    })
    .on('pointermove.mapct', function (event) {
      const { onHover } = getCtx();
      onHover({
        visible: true,
        clientX: event.clientX,
        clientY: event.clientY
      });
    })
    .on('pointerleave.mapct', function () {
      const { onHover } = getCtx();
      onHover({ visible: false, clientX: 0, clientY: 0 });
    });
}

/**
 * Retire les écouteurs ajoutés par attachMapCountryHover.
 * @param {import('d3-selection').Selection} gPays
 */
export function detachMapCountryHover(gPays) {
  gPays
    .selectAll('path')
    .on('pointerenter.mapct', null)
    .on('pointermove.mapct', null)
    .on('pointerleave.mapct', null);
}
