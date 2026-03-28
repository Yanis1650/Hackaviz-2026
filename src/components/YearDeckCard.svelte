<script>
  /**
   * Tapis commun + deux cartes (carte + graphiques), pleine hauteur utile.
   */
  import YearMapFace from './YearMapFace.svelte';
  import YearInfoFace from './YearInfoFace.svelte';
  import { getIso3sForScatterRegion } from '../lib/countryRegions.js';

  /** Contour carte (sélection scatter / légende) : jaune chaud sur fond sombre. */
  const MAP_OUTLINE_HIGHLIGHT = '#ffe066';

  let { year, activeYear, geoData, statsStore, countryNames, ratioColorScale } =
    $props();

  /** Région (légende), pays (point scatter ou clic carte) → contours sur la carte. */
  let mapOutline = $state(
    /** @type {null | { type: 'region', key: string } | { type: 'country', iso3: string }} */ (null)
  );

  /** @param {string} key */
  function toggleScatterRegion(key) {
    if (mapOutline?.type === 'region' && mapOutline.key === key) mapOutline = null;
    else mapOutline = { type: 'region', key };
  }

  /** @param {string} iso3 */
  function toggleOutlineCountry(iso3) {
    if (mapOutline?.type === 'country' && mapOutline.iso3 === iso3) mapOutline = null;
    else mapOutline = { type: 'country', iso3 };
  }

  const outlineSpec = $derived.by(() => {
    if (!mapOutline) return null;
    if (mapOutline.type === 'region') {
      const iso3s = getIso3sForScatterRegion(
        /** @type {import('../lib/countryRegions.js').RegionKey} */ (mapOutline.key),
        geoData
      );
      if (!iso3s.length) return null;
      return {
        iso3s,
        color: MAP_OUTLINE_HIGHLIGHT
      };
    }
    return {
      iso3s: [mapOutline.iso3],
      color: MAP_OUTLINE_HIGHLIGHT
    };
  });
</script>

<div class="deck-spread">
  <div class="deck-spread__mat">
    <div class="dual-cards">
      <article class="surface-card surface-card--map" aria-label="Carte">
        <header class="card-head">
          <span class="card-title card-title--map">Carte</span>
        </header>
        <div class="card-body card-body--map">
          <YearMapFace
            embedded
            {year}
            activeYear={activeYear ?? year}
            {geoData}
            {statsStore}
            {countryNames}
            {ratioColorScale}
            outlineSpec={outlineSpec}
            onMapCountryOutlineClick={toggleOutlineCountry}
          />
        </div>
      </article>

      <article class="surface-card surface-card--charts" aria-label="Graphiques">
        <header class="card-head">
          <span class="card-title card-title--charts">Graphiques</span>
        </header>
        <div class="card-body card-body--charts">
          <YearInfoFace
            embedded
            {year}
            {statsStore}
            {countryNames}
            scatterLegendRegionKey={mapOutline?.type === 'region' ? mapOutline.key : null}
            scatterSelectedCountryIso3={mapOutline?.type === 'country' ? mapOutline.iso3 : null}
            onScatterLegendRegion={toggleScatterRegion}
            onScatterDotClick={toggleOutlineCountry}
          />
        </div>
      </article>
    </div>
  </div>
</div>

<style>
  .deck-spread {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
  }

  /* Tapis : relie les deux cartes au même socle que les lames */
  .deck-spread__mat {
    flex: 1 1 0;
    min-height: 0;
    position: relative;
    z-index: 2;
    padding: 5px 6px 5px;
    border-radius: 16px;
    background: linear-gradient(
      175deg,
      rgba(14, 16, 28, 0.72) 0%,
      rgba(6, 8, 16, 0.88) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.06) inset,
      0 20px 46px rgba(0, 0, 0, 0.58),
      0 6px 0 rgba(0, 0, 0, 0.2);
  }

  .dual-cards {
    display: grid;
    grid-template-columns: minmax(0, 1.14fr) minmax(16rem, 0.86fr);
    align-items: stretch;
    gap: clamp(0.4rem, 1.2vw, 0.75rem);
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
    padding: 0;
  }

  @media (max-width: 720px) {
    .dual-cards {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(12rem, 1fr) auto;
    }
  }

  .surface-card {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0.35rem 0.4rem 0.45rem;
    border-radius: 12px;
    box-sizing: border-box;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      0 2px 0 rgba(255, 255, 255, 0.04),
      0 10px 28px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .surface-card--map {
    background: linear-gradient(
      165deg,
      rgba(12, 34, 56, 0.92) 0%,
      rgba(6, 14, 30, 0.96) 100%
    );
    border-color: rgba(74, 158, 255, 0.22);
    /* Tooltip carte en absolute peut dépasser le body de la carte. */
    overflow: visible;
  }

  .surface-card--charts {
    background: linear-gradient(
      165deg,
      rgba(38, 20, 32, 0.9) 0%,
      rgba(12, 10, 22, 0.96) 100%
    );
    border-color: rgba(228, 26, 28, 0.18);
  }

  .card-head {
    flex-shrink: 0;
    width: 100%;
    margin-bottom: 0.2rem;
  }

  .card-title {
    display: block;
    width: 100%;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    text-align: center;
    opacity: 0.85;
  }

  .card-title--map {
    color: rgba(140, 190, 255, 0.95);
  }

  .card-title--charts {
    color: rgba(255, 170, 175, 0.9);
  }

  .card-body {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 10px;
  }

  .card-body--map {
    align-items: center;
    justify-content: center;
    overflow: visible;
  }

  .card-body--charts {
    align-items: stretch;
    justify-content: flex-start;
    gap: 0;
  }

  .card-body--charts > :global(#story-panel) {
    flex: 1 1 0;
    min-height: 0;
  }
</style>
