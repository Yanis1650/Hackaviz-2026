/**
 * Carte Europe MapLibre — fond océan neutre, choroplèthe via feature-state (pas de tuiles externes).
 */
import * as d3 from 'd3';

export const EUROPE_SOURCE_ID = 'europe-countries';
export const EUROPE_FILL_LAYER_ID = 'europe-fill';
export const EUROPE_LINE_LAYER_ID = 'europe-line';
export const EUROPE_HIGHLIGHT_LINE_LAYER_ID = 'europe-highlight-line';

/** Filtre initial : aucun pays n’a cet ISO3 (syntaxe héritée : 2e arg = nom de propriété string). */
const HIGHLIGHT_FILTER_NONE = ['==', 'ISO3', '__HACKAVIZ_NONE__'];

/** Style minimal : fond océan / hors zone (neutre vs page #f5f3ee). */
export function createEmptyDarkStyle() {
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#d8d4c8' }
      }
    ]
  };
}

/**
 * @param {GeoJSON.FeatureCollection} geoData
 * @returns {[[number, number], [number, number]]}
 */
export function boundsLngLatFromGeo(geoData) {
  const b = d3.geoBounds(geoData);
  return [
    [b[0][0], b[0][1]],
    [b[1][0], b[1][1]]
  ];
}

/**
 * @param {import('maplibre-gl').Map} map
 * @param {GeoJSON.FeatureCollection} geoData
 */
export function addEuropeChoroplethSourceAndLayers(map, geoData) {
  map.addSource(EUROPE_SOURCE_ID, {
    type: 'geojson',
    data: geoData,
    promoteId: 'ISO3'
  });

  map.addLayer({
    id: EUROPE_FILL_LAYER_ID,
    type: 'fill',
    source: EUROPE_SOURCE_ID,
    paint: {
      'fill-color': ['coalesce', ['feature-state', 'c'], '#e0ddd4'],
      'fill-opacity': 0.94
    }
  });

  map.addLayer({
    id: EUROPE_LINE_LAYER_ID,
    type: 'line',
    source: EUROPE_SOURCE_ID,
    paint: {
      'line-color': 'rgba(26, 26, 20, 0.22)',
      'line-width': 0.9
    }
  });

  map.addLayer({
    id: EUROPE_HIGHLIGHT_LINE_LAYER_ID,
    type: 'line',
    source: EUROPE_SOURCE_ID,
    filter: HIGHLIGHT_FILTER_NONE,
    paint: {
      'line-color': '#2a2620',
      'line-width': 2.8,
      'line-opacity': 1
    }
  });
  map.setLayoutProperty(EUROPE_HIGHLIGHT_LINE_LAYER_ID, 'visibility', 'none');
}

/**
 * Contours pays (légende, point scatter ou clic carte).
 * @param {import('maplibre-gl').Map} map
 * @param {null | { iso3s: string[], color: string }} spec
 */
export function applyMapOutlineHighlight(map, spec) {
  if (!map.getLayer(EUROPE_HIGHLIGHT_LINE_LAYER_ID)) return;
  if (!spec || spec.iso3s.length === 0) {
    map.setLayoutProperty(EUROPE_HIGHLIGHT_LINE_LAYER_ID, 'visibility', 'none');
    map.setFilter(EUROPE_HIGHLIGHT_LINE_LAYER_ID, HIGHLIGHT_FILTER_NONE);
    return;
  }
  const parts = spec.iso3s.map((iso) => ['==', 'ISO3', iso]);
  map.setFilter(EUROPE_HIGHLIGHT_LINE_LAYER_ID, ['any', ...parts]);
  map.setPaintProperty(EUROPE_HIGHLIGHT_LINE_LAYER_ID, 'line-color', spec.color);
  map.setLayoutProperty(EUROPE_HIGHLIGHT_LINE_LAYER_ID, 'visibility', 'visible');
}

/**
 * @param {import('maplibre-gl').Map} map
 * @param {GeoJSON.FeatureCollection} geoData
 * @param {Record<string, Record<string, { ratio?: number }>>} statsData
 * @param {string|number} year
 * @param {(r: number) => string} ratioColorScale
 */
export function applyFillFeatureStates(
  map,
  geoData,
  statsData,
  year,
  ratioColorScale
) {
  const y = String(year);
  for (const f of geoData.features) {
    const iso = f.properties?.ISO3;
    if (!iso) continue;
    const s = statsData[y]?.[iso];
    const c =
      s?.ratio != null && !isNaN(Number(s.ratio))
        ? ratioColorScale(Number(s.ratio))
        : '#e0ddd4';
    try {
      map.setFeatureState({ source: EUROPE_SOURCE_ID, id: iso }, { c });
    } catch {
      /* id absent ou source pas prête */
    }
  }
}
