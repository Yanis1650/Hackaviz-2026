/**
 * Données narratives par grandes périodes géopolitiques.
 * Export pur, sans manipulation DOM.
 */

export const NARRATION = [
  {
    id: 'paix',
    annees: [2002, 2007],
    accent: '#4a9eff',
    titreCourt: 'Dividendes paix',
    accroche:
      "L'Europe investit massivement dans la protection sociale. " +
      'Les budgets de défense sont au plus bas historique.',
    titre: "L'ère des dividendes de la paix · 2002–2007",
    texte:
      "L'Europe investit massivement dans la protection sociale. " +
      'Les budgets de défense sont au plus bas historique en proportion ' +
      'de la richesse nationale.'
  },
  {
    id: 'crise',
    annees: [2008, 2013],
    accent: '#f59e0b',
    titreCourt: 'Crise dettes',
    accroche:
      'La protection sociale absorbe le choc de la crise ; la défense reste variable d’ajustement sous austérité.',
    titre: 'La crise des dettes souveraines · 2008–2013',
    texte:
      'La protection sociale absorbe le choc de la crise financière. ' +
      "La défense reste une variable d'ajustement sous pression " +
      "des politiques d'austérité."
  },
  {
    id: 'reveil',
    annees: [2014, 2021],
    accent: '#f97316',
    titreCourt: 'Réveil Balte',
    accroche:
      'Premier bascule à l’Est : les Baltes voient la part défense augmenter face à la nouvelle donne sécuritaire.',
    titre: "Le réveil balte & l'annexion de la Crimée · 2014–2021",
    texte:
      "Un premier point de bascule. Observez l'Europe de l'Est et les " +
      'États baltes : le rouge commence à se densifier face à la nouvelle ' +
      'donne sécuritaire russe.'
  },
  {
    id: 'rearmement',
    annees: [2022, 2024],
    accent: '#e41a1c',
    titreCourt: 'Réarmement',
    accroche:
      'La guerre en Europe impose une rupture : les budgets de défense explosent face aux dépenses sociales.',
    titre: 'Le choc géopolitique & le réarmement · 2022–2024',
    texte:
      'Le retour de la guerre en Europe provoque une rupture brutale. ' +
      'Les budgets de défense explosent, modifiant structurellement ' +
      "l'équilibre historique face aux dépenses sociales."
  }
];

/** Retourne la période correspondant à une année donnée. */
export function obtenirPeriode(annee) {
  const a = typeof annee === 'number' ? annee : parseInt(annee, 10);
  return NARRATION.find(p => a >= p.annees[0] && a <= p.annees[1]) ?? NARRATION[0];
}
