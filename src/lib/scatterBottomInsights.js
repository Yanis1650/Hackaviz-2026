/**
 * Top variations défense / PIB (points de %) depuis 2002 — bandeau sous le scatter.
 */

import { getRegionForIso3, iso2FromIso3 } from './countryRegions.js';

export const REF_YEAR = 2002;

/** @param {unknown} v */
function nombreValide(v) {
  return typeof v === 'number' && !isNaN(v) && isFinite(v);
}

/**
 * @param {ReturnType<typeof import('./statsStore.js').createStatsStore>} statsStore
 * @param {string|number} year
 * @param {number} [n]
 * @returns {Array<{ iso3: string, code2: string, region: string, deltaPp: number, defPibYear: number }>}
 */
export function getTopDefensePibDeltaRows(statsStore, year, n = 5) {
  const y = Number(year);
  const data = statsStore.getData();
  const base = data[String(REF_YEAR)] ?? {};
  const cur = data[String(y)] ?? {};
  /** @type {Array<{ iso3: string, code2: string, region: string, deltaPp: number, defPibYear: number }>} */
  const rows = [];

  for (const iso3 of Object.keys(base)) {
    const d0 = base[iso3]?.def_pib;
    const d1 = cur[iso3]?.def_pib;
    if (!nombreValide(d0) || !nombreValide(d1)) continue;
    const deltaPp = d1 - d0;
    rows.push({
      iso3,
      code2: iso2FromIso3(iso3),
      region: getRegionForIso3(iso3),
      deltaPp,
      defPibYear: d1
    });
  }

  rows.sort((a, b) => b.deltaPp - a.deltaPp);
  return rows.slice(0, n);
}

/**
 * Domaine max pour l’axe des barres (évite barres invisibles en début de période).
 * @param {Array<{ deltaPp: number }>} rows
 * @param {number} [floorMin]
 */
export function getMaxDeltaForScale(rows, floorMin = 0.35) {
  const m = rows.reduce((acc, r) => Math.max(acc, r.deltaPp), 0);
  return Math.max(m, floorMin);
}
