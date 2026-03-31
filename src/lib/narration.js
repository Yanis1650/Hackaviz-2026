/**
 * Données narratives par grandes périodes géopolitiques.
 * Export pur, sans manipulation DOM.
 */

/**
 * @typedef {{ media: string, date: string, une: string }} CitationPresse
 * @typedef {{
 *   chapitreLigne: string,
 *   chapeau: string,
 *   corps: string,
 *   citations: CitationPresse[]
 * }} TransitionFlash
 */

/**
 * Événements sur la timeline (pyramides interactives).
 * `kind` : ue = bleu (élargissement UE), eco = orange (crise économique), war = rouge (guerre).
 */
export const TIMELINE_EVENTS = [
  { year: 2004, label: 'Élarg. UE', kind: 'ue' },
  { year: 2008, label: 'Lehman', kind: 'eco' },
  { year: 2014, label: 'Crimée', kind: 'war' },
  { year: 2022, label: 'Ukraine', kind: 'war' }
];

export const NARRATION = [
  {
    id: 'paix',
    annees: [2002, 2007],
    accent: '#2a6040',
    titreCourt: 'Dividendes paix',
    accroche:
      "L'Europe investit massivement dans la protection sociale. " +
      'Les budgets de défense sont au plus bas historique.',
    titre: "L'ère des dividendes de la paix · 2002–2007",
    texte:
      "L'Europe investit massivement dans la protection sociale. " +
      'Les budgets de défense sont au plus bas historique en proportion ' +
      'de la richesse nationale.',
    transitionFlash: {
      chapitreLigne: 'Chapitre 1 · 2002–2007 · Dividendes paix',
      chapeau: 'Après la guerre froide, la protection sociale structure les budgets européens.',
      corps:
        "Les agrégats COFOG montrent une défense à bas régime en proportion du PIB, " +
        "tandis que la protection sociale absorbe la plus grande part des dépenses publiques. " +
        "C'est la matière première de cette visualisation : le ratio défense / social reste bas.",
      citations: [
        {
          media: 'Le Monde',
          date: '2002',
          une: 'Élargissement à l’Est : l’UE consolide son modèle social face aux défis budgétaires'
        },
        {
          media: 'Financial Times',
          date: '2003',
          une: 'Zone euro : la rigueur monétaire laisse peu de marge aux budgets militaires'
        }
      ]
    }
  },
  {
    id: 'crise',
    annees: [2008, 2013],
    accent: '#2a6040',
    titreCourt: 'Crise dettes',
    accroche:
      'La protection sociale absorbe le choc de la crise ; la défense reste variable d’ajustement sous austérité.',
    titre: 'La crise des dettes souveraines · 2008–2013',
    texte:
      'La protection sociale absorbe le choc de la crise financière. ' +
      "La défense reste une variable d'ajustement sous pression " +
      "des politiques d'austérité.",
    transitionFlash: {
      chapitreLigne: 'Chapitre 2 · 2008–2013 · Crise des dettes',
      chapeau: 'Le choc financier impose des arbitrages brutaux entre stabilisation et dépenses.',
      corps:
        "La crise des subprimes se propage aux États ; sous austérité, la défense devient souvent " +
        "variable d'ajustement tandis que la protection sociale amortit le choc social. " +
        "Les données COFOG traduisent ces tensions pays par pays.",
      citations: [
        {
          media: 'Le Monde',
          date: 'sept. 2008',
          une: 'Faillites bancaires : les gouvernements enchaînent les plans de sauvetage'
        },
        {
          media: 'Reuters',
          date: '2010',
          une: 'Zone euro : la Grèce au cœur d’une tempête sur la dette souveraine'
        },
        {
          media: 'Les Échos',
          date: '2011',
          une: 'Austérité : les budgets publics serrent la vis sur toute la ligne'
        }
      ]
    }
  },
  {
    id: 'reveil',
    annees: [2014, 2021],
    accent: '#2a6040',
    titreCourt: 'Réveil Balte',
    accroche:
      'Premier bascule à l’Est : les Baltes voient la part défense augmenter face à la nouvelle donne sécuritaire.',
    titre: "Le réveil balte & l'annexion de la Crimée · 2014–2021",
    texte:
      "Un premier point de bascule. Observez l'Europe de l'Est et les " +
      'États baltes : le rouge commence à se densifier face à la nouvelle ' +
      'donne sécuritaire russe.',
    transitionFlash: {
      chapitreLigne: 'Chapitre 3 · 2014–2021 · Réveil balte',
      chapeau: "L'Est européen réévalue la menace ; les parts défense repartent à la hausse.",
      corps:
        "L'annexion de la Crimée et la guerre dans le Donbass marquent un tournant. " +
        "Les États baltes et les voisins de la Russie augmentent leurs efforts, visibles dans les séries " +
        "par fonction gouvernementale.",
      citations: [
        {
          media: 'Le Monde',
          date: 'mars 2014',
          une: 'Crimée : vote contesté et réactions diplomatiques massives contre Moscou'
        },
        {
          media: 'Reuters',
          date: '2014',
          une: 'OTAN : sommet sous tension après l’annexion de la péninsule'
        },
        {
          media: 'Le Monde',
          date: '2016',
          une: 'Pays baltes : hausse continue des budgets militaires face à l’Est'
        }
      ]
    }
  },
  {
    id: 'rearmement',
    annees: [2022, 2024],
    accent: '#2a6040',
    titreCourt: 'Réarmement',
    accroche:
      'La guerre en Europe impose une rupture : les budgets de défense explosent face aux dépenses sociales.',
    titre: 'Le choc géopolitique & le réarmement · 2022–2024',
    texte:
      'Le retour de la guerre en Europe provoque une rupture brutale. ' +
      'Les budgets de défense explosent, modifiant structurellement ' +
      "l'équilibre historique face aux dépenses sociales.",
    transitionFlash: {
      chapitreLigne: 'Chapitre 4 · 2022–2024 · Réarmement',
      chapeau: 'Le retour de la guerre en Europe change tout.',
      corps:
        "Après des décennies de dividende de la paix, l'invasion de l'Ukraine provoque une rupture " +
        "structurelle des budgets de défense européens. Les données COFOG en témoignent : " +
        "le rapport défense / protection sociale remonte nettement pour la première fois sur la période observée.",
      citations: [
        {
          media: 'Le Monde',
          date: '24 févr. 2022',
          une: 'Ukraine : appels à la résistance et mobilisation internationale face à l’offensive'
        },
        {
          media: 'Reuters',
          date: 'mars 2022',
          une: 'Guerre en Europe : sanctions occidentales et flux d’aide militaire vers Kyiv'
        },
        {
          media: 'OTAN',
          date: '2022',
          une: 'Défense : nombre d’Alliés encore sous l’objectif des 2 % du PIB'
        }
      ]
    }
  }
];

