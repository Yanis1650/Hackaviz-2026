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

  const yLabX = Math.max(10, m.left - 20);
  const yLabY = m.top + innerH / 2;
  let capY = svg.select('text.scatter-cap-y');
  if (capY.empty()) {
    capY = svg
      .append('text')
      .attr('class', 'scatter-cap-y')
      .attr('fill', axisText)
      .attr('font-size', axisFs);
  }
  capY
    .attr('transform', `rotate(-90,${yLabX},${yLabY})`)
    .attr('x', yLabX)
    .attr('y', yLabY)
    .attr('text-anchor', 'middle')
    .text('Protection sociale (% PIB)');
}
