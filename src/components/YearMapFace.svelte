<script>
  /**
   * Face carte — titre narratif, carte, légende bas-gauche, tooltip pays.
   */
  import MapLibreEuropeMap from './MapLibreEuropeMap.svelte';
  import { logMapHover } from '../lib/mapHoverDebug.js';
  import { obtenirPeriode, titreNarrationPourAnnee } from '../lib/narration.js';

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

  const periode = $derived(obtenirPeriode(year));
  const titreVue = $derived(titreNarrationPourAnnee(year));

  /** Titre éditorial : thème en serif noir, « · année » en terracotta (comme la une maquette). */
  const titreEditorial = $derived.by(() => {
    const t = titreVue;
    const idx = t.lastIndexOf(' · ');
    if (idx === -1) return { theme: t, accent: null };
    return { theme: t.slice(0, idx), accent: t.slice(idx) };
  });
</script>

<div class="map-face-inner" class:map-face-inner--embedded={embedded}>
  <div class="map-narration">
    <h3 class="map-narration__title">
      {titreEditorial.theme}{#if titreEditorial.accent}<span class="map-narration__title-accent">{titreEditorial.accent}</span>{/if}
    </h3>
    <p class="map-narration__text">{periode.texte}</p>
  </div>
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
      <p class="map-legend__hint">
        Faites glisser le <strong>curseur</strong> sous la vue pour changer d’année. <strong>Cliquez un pays</strong> pour le
        surligner sur la carte et dans les graphiques à droite.
      </p>
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
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 0.5rem;
    padding: 0.62rem 0.75rem;
    min-width: 0;
    min-height: 0;
    /* visible : le tooltip (absolute dans la pile) n’est pas coupé sous le transform du carrousel. */
    overflow: visible;
    border-radius: 12px;
    background: var(--bg-elevated, var(--color-bg));
    border: 1px solid var(--color-border);
    box-shadow: none;
  }

  .map-narration {
    flex-shrink: 0;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.62rem 0.78rem;
  }

  .map-narration__title {
    margin: 0 0 0.42rem;
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: clamp(1.05rem, 2.75vw, 1.42rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.18;
    text-transform: none;
    color: var(--text-primary, #1a1a14);
    max-width: 42rem;
  }

  .map-narration__title-accent {
    color: var(--color-defense, #c45a38);
    font-weight: 700;
  }

  .map-narration__text {
    margin: 0;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--text-secondary, #5a5648);
    max-width: 40rem;
  }

  .map-face-stack {
    position: relative;
    flex: 1 1 0;
    width: 100%;
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

  /* Légende carte — fond plus transparent pour laisser voir la carte. */
  .map-legend {
    position: absolute;
    left: 0.5rem;
    bottom: 0.45rem;
    max-width: min(15rem, 92%);
    padding: 0.52rem 0.65rem;
    border-radius: 6px;
    background: rgba(245, 243, 238, 0.48);
    border: 1px solid rgba(0, 0, 0, 0.08);
    color: #2a2620;
    pointer-events: none;
    z-index: 2;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .map-legend__hint {
    margin: 0 0 0.38rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    font-size: 0.65rem;
    line-height: 1.4;
    color: rgba(42, 38, 32, 0.88);
  }

  .map-legend__hint strong {
    font-weight: 700;
    color: #2a2620;
  }

  .map-legend__title {
    margin: 0 0 0.2rem;
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #2a2620;
  }

  .map-legend__line {
    margin: 0 0 0.15rem;
    font-size: 0.7rem;
    line-height: 1.35;
    color: #2a2620;
  }

  .map-legend__line:last-child {
    margin-bottom: 0;
  }

  .map-legend__label {
    color: #2a2620;
    font-weight: 600;
  }

  .map-tooltip {
    position: absolute;
    z-index: 40;
    max-width: 16rem;
    padding: 0.62rem 0.75rem;
    font-size: 0.72rem;
    line-height: 1.45;
    color: #1a1a14;
    background: rgba(245, 243, 238, 0.96);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .map-face-inner--embedded {
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    padding: 0.35rem 0.5rem;
    gap: 0.4rem;
    flex: 1 1 auto;
    align-self: stretch;
    width: 100%;
    min-width: 0;
    min-height: 0;
    overflow: visible;
  }

  .map-face-inner--embedded .map-narration {
    padding: 0.52rem 0.62rem;
  }

  .map-face-inner--embedded .map-narration__title {
    font-size: clamp(1.08rem, 2.95vw, 1.52rem);
    line-height: 1.16;
    margin-bottom: 0.38rem;
  }

  .map-face-inner--embedded .map-narration__text {
    font-size: 0.74rem;
    line-height: 1.48;
  }
</style>
