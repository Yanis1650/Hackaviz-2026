/**
 * Projection D3 centrée sur l'Europe pour les cartes SVG statiques.
 */
import * as d3 from 'd3';

/**
 * Crée une projection Mercator ajustée aux dimensions fournies.
 * @param {GeoJSON.FeatureCollection} geoData
 * @param {number} width
 * @param {number} height
 * @returns {d3.GeoProjection}
 */
export function createEuropeProjection(geoData, width, height) {
  // fitSize / fitExtent fixent scale + translate : ne pas rappeler translate() après,
  // sinon la carte est décalée (souvent hors du cadre visible).
  /* Marges réduites : Europe plus grande dans le viewBox */
  const margeX = width * 0.018;
  const margeY = height * 0.022;
  return d3.geoMercator().fitExtent(
    [[margeX, margeY], [width - margeX, height - margeY]],
    geoData
  );
}
