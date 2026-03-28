<script>
  /**
   * Une slide pleine hauteur : rendu D3 paresseux si |année - active| > 2 (transition comprise).
   */
  import YearDeckCard from './YearDeckCard.svelte';

  let {
    cardYear,
    activeYear,
    slideHeightPx,
    geoData,
    statsStore,
    countryNames,
    ratioColorScale
  } = $props();

  /** Fenêtre ±2 autour de l’année du slider pour anticiper voisins et animation. */
  const LAZY_RADIUS = 2;
  const shouldRenderHeavy = $derived(
    Math.abs(cardYear - activeYear) <= LAZY_RADIUS
  );
</script>

<section
  class="year-card"
  class:year-card--active={cardYear === activeYear}
  style:height={slideHeightPx > 0 ? `${slideHeightPx}px` : '100%'}
  aria-hidden={cardYear !== activeYear}
  aria-label="Année {cardYear}"
  data-year={cardYear}
>
  <div class="year-card-inner">
    {#if shouldRenderHeavy}
      <YearDeckCard
        year={cardYear}
        activeYear={activeYear}
        {geoData}
        {statsStore}
        {countryNames}
        {ratioColorScale}
      />
    {:else}
      <div class="year-card-placeholder" aria-hidden="true">
        <span class="placeholder-year">{cardYear}</span>
        <span class="placeholder-hint">Hors fenêtre de rendu</span>
      </div>
    {/if}
  </div>
</section>

<style>
  .year-card {
    flex-shrink: 0;
    box-sizing: border-box;
    width: 100%;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  /*
   * Les slides hors année active restent dans le DOM (piste verticale) mais ne
   * reçoivent pas les interactions : MapLibre / SVG ont pointer-events: auto.
   */
  .year-card:not(.year-card--active) {
    pointer-events: none;
    z-index: 0;
  }

  .year-card:not(.year-card--active) :global(.deck-spread),
  .year-card:not(.year-card--active) :global(.deck-spread *) {
    pointer-events: none !important;
  }

  .year-card--active {
    pointer-events: auto;
    z-index: 5;
  }

  .year-card-inner {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    /* Marge par rapport aux bords de la fenêtre (carte + graphiques ne collent pas au viewport). */
    padding: clamp(0.45rem, 1.1vh, 0.85rem) clamp(0.65rem, 1.75vw, 1.35rem);
    box-sizing: border-box;
  }

  .year-card-inner > :global(.deck-spread) {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    min-height: 0;
    flex: 1;
    min-width: 0;
  }

  .year-card-placeholder {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    min-height: 200px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: linear-gradient(
      175deg,
      rgba(14, 16, 28, 0.45) 0%,
      rgba(6, 8, 16, 0.65) 100%
    );
    border: 1px dashed rgba(255, 255, 255, 0.12);
    color: var(--color-text-muted);
  }

  .placeholder-year {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    opacity: 0.35;
  }

  .placeholder-hint {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.5;
  }
</style>
