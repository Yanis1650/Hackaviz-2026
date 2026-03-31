<script>
  /**
   * Grille carte + graphiques, pleine hauteur utile.
   */
  import YearMapFace from './YearMapFace.svelte';
  import YearInfoFace from './YearInfoFace.svelte';
  import { getIso3sForScatterRegion } from '../lib/countryRegions.js';

  /** Contour pays (sélection scatter / légende) — neutre, aligné sur le trait des points du scatter. */
  const MAP_OUTLINE_HIGHLIGHT = '#2a2620';

  let {
    year,
    activeYear,
    geoData,
    statsStore,
    countryNames,
    ratioColorScale
  } = $props();

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
        <div class="card-body card-body--charts">
          <YearInfoFace
            embedded
            {year}
            timelineYear={activeYear ?? year}
            {statsStore}
            {countryNames}
            heatmapHighlightedIso3={mapOutline?.type === 'country' ? mapOutline.iso3 : null}
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
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
  }

  .deck-spread__mat {
    flex: 1 1 0;
    min-height: 0;
    position: relative;
    z-index: 2;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .dual-cards {
    display: grid;
    grid-template-columns: minmax(0, 1.52fr) minmax(24rem, 1.88fr);
    align-items: stretch;
    gap: clamp(0.22rem, 0.65vw, 0.4rem);
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
    padding: 0.3rem 0.32rem 0.38rem;
    border-radius: 12px;
    box-sizing: border-box;
    overflow: hidden;
    border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
    box-shadow: none;
  }

  .surface-card--map {
    background: linear-gradient(
      165deg,
      rgba(232, 228, 218, 0.98) 0%,
      rgba(216, 212, 200, 0.99) 100%
    );
    border-color: rgba(88, 120, 176, 0.28);
    /* Tooltip carte en absolute peut dépasser le body de la carte. */
    overflow: visible;
  }

  .surface-card--charts {
    background: #ede9e0;
    border-color: rgba(0, 0, 0, 0.1);
    border-left: 1px solid rgba(0, 0, 0, 0.08);
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
