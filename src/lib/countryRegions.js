/**
 * Typologie géographique simplifiée (ISO3) pour la couleur du nuage de points.
 */

/** @typedef {'baltes'|'nordiques'|'sud'|'coeur'|'atlantique'|'centre'|'autre'} RegionKey */

/** Couleurs lisibles sur fond sombre — distinguables en deutéranopie / protanopie (nuage + légende). */
export const REGION_COLORS = {
  coeur: '#4A90D9',
  nordiques: '#2ECC8A',
  atlantique: '#9B6FD4',
  baltes: '#E8622A',
  sud: '#F0B429',
  centre: '#7CB342',
  autre: '#95A5B8'
};

/** Libellés courts pour la légende UI. */
export const REGION_LABELS_FR = {
  baltes: 'Baltes',
  nordiques: 'Nordiques',
  sud: 'Sud',
  coeur: 'Cœur euro',
  atlantique: 'Atlantique',
  centre: 'Europe de l\'Est',
  autre: 'Autre'
};

/** Codes ISO 3166-1 alpha-2 pour libellés courts sur le nuage. */
export const ISO3_TO_ISO2 = {
  AUT: 'AT',
  BEL: 'BE',
  DEU: 'DE',
  ESP: 'ES',
  EST: 'EE',
  FIN: 'FI',
  FRA: 'FR',
  GRC: 'GR',
  IRL: 'IE',
  ITA: 'IT',
  LTU: 'LT',
  LUX: 'LU',
  LVA: 'LV',
  NLD: 'NL',
  PRT: 'PT',
  SVK: 'SK'
};

/**
 * @param {string} iso3
 * @returns {string}
 */
export function iso2FromIso3(iso3) {
  return ISO3_TO_ISO2[iso3] ?? iso3;
}

/** @type {Record<string, RegionKey>} */
const ISO_TO_REGION = {
  EST: 'baltes',
  LVA: 'baltes',
  LTU: 'baltes',
  FIN: 'nordiques',
  ESP: 'sud',
  ITA: 'sud',
  PRT: 'sud',
  GRC: 'sud',
  DEU: 'coeur',
  FRA: 'coeur',
  AUT: 'coeur',
  BEL: 'coeur',
  NLD: 'coeur',
  IRL: 'atlantique',
  LUX: 'atlantique',
  SVK: 'centre'
};

/**
 * @param {string} iso3
 * @returns {RegionKey}
 */
export function getRegionForIso3(iso3) {
  return ISO_TO_REGION[iso3] ?? 'autre';
}

/**
 * Pays du nuage pour une zone (pour surbrillance carte). « autre » = présents sur la carte hors table.
 * @param {RegionKey} regionKey
 * @param {GeoJSON.FeatureCollection} geoData
 * @returns {string[]}
 */
export function getIso3sForScatterRegion(regionKey, geoData) {
  if (regionKey === 'autre' && geoData?.features?.length) {
    const connus = new Set(Object.keys(ISO_TO_REGION));
    /** @type {string[]} */
    const out = [];
    for (const f of geoData.features) {
      const iso = f.properties?.ISO3;
      if (iso && !connus.has(iso)) out.push(iso);
    }
    return out;
  }
  return Object.entries(ISO_TO_REGION)
    .filter(([, r]) => r === regionKey)
    .map(([iso]) => iso);
}
