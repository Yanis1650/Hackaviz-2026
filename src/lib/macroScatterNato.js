/**
 * Repère vertical objectif OTAN 2 % du PIB (dépense défense).
 */
const NATO_PCT = 2;

/**
 * @param {object} root — groupe D3 translate(marges)
 * @param {function(number): number} xScale — échelle linéaire X (défense % PIB)
 * @param {number} innerH — hauteur utile du tracé
 */
export function updateNatoReferenceLine(root, xScale, innerH) {
  const [d0, d1] = xScale.domain();
  if (NATO_PCT < d0 || NATO_PCT > d1) return;

  const xi = xScale(NATO_PCT);
  if (!isFinite(xi)) return;

  const stroke = 'rgba(228, 80, 80, 0.9)';
  const fs = '11px';

  let g = root.select('g.scatter-nato');
  if (g.empty()) g = root.append('g').attr('class', 'scatter-nato').attr('pointer-events', 'none');

  let line = g.select('line.nato-line');
  if (line.empty()) {
    line = g.append('line').attr('class', 'nato-line');
  }
  line
    .attr('x1', xi)
    .attr('x2', xi)
    .attr('y1', 0)
    .attr('y2', innerH)
    .attr('stroke', stroke)
    .attr('stroke-width', 1.25)
    .attr('stroke-dasharray', '5,4');

  let txt = g.select('text.nato-cap');
  if (txt.empty()) {
    txt = g.append('text').attr('class', 'nato-cap');
  }
  txt
    .attr('x', xi)
    .attr('y', -3)
    .attr('text-anchor', 'middle')
    .attr('fill', stroke)
    .attr('font-size', fs)
    .attr('font-weight', '600')
    .text('2 % OTAN');
}
