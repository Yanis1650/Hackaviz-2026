/**
 * Accès structuré aux statistiques JSON (contrat stable pour le front).
 */

import { getRegionForIso3, iso2FromIso3 } from './countryRegions.js';

/**
 * @param {Record<string, Record<string, object>>} statsData
 */
export function createStatsStore(statsData) {
  /**
   * @param {string} iso3
   * @param {string|number} year
   */
  function getStatsForYear(iso3, year) {
    const y = String(year);
    return statsData[y]?.[iso3] ?? null;
  }

  function getMaxTotalPerCapita() {
    let max = 0;
    for (const annee of Object.values(statsData)) {
      for (const pays of Object.values(annee)) {
        const t = (pays.def_pc ?? 0) + (pays.soc_pc ?? 0);
        if (t > max) max = t;
      }
    }
    return max;
  }

  /** Max entre toutes les valeurs def_pc et soc_pc (échelle commune des mini-barres). */
  function getMaxDefOrSocPerCapita() {
    let max = 0;
    for (const annee of Object.values(statsData)) {
      for (const pays of Object.values(annee)) {
        const d = pays.def_pc ?? 0;
        const soc = pays.soc_pc ?? 0;
        if (!isNaN(d)) max = Math.max(max, d);
        if (!isNaN(soc)) max = Math.max(max, soc);
      }
    }
    return max;
  }

  /** Renvoie les N pays avec la plus forte dépense Défense/hab. pour l'année. */
  function getTopDefense(year, n = 5) {
    const y = String(year);
    const entries = Object.entries(statsData[y] ?? {});
    return entries
      .filter(([, d]) => d.def_pc != null && !isNaN(d.def_pc))
      .sort((a, b) => b[1].def_pc - a[1].def_pc)
      .slice(0, n)
      .map(([iso3, d]) => ({ iso3, def_pc: d.def_pc }));
  }

  /** Vérifie qu'une valeur est un nombre fini utilisable pour l'agrégation. */
  function nombreValide(v) {
    return typeof v === 'number' && !isNaN(v) && isFinite(v);
  }

  /**
   * Totaux UE (tous les pays présents pour l'année) en milliards d'euros.
   * Σ(def_pc × pop) et Σ(soc_pc × pop), divisé par 1e9.
   */
  function getUeTotalsMdEur(year) {
    const y = String(year);
    const annee = statsData[y] ?? {};
    let sumDef = 0;
    let sumSoc = 0;
    for (const d of Object.values(annee)) {
      const pop = d.pop;
      const defPc = d.def_pc;
      const socPc = d.soc_pc;
      if (!nombreValide(pop) || pop <= 0) continue;
      if (nombreValide(defPc)) sumDef += defPc * pop;
      if (nombreValide(socPc)) sumSoc += socPc * pop;
    }
    return { defenseMd: sumDef / 1e9, socialMd: sumSoc / 1e9 };
  }

  /**
   * N pays avec le plus fort quotient Défense / Social (€/hab., identique à def_pib/soc_pib).
   */
  function getTopByDefenseRatio(year, n = 5) {
    const y = String(year);
    const entries = Object.entries(statsData[y] ?? {});
    const rows = [];
    for (const [iso3, d] of entries) {
      const defPc = d.def_pc;
      const socPc = d.soc_pc;
      if (!nombreValide(defPc) || !nombreValide(socPc) || socPc <= 0) continue;
      const ratio = defPc / socPc;
      if (!isFinite(ratio)) continue;
      rows.push({ iso3, def_pc: defPc, soc_pc: socPc, ratio });
    }
    return rows.sort((a, b) => b.ratio - a.ratio).slice(0, n);
  }

  /**
   * Série annuelle 2002–2024 : moyennes pondérées par population (€/hab. « macro »).
   */
  function getEuMacroSeries() {
    const years = Object.keys(statsData)
      .map(Number)
      .filter((k) => !isNaN(k))
      .sort((a, b) => a - b);
    return years.map((yr) => {
      const annee = statsData[String(yr)] ?? {};
      let w = 0;
      let sumDef = 0;
      let sumSoc = 0;
      for (const d of Object.values(annee)) {
        const pop = d.pop;
        const defPc = d.def_pc;
        const socPc = d.soc_pc;
        if (
          !nombreValide(pop) ||
          pop <= 0 ||
          !nombreValide(defPc) ||
          !nombreValide(socPc)
        )
          continue;
        w += pop;
        sumDef += defPc * pop;
        sumSoc += socPc * pop;
      }
      const avgDef = w > 0 ? sumDef / w : 0;
      const avgSoc = w > 0 ? sumSoc / w : 0;
      return { year: yr, avgDef, avgSoc };
    });
  }

  /**
   * Part Défense / (Défense + Social) par pays (champ ratio ou dérivé des €/hab.).
   * @returns {Array<{ iso3: string, ratio: number, pop: number }>}
   */
  function getDefenseShareNodesForYear(year) {
    const y = String(year);
    const annee = statsData[y] ?? {};
    /** @type {Array<{ iso3: string, ratio: number, pop: number }>} */
    const out = [];
    for (const [iso3, d] of Object.entries(annee)) {
      const pop = d.pop;
      if (!nombreValide(pop) || pop <= 0) continue;
      const rJson = d.ratio;
      let ratio = null;
      if (nombreValide(rJson) && rJson >= 0 && rJson <= 1) {
        ratio = rJson;
      } else {
        const defPc = d.def_pc;
        const socPc = d.soc_pc;
        if (
          nombreValide(defPc) &&
          nombreValide(socPc) &&
          defPc + socPc > 1e-12
        ) {
          ratio = defPc / (defPc + socPc);
        }
      }
      if (ratio == null || !isFinite(ratio)) continue;
      out.push({ iso3, ratio, pop });
    }
    return out;
  }

  /** Moyenne européenne pondérée par population (même périmètre que les nœuds). */
  function getEuWeightedMeanDefenseShare(year) {
    const nodes = getDefenseShareNodesForYear(year);
    let w = 0;
    let sum = 0;
    for (const n of nodes) {
      w += n.pop;
      sum += n.ratio * n.pop;
    }
    return w > 0 ? sum / w : 0;
  }

  function getData() {
    return statsData;
  }

  /**
   * Totaux UE selon le mode d'affichage.
   * - 'per_capita' : somme Σ(def_pc × pop) et Σ(soc_pc × pop) en Md€.
   * - 'pib_pct'    : moyenne pondérée par population de def_pib et soc_pib (%).
   * @param {string|number} year
   * @param {'per_capita'|'pib_pct'} mode
   */
  function getUeTotalsForMode(year, mode) {
    if (mode !== 'pib_pct') return { mode: 'per_capita', ...getUeTotalsMdEur(year) };
    const y = String(year);
    const annee = statsData[y] ?? {};
    let wDef = 0;
    let wSoc = 0;
    let wD = 0;
    let wS = 0;
    for (const d of Object.values(annee)) {
      const pop = d.pop;
      if (!nombreValide(pop) || pop <= 0) continue;
      if (nombreValide(d.def_pib)) { wDef += d.def_pib * pop; wD += pop; }
      if (nombreValide(d.soc_pib)) { wSoc += d.soc_pib * pop; wS += pop; }
    }
    return {
      mode: 'pib_pct',
      defensePct: wD > 0 ? wDef / wD : 0,
      socialPct: wS > 0 ? wSoc / wS : 0
    };
  }

  /**
   * Valeur maximale (somme def+soc) sur toutes les années selon le mode.
   * Sert à l'échelle de taille des glyphes carte.
   * @param {'per_capita'|'pib_pct'} mode
   */
  function getMaxTotalForMode(mode) {
    let max = 0;
    for (const annee of Object.values(statsData)) {
      for (const pays of Object.values(annee)) {
        const t =
          mode === 'pib_pct'
            ? (pays.def_pib ?? 0) + (pays.soc_pib ?? 0)
            : (pays.def_pc ?? 0) + (pays.soc_pc ?? 0);
        if (t > max) max = t;
      }
    }
    return max > 0 ? max : 1;
  }

  /** Quotient défense / protection sociale (€/hab.) — aligné sur le libellé heatmap ; pas le champ JSON `ratio` (part dans déf+soc). */
  function ratioDefenseSurSocial(d) {
    const defPc = d.def_pc;
    const socPc = d.soc_pc;
    if (!nombreValide(defPc) || !nombreValide(socPc) || socPc <= 0) return null;
    const r = defPc / socPc;
    return isFinite(r) ? r : null;
  }

  /**
   * Matrice heatmap : variation (ratio_annee / ratio_2002) - 1, ratio courant def_pc/soc_pc.
   * @returns {{ years: number[], countries: string[], cells: Array<{ iso3: string, year: number, variation: number|null, ratio: number|null }>, maxAbs: number }}
   */
  function getRatioVariationMatrix() {
    const years = Object.keys(statsData)
      .map(Number)
      .filter((k) => !isNaN(k))
      .sort((a, b) => a - b);
    const base = statsData['2002'] ?? {};
    const countries = Object.keys(base)
      .filter((iso) => ratioDefenseSurSocial(base[iso]) != null)
      .sort();
    const ratio2002 = new Map(
      countries.map((iso) => [iso, ratioDefenseSurSocial(base[iso])])
    );
    /** @type {Array<{ iso3: string, year: number, variation: number|null, ratio: number|null }>} */
    const cells = [];
    let maxAbs = 0;
    for (const yr of years) {
      const annee = statsData[String(yr)] ?? {};
      for (const iso of countries) {
        const r0 = ratio2002.get(iso);
        const row = annee[iso];
        const ry = row ? ratioDefenseSurSocial(row) : null;
        let variation = null;
        if (r0 != null && r0 > 0 && ry != null) {
          variation = ry / r0 - 1;
          if (isFinite(variation)) maxAbs = Math.max(maxAbs, Math.abs(variation));
        }
        cells.push({ iso3: iso, year: yr, variation, ratio: ry });
      }
    }
    return { years, countries, cells, maxAbs };
  }

  /**
   * Domaines fixes (2002–2024) pour le nuage défense / social en % du PIB.
   * @returns {{ minDef: number, maxDef: number, minSoc: number, maxSoc: number }}
   */
  function getScatterGlobalDomains() {
    let minS = Infinity;
    let maxS = 0;
    let maxD = 0;
    for (const annee of Object.values(statsData)) {
      for (const pays of Object.values(annee)) {
        const dp = pays.def_pib;
        const sp = pays.soc_pib;
        if (nombreValide(dp)) maxD = Math.max(maxD, dp);
        if (nombreValide(sp)) {
          minS = Math.min(minS, sp);
          maxS = Math.max(maxS, sp);
        }
      }
    }
    if (minS === Infinity) minS = 0;
    const padS = 1.09;
    const padLo = 0.94;
    return {
      minDef: 0,
      maxDef: Math.max(maxD * 1.08, 2.35, 4.25),
      minSoc: Math.max(0, minS * padLo),
      maxSoc: Math.max(maxS * padS, minS + 1)
    };
  }

  /**
   * Points nuage défense / social pour une année (% du PIB).
   * @returns {Array<{ iso3: string, def_pib: number, soc_pib: number, region: string, code2: string }>}
   */
  function getScatterRowsForYear(year) {
    const y = String(year);
    const annee = statsData[y] ?? {};
    /** @type {Array<{ iso3: string, def_pib: number, soc_pib: number, region: string, code2: string }>} */
    const out = [];
    for (const [iso3, d] of Object.entries(annee)) {
      const defP = d.def_pib;
      const socP = d.soc_pib;
      if (!nombreValide(defP) || !nombreValide(socP)) continue;
      out.push({
        iso3,
        def_pib: defP,
        soc_pib: socP,
        region: getRegionForIso3(iso3),
        code2: iso2FromIso3(iso3)
      });
    }
    return out;
  }

  return {
    getStatsForYear,
    getMaxTotalPerCapita,
    getMaxDefOrSocPerCapita,
    getData,
    getTopDefense,
    getUeTotalsMdEur,
    getUeTotalsForMode,
    getMaxTotalForMode,
    getTopByDefenseRatio,
    getEuMacroSeries,
    getDefenseShareNodesForYear,
    getEuWeightedMeanDefenseShare,
    getScatterGlobalDomains,
    getScatterRowsForYear,
    getRatioVariationMatrix
  };
}
