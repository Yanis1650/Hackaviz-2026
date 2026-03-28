<script>
  /**
   * Nuage défense / protection sociale (% PIB), repère 2 % OTAN — légende par zone.
   */
  import { onMount } from 'svelte';
  import { renderMacroScatterChart, ligneLabelScatter } from '../lib/macroScatterChart.js';
  import { REGION_COLORS, REGION_LABELS_FR } from '../lib/countryRegions.js';

  let {
    year,
    statsStore,
    embedded = false,
    fixedOverlay = false,
    selectedRegion = null,
    onLegendRegionClick = undefined,
    selectedDotIso3 = null,
    onDotClick = undefined,
    /** @type {Map<string, string>|null|undefined} */
    countryNames = null
  } = $props();

  let rootEl = $state(null);
  /** Pile du graphique (position relative) pour le tooltip HTML. */
  let plotStackEl = $state(/** @type {HTMLDivElement | null} */ (null));
  let svgEl;
  let containerW = $state(260);
  let scatterTip = $state({ show: false, text: '', x: 0, y: 0 });
  /** @type {number|undefined} */
  let scatterPrevYear = undefined;

  /** Ordre d’affichage lisible pour la légende. */
  const legendKeys = [
    'coeur',
    'nordiques',
    'atlantique',
    'baltes',
    'sud',
    'centre',
    'autre'
  ];

  onMount(() => {
    if (!rootEl) return () => {};
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect?.width;
      if (cr != null && cr > 40) containerW = Math.max(embedded ? 160 : 240, cr);
    });
    ro.observe(rootEl);
    containerW = Math.max(embedded ? 160 : 240, rootEl.getBoundingClientRect().width);
    return () => ro.disconnect();
  });

  /** Coordonnées pointeur → locales à `.scatter-plot-stack`. */
  function pointerInPlotStack(clientX, clientY) {
    const el = plotStackEl;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    return {
      x: clientX - r.left + el.scrollLeft,
      y: clientY - r.top + el.scrollTop
    };
  }

  $effect(() => {
    if (!svgEl || !statsStore || !rootEl || !plotStackEl) return;
    const w = containerW;
    const moved = scatterPrevYear !== undefined && scatterPrevYear !== year;
    scatterPrevYear = year;
    const names = countryNames ?? null;
    renderMacroScatterChart(svgEl, {
      width: w,
      year,
      transitionMs: moved ? 500 : 0,
      statsStore,
      embedded,
      selectedIso3: selectedDotIso3,
      onDotClick,
      countryNames: names,
      onScatterTooltip: {
        show: (ev, d) => {
          const loc = pointerInPlotStack(ev.clientX, ev.clientY);
          scatterTip = {
            show: true,
            text: ligneLabelScatter(d, names),
            x: loc.x + 12,
            y: loc.y + 12
          };
        },
        move: (ev, d) => {
          const loc = pointerInPlotStack(ev.clientX, ev.clientY);
          scatterTip = {
            show: true,
            text: ligneLabelScatter(d, names),
            x: loc.x + 12,
            y: loc.y + 12
          };
        },
        hide: () => {
          scatterTip = { ...scatterTip, show: false };
        }
      }
    });
  });
</script>

<div
  id="scatter-container"
  class="scatter-wrap"
  class:scatter-wrap--embedded={embedded}
  class:scatter-wrap--overlay={fixedOverlay && !embedded}
  bind:this={rootEl}
>
  <span class="scatter-title">Scatter défense × social (% PIB)</span>
  <div class="scatter-plot-stack" bind:this={plotStackEl}>
    <div class="scatter-plot-container">
      <svg bind:this={svgEl} class="scatter-svg" aria-label="Nuage de points par pays"></svg>
    </div>
    {#if scatterTip.show}
      <div
        class="scatter-tooltip"
        style:left="{scatterTip.x}px"
        style:top="{scatterTip.y}px"
        role="tooltip"
      >
        {scatterTip.text}
      </div>
    {/if}
  </div>
  <ul class="scatter-legend" aria-label="Zones géographiques">
    {#each legendKeys as key}
      <li class="scatter-legend__item">
        {#if onLegendRegionClick}
          <button
            type="button"
            class="scatter-legend__btn"
            class:scatter-legend__btn--active={selectedRegion === key}
            aria-pressed={selectedRegion === key}
            aria-label="Surligner {REGION_LABELS_FR[key]} sur la carte"
            onclick={() => onLegendRegionClick(key)}
          >
            <span class="scatter-legend__swatch" style:background={REGION_COLORS[key]}></span>
            <span>{REGION_LABELS_FR[key]}</span>
          </button>
        {:else}
          <span class="scatter-legend__static">
            <span class="scatter-legend__swatch" style:background={REGION_COLORS[key]}></span>
            <span>{REGION_LABELS_FR[key]}</span>
          </span>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .scatter-wrap {
    flex-shrink: 0;
    width: 100%;
    min-height: 0;
  }

  .scatter-wrap--embedded {
    margin-top: 0.35rem;
    padding-top: 0.4rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .scatter-wrap--embedded .scatter-title {
    text-align: left;
  }

  .scatter-wrap--overlay {
    position: absolute;
    right: max(0.35rem, env(safe-area-inset-right, 0px));
    bottom: 0.25rem;
    width: min(42vw, 400px);
    max-width: 42%;
    z-index: 24;
    pointer-events: none;
    padding: 0.35rem 0.45rem 0.2rem;
    border-radius: 12px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(8, 10, 18, 0.88) 35%,
      rgba(8, 10, 18, 0.92) 100%
    );
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.35);
  }

  /* Réactiver le pointeur sur le tracé (le wrap overlay est en none pour ne pas masquer la carte). */
  .scatter-wrap--overlay .scatter-plot-stack {
    pointer-events: auto;
  }

  .scatter-title {
    display: block;
    margin-bottom: 0.15rem;
    padding-left: 1px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .scatter-plot-stack {
    position: relative;
    width: 100%;
    min-height: 0;
    overflow: visible;
  }

  .scatter-plot-container {
    width: 100%;
    min-height: 0;
  }

  .scatter-tooltip {
    position: absolute;
    z-index: 5;
    max-width: min(16rem, 92vw);
    padding: 0.28rem 0.4rem;
    font-size: 0.7rem;
    line-height: 1.35;
    color: var(--color-text);
    background: rgba(12, 14, 24, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    pointer-events: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }

  .scatter-svg {
    display: block;
    width: 100%;
  }

  .scatter-legend {
    list-style: none;
    margin: 0.35rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.55rem;
    font-size: 0.69rem;
    color: var(--color-text-dim);
    line-height: 1.2;
  }

  .scatter-legend__item {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
  }

  .scatter-legend__static {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  .scatter-legend__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    margin: 0;
    padding: 0.12rem 0.28rem 0.12rem 0.18rem;
    border-radius: 6px;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    font: inherit;
    font-size: inherit;
    line-height: 1.2;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .scatter-legend__btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .scatter-legend__btn--active {
    border-color: rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.1);
  }

  .scatter-legend__swatch {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
</style>
