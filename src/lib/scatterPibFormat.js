/**
 * Formatage des axes pour le nuage en % du PIB.
 */

/** @param {number} v */
export function formatPctAxisX(v) {
  const n = Number(v);
  if (!isFinite(n)) return '';
  return `${n.toFixed(1)} %`;
}

/** @param {number} v */
export function formatPctAxisY(v) {
  const n = Number(v);
  if (!isFinite(n)) return '';
  if (Math.abs(n - Math.round(n)) < 0.05) return `${Math.round(n)} %`;
  return `${n.toFixed(1)} %`;
}
