/**
 * Échelles de couleur partagées entre les composants.
 */
import * as d3 from 'd3';

/** Échelle divergente Bleu (social) → Rouge (défense) basée sur le ratio. */
export function createRatioScale() {
  return d3.scaleDiverging(d3.interpolateRdBu).domain([0.15, 0.08, 0.02]);
}
