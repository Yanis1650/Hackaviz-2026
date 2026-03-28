/**
 * Titres d’axes du nuage défense / social (coordonnées SVG).
 */

/**
 * @param {object} svg — sélection D3 de l’élément SVG racine
 * @param {{ m: { left: number; top: number }; innerW: number; innerH: number; H: number; axisFs: string; axisText: string }} opts
 */
export function updateScatterAxisCaptions(svg, opts) {
  const { m, innerW, innerH, H, axisFs, axisText } = opts;
  let cap = svg.select('text.scatter-cap-x');
  if (cap.empty()) {
    cap = svg
      .append('text')
      .attr('class', 'scatter-cap-x')
      .attr('fill', axisText)
      .attr('font-size', axisFs);
  }
  cap
    .attr('x', m.left + innerW / 2)
    .attr('y', H - 4)
    .attr('text-anchor', 'middle')
    .text('Dépense défense (% PIB)');

  svg.select('text.scatter-cap-y').remove();

  const cx = Math.max(14, m.left - 8);
  const cy = m.top + innerH / 2;

  let gY = svg.select('g.scatter-cap-y-wrap');
  if (gY.empty()) {
    gY = svg.append('g').attr('class', 'scatter-cap-y-wrap');
    gY
      .append('text')
      .attr('class', 'scatter-cap-y')
      .attr('fill', axisText)
      .attr('font-size', axisFs);
  }
  gY.attr('transform', `translate(${cx},${cy})`);
  gY
    .select('text.scatter-cap-y')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text('Social (% PIB)');
}
