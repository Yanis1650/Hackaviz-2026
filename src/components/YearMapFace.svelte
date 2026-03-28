<script>
  /**
   * Face carte — SVG D3, légende bas-gauche, tooltip pays.
   */
  import MapLibreEuropeMap from './MapLibreEuropeMap.svelte';
  import { logMapHover } from '../lib/mapHoverDebug.js';

  let {
    year,
    activeYear = year,
    geoData,
    statsStore,
    countryNames,
    ratioColorScale,
    embedded = false,
    outlineSpec = null,
    onMapCountryOutlineClick = undefined
  } = $props();

  /** Noms pays pour le survol — objet stable muté avant peinture (évite lectures obsolètes). */
  const hoverSync = {
    countryNames: /** @type {Map<string, string>|null} */ (null)
  };

  $effect.pre(() => {
    hoverSync.countryNames = countryNames ?? null;
  });

  let tooltip = $state({
    show: false,
    text: '',
    x: 0,
    y: 0
  });

  /** Pile carte (`position: relative`) — repère pour le tooltip (fixed + ancêtre transform = coords fausses). */
  let mapFaceStackEl = $state(/** @type {HTMLDivElement | null} */ (null));

  /** Coordonnées viewport → locales à `.map-face-stack` pour `position: absolute`. */
  function pointerInStack(clientX, clientY) {
    const el = mapFaceStackEl;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    return {
      x: clientX - r.left + el.scrollLeft,
      y: clientY - r.top + el.scrollTop
    };
  }

  /** @param {{ visible: boolean, text?: string, clientX: number, clientY: number }} p */
  function handleCountryHover(p) {
    if (!p.visible) {
      logMapHover(`face-hide-${year}`, `YearMapFace[slide=${year}] masque tooltip (activeTimeline=${activeYear})`);
      tooltip.show = false;
      return;
    }
    logMapHover(
      `face-show-${year}-${p.text?.slice(0, 24)}`,
      `YearMapFace[slide=${year}] affiche (activeTimeline=${activeYear})`,
      { text: p.text?.slice(0, 80), showUi: activeYear === year }
    );
    tooltip.show = true;
    if (p.text != null) tooltip.text = p.text;
    const loc = pointerInStack(p.clientX, p.clientY);
    tooltip.x = loc.x + 14;
    tooltip.y = loc.y + 14;
  }

  /* Changer d’année ne déclenche pas toujours mouseleave sur la carte inactive. */
  $effect(() => {
    if (activeYear !== year) {
      tooltip.show = false;
    }
  });
</script>

<div class="map-face-inner" class:map-face-inner--embedded={embedded}>
  <div class="map-face-stack" bind:this={mapFaceStackEl}>
    <MapLibreEuropeMap
      {year}
      activeTimelineYear={activeYear}
      {geoData}
      {statsStore}
      {ratioColorScale}
      {hoverSync}
      {outlineSpec}
      {onMapCountryOutlineClick}
      onCountryHover={handleCountryHover}
    />
    <aside class="map-legend" aria-label="Légende de la carte">
      <h3 class="map-legend__title">Légende</h3>
      <p class="map-legend__line">
        <span class="map-legend__label">Couleur de fond</span> — priorité budgétaire : bleu = social, rouge = défense.
      </p>
      <p class="map-legend__line">
        <span class="map-legend__label">Taille du cercle</span> — volume total dépensé par habitant (défense + social).
      </p>
    </aside>
    {#if tooltip.show && activeYear === year}
      <div
        class="map-tooltip"
        style:left="{tooltip.x + 14}px"
        style:top="{tooltip.y + 14}px"
        role="tooltip"
      >
        {tooltip.text}
      </div>
    {/if}
  </div>
</div>

<style>
  .map-face-inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.12rem;
    min-width: 0;
    min-height: 0;
    /* visible : le tooltip (absolute dans la pile) n’est pas coupé sous le transform du carrousel. */
    overflow: visible;
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(14, 18, 32, 0.92) 0%, rgba(6, 8, 16, 0.88) 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .map-face-stack {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    align-items: stretch;
    justify-content: center;
    /* Laisser dépasser le tooltip absolute (sinon masqué par les coins de la carte). */
    overflow: visible;
  }

  .map-face-stack > :global(.maplibre-stack) {
    flex: 1 1 auto;
    width: 100%;
    min-height: 0;
    align-self: stretch;
  }

  .map-legend {
    position: absolute;
    left: 0.35rem;
    bottom: 0.25rem;
    max-width: min(14rem, 92%);
    padding: 0.35rem 0.45rem;
    border-radius: 6px;
    background: rgba(8, 10, 20, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.06);
    pointer-events: none;
    z-index: 2;
  }

  .map-legend__title {
    margin: 0 0 0.2rem;
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-dim);
  }

  .map-legend__line {
    margin: 0 0 0.15rem;
    font-size: 0.7rem;
    line-height: 1.35;
    color: var(--color-text-muted);
  }

  .map-legend__line:last-child {
    margin-bottom: 0;
  }

  .map-legend__label {
    color: var(--color-text-dim);
    font-weight: 600;
  }

  .map-tooltip {
    position: absolute;
    z-index: 40;
    max-width: 16rem;
    padding: 0.4rem 0.55rem;
    font-size: 0.72rem;
    line-height: 1.45;
    color: var(--color-text);
    background: rgba(12, 14, 24, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    pointer-events: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }

  .map-face-inner--embedded {
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    padding: 0.12rem;
    flex: 1 1 auto;
    align-self: stretch;
    width: 100%;
    min-width: 0;
    min-height: 0;
    overflow: visible;
  }
</style>