/**
 * Repères presse (titres reformulés) pour années marquantes.
 * @type {Record<number, { une: string, media: string, dateLigne: string, rubrique: string }>}
 */
export const REPÈRES_ANNÉE = {
  2008: {
    media: 'Le Monde',
    dateLigne: '15 sept. 2008',
    rubrique: 'Économie',
    une:
      'Choc sur les marchés : faillites bancaires et plans de sauvetage à la chaîne'
  },
  2014: {
    media: 'Le Monde',
    dateLigne: 'mars 2014',
    rubrique: 'International',
    une:
      'Péninsule de Crimée : vote contesté et isolement diplomatique de Moscou'
  },
  2022: {
    media: 'Le Monde',
    dateLigne: '24 février 2022',
    rubrique: 'International',
    une:
      'Guerre en Europe : les budgets de défense bondissent, la solidarité militaire devient la norme'
  }
};

/** @param {number} annee */
export function obtenirReperesAnnee(annee) {
  return REPÈRES_ANNÉE[annee] ?? null;
}

/** Retourne la période correspondant à une année donnée. */
export function obtenirPeriode(annee) {
  const a = typeof annee === 'number' ? annee : parseInt(annee, 10);
  return NARRATION.find(p => a >= p.annees[0] && a <= p.annees[1]) ?? NARRATION[0];
}

/** Suffixe « · 2008–2013 » dans les titres de chapitre (données NARRATION). */
const TITRE_SUFFIX_PLAGE = / · \d{4}–\d{4}$/u;

/**
 * Titre affiché pour une année : thème du chapitre + année courante (les graphiques sont annuels).
 * @param {number} annee
 */
export function titreNarrationPourAnnee(annee) {
  const p = obtenirPeriode(annee);
  const theme = p.titre.replace(TITRE_SUFFIX_PLAGE, '').trim();
  return `${theme} · ${annee}`;
}
