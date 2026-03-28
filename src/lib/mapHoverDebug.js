/**
 * Traces survol carte — désactivé par défaut (dev et prod).
 *
 * Activer : localStorage.setItem('hackavizDebugMapHover','1') puis F5,
 * ou ?mapHoverDebug=1, ou VITE_MAP_HOVER_DEBUG=1 au build.
 */

const LS_KEY = 'hackavizDebugMapHover';
const Q_KEY = 'mapHoverDebug';

/** @returns {boolean} */
export function isMapHoverDebug() {
  if (import.meta.env.VITE_MAP_HOVER_DEBUG === '1') return true;
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(LS_KEY) === '1') return true;
    return new URLSearchParams(window.location.search).get(Q_KEY) === '1';
  } catch {
    return false;
  }
}

let _lastAt = 0;
let _lastSig = '';

/**
 * @param {string} signature — clé de throttle (ex. "skip-2015-2002")
 * @param {...unknown} args
 */
export function logMapHover(signature, ...args) {
  if (!isMapHoverDebug()) return;
  const now = Date.now();
  const sig = String(signature);
  if (sig === _lastSig && now - _lastAt < 100) return;
  _lastSig = sig;
  _lastAt = now;
  console.debug('[mapHover]', ...args);
}
