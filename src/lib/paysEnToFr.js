/**
 * Noms anglais (propriété NAME du GeoJSON) → libellés français pour tooltips et graphiques.
 */
export const PAYS_EN_VERS_FR = {
  Austria: 'Autriche',
  Belgium: 'Belgique',
  Bulgaria: 'Bulgarie',
  Croatia: 'Croatie',
  Cyprus: 'Chypre',
  'Czech Republic': 'Tchéquie',
  Czechia: 'Tchéquie',
  Denmark: 'Danemark',
  Estonia: 'Estonie',
  Finland: 'Finlande',
  France: 'France',
  Germany: 'Allemagne',
  Greece: 'Grèce',
  Hungary: 'Hongrie',
  Ireland: 'Irlande',
  Italy: 'Italie',
  Latvia: 'Lettonie',
  Lithuania: 'Lituanie',
  Luxembourg: 'Luxembourg',
  Malta: 'Malte',
  Netherlands: 'Pays-Bas',
  Poland: 'Pologne',
  Portugal: 'Portugal',
  Romania: 'Roumanie',
  Slovakia: 'Slovaquie',
  Slovenia: 'Slovénie',
  Spain: 'Espagne',
  Sweden: 'Suède'
};

/**
 * @param {string|undefined|null} nameEn
 * @returns {string}
 */
export function translateCountryNameEnToFr(nameEn) {
  if (nameEn == null || nameEn === '') return '';
  return PAYS_EN_VERS_FR[nameEn] ?? nameEn;
}
