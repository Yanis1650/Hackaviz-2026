/**
 * Échelles de couleur partagées entre les composants.
 */
import * as d3 from 'd3';

/**
 * Choroplèthe (palette claire) : forte défense → tons corail ; social → bleus clairs.
 * Domaine [0.15, 0.08, 0.02] inchangé.
 */
const interpolateMapRatio = d3.interpolateRgbBasis([
  '#c87858',
  '#d89878',
  '#e8b898',
  '#e4e0d4',
  '#c8d8ee',
  '#a0c0e0',
  '#7aa8d8'
]);

export function createRatioScale() {
  return d3.scaleDiverging(interpolateMapRatio).domain([0.15, 0.08, 0.02]);
}
