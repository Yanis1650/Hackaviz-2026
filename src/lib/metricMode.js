/**
 * Mode d'affichage des métriques volumétriques.
 * 'per_capita' → €/habitant (valeurs nominales).
 * 'pib_pct'    → % du PIB (comparable dans le temps, inflation-neutre).
 */
import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<'per_capita'|'pib_pct'>} */
export const metricMode = writable('per_capita');

/** Bascule entre les deux modes. */
export function basculerMetrique() {
  metricMode.update((m) => (m === 'per_capita' ? 'pib_pct' : 'per_capita'));
}
