<script>
  /**
   * Nuage défense / protection sociale (% PIB), repère 2 % OTAN — légende par zone.
   * En embedded : légende à droite du tracé pour gagner en hauteur.
   */
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
  /** Colonne tracé uniquement (embedded) — largeur pour le SVG. */
  let plotColEl = $state(/** @type {HTMLDivElement | null} */ (null));
  let plotStackEl = $state(/** @type {HTMLDivElement | null} */ (null));
  let svgEl = $state(/** @type {SVGSVGElement | null} */ (null));
  let containerW = $state(260);
  let scatterTip = $state({ show: false, text: '', x: 0, y: 0 });
  /** @type {number|undefined} */
  let scatterPrevYear = undefined;

  const legendKeys = [
    'coeur',
    'nordiques',
    'atlantique',
    'baltes',
    'sud',
    'centre',
    'autre'
  ];

  $effect(() => {
    const obsEl = embedded && plotColEl ? plotColEl : rootEl;
    if (!obsEl) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect?.width;
      if (cr != null && cr > 40) {
        containerW = Math.max(embedded ? 120 : 240, cr);
      }
    });
    ro.observe(obsEl);
    const w0 = obsEl.getBoundingClientRect().width;
    if (w0 > 40) containerW = Math.max(embedded ? 120 : 240, w0);
    return () => ro.disconnect();
  });

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

  {#if embedded}
    <div class="scatter-embed-body">
      <div class="scatter-plot-col" bind:this={plotColEl}>
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
      </div>
      <ul class="scatter-legend scatter-legend--aside" aria-label="Zones géographiques">
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
  {:else}
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
  {/if}
</div>

<style>
  .scatter-wrap {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 0;
    min-width: 0;
  }

  .scatter-wrap--embedded {
    margin-top: 0;
    padding-top: 0;
    border: none;
  }

  .scatter-wrap--embedded .scatter-title {
    text-align: left;
    flex-shrink: 0;
  }

  .scatter-embed-body {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.4rem;
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    width: 100%;
  }

  .scatter-plot-col {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
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

  .scatter-wrap--overlay .scatter-plot-stack {
    pointer-events: auto;
  }

  .scatter-title {
    display: block;
    margin-bottom: 0.12rem;
    padding-left: 1px;
    font-size: 0.68rem;
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
    max-width: min(17rem, 92vw);
    padding: 0.42rem 0.55rem;
    font-size: 0.78rem;
    line-height: 1.42;
    font-weight: 500;
    letter-spacing: 0.01em;
    color: #eef1f8;
    background: rgba(10, 12, 22, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    pointer-events: none;
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.25),
      0 12px 28px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(6px);
  }

  .scatter-svg {
    display: block;
    width: 100%;
  }

  /* Libellé axe Y : texte horizontal puis rotation (évite l’empilement vertical des glyphes). */
  .scatter-svg :global(text.scatter-cap-y) {
    writing-mode: horizontal-tb;
    transform: rotate(-90deg);
    transform-origin: center;
    white-space: nowrap;
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

  .scatter-legend--aside {
    flex: 0 0 min(7.2rem, 32%);
    max-width: 8rem;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 0.18rem;
    font-size: 0.62rem;
  }

  .scatter-legend--aside .scatter-legend__btn {
    width: 100%;
    justify-content: flex-start;
    padding: 0.1rem 0.22rem 0.1rem 0.14rem;
  }

  .scatter-legend__item {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
  }

  .scatter-legend--aside .scatter-legend__item {
    display: block;
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
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: inherit;
    font: inherit;
    font-size: inherit;
    line-height: 1.2;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .scatter-legend__btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .scatter-legend__btn--active {
    background: rgba(255, 255, 255, 0.14);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
  }

  .scatter-legend__swatch {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
</style>
