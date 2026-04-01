<script>
  /**
   * Heatmap : variation du ratio Défense/Social vs 2002 — survol (tooltip), pas de navigation au clic.
   */
  import { onMount } from 'svelte';
  import { renderRatioVariationHeatmap } from '../lib/ratioVariationHeatmap.js';
  import { TIMELINE_EVENTS } from '../lib/narration.js';

  let {
    statsStore,
    year,
    compact = false,
    /** Ligne surlignée (ex. pays sélectionné sur la carte). */
    highlightedIso3 = null,
    /** @type {Map<string, string>|null|undefined} */
    countryNames = null
  } = $props();

  const TIP_PAD = 6;
  const TIP_OFF_X = 16;
  const TIP_OFF_ABOVE = -58;
  const TIP_OFF_BELOW = 14;
  /** Largeur estimée du tooltip pour rester dans la zone (évite le clip aux bords). */
  const TIP_EST_W = 200;
  const TIP_EST_H = 248;

  let rootEl = $state(/** @type {HTMLDivElement | null} */ (null));
  let plotStackEl = $state(/** @type {HTMLDivElement | null} */ (null));
  let svgEl;
  let containerW = $state(260);

  /** @type {{ show: boolean, x: number, y: number, d: { iso3: string, year: number, variation: number|null, ratio: number|null, def_pib: number|null, soc_pib: number|null, def_pc: number|null, soc_pc: number|null, code2: string } | null }} */
  let hmTip = $state({ show: false, x: 0, y: 0, d: null });

  const matrix = $derived(statsStore ? statsStore.getRatioVariationMatrix() : null);

  const eurPcFmt = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
  const pibFmt = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  /** @param {number} y */
  function eventLabelForYear(y) {
    return TIMELINE_EVENTS.find((e) => e.year === y)?.label ?? null;
  }

  function pointerInStack(clientX, clientY) {
    const el = plotStackEl;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    return {
      x: clientX - r.left + el.scrollLeft,
      y: clientY - r.top + el.scrollTop
    };
  }

  /**
   * Position du tooltip en coords locales à `.heatmap-plot-stack` : au-dessus du pointeur par défaut,
   * bascule sous le curseur si pas assez de place en haut ; clamp horizontal.
   */
  function tooltipPosInStack(/** @type {number} */ lx, /** @type {number} */ ly) {
    const el = plotStackEl;
    const w = el ? el.clientWidth : 320;
    const h = el ? el.clientHeight : 240;
    let x = lx + TIP_OFF_X;
    let y = ly + TIP_OFF_ABOVE;
    if (y < TIP_PAD) y = ly + TIP_OFF_BELOW;
    const maxX = Math.max(TIP_PAD, w - TIP_EST_W - TIP_PAD);
    if (x > maxX) x = maxX;
    if (x < TIP_PAD) x = TIP_PAD;
    const maxY = Math.max(TIP_PAD, h - TIP_EST_H - TIP_PAD);
    if (y > maxY) y = maxY;
    if (y < TIP_PAD) y = TIP_PAD;
    return { x, y };
  }

  onMount(() => {
    if (!rootEl) return () => {};
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect?.width;
      if (cr != null && cr > 40) containerW = cr;
    });
    ro.observe(rootEl);
    containerW = Math.max(160, rootEl.getBoundingClientRect().width);
    return () => ro.disconnect();
  });

  $effect(() => {
    if (!svgEl || !matrix || !plotStackEl) return;
    renderRatioVariationHeatmap(svgEl, {
      width: containerW,
      matrix,
      compact,
      activeYear: year,
      highlightedIso3,
      onHeatmapTooltip: {
        show: (ev, d) => {
          const loc = pointerInStack(ev.clientX, ev.clientY);
          const p = tooltipPosInStack(loc.x, loc.y);
          hmTip = {
            show: true,
            x: p.x,
            y: p.y,
            d
          };
        },
        move: (ev, d) => {
          const loc = pointerInStack(ev.clientX, ev.clientY);
          const p = tooltipPosInStack(loc.x, loc.y);
          hmTip = {
            show: true,
            x: p.x,
            y: p.y,
            d
          };
        },
        hide: () => {
          hmTip = { show: false, x: 0, y: 0, d: null };
        }
      }
    });
  });
</script>

<div class="heatmap-wrap" class:heatmap-wrap--compact={compact}>
  <div class="heatmap-heading-row">
    <h4 class="section-heading">Variation du ratio Défense / Social (réf. 2002)</h4>
    {#if !compact}
      <p class="heatmap-action-hint">Survolez une cellule pour les détails</p>
    {/if}
  </div>
  {#if !compact}
    <p class="heatmap-events" aria-hidden="true">
      Même repères que la timeline :
      {#each TIMELINE_EVENTS as ev, i}
        <span class="heatmap-events__chip">{ev.label} ({ev.year})</span>{i < TIMELINE_EVENTS.length - 1 ? ' · ' : ''}
      {/each}
    </p>
  {/if}
  <div class="heatmap-legend">
    <span class="hl-title">Comment lire</span>
    <div class="hl-items">
      <div class="hl-item">
        <div class="hl-swatch" style="background: #9cba88"></div>
        <span>Part sociale augmente vs 2002</span>
      </div>
      <div class="hl-item">
        <div class="hl-swatch" style="background: #d4d0be"></div>
        <span>Stable</span>
      </div>
      <div class="hl-item">
        <div class="hl-swatch" style="background: #cc9068"></div>
        <span>Part défense augmente</span>
      </div>
    </div>
  </div>
  <div class="heatmap-plot-stack" bind:this={plotStackEl}>
    <div id="heatmap-container" class="heatmap-container" bind:this={rootEl}>
      <svg bind:this={svgEl} class="heatmap-svg" aria-label="Heatmap variation ratio par pays et année"></svg>
    </div>
    {#if hmTip.show && hmTip.d}
      {@const d = hmTip.d}
      {@const nom = countryNames?.get?.(d.iso3) ?? d.iso3}
      {@const code2 = d.code2?.trim() ? d.code2 : d.iso3}
      {@const evLab = eventLabelForYear(d.year)}
      <div
        class="hm-tooltip"
        style:left="{hmTip.x}px"
        style:top="{hmTip.y}px"
        role="tooltip"
      >
        <div class="hm-tooltip__title">{nom} · {code2}</div>
        <div class="hm-tooltip__meta">{d.year}</div>
        {#if d.def_pc != null && Number.isFinite(d.def_pc)}
          <div class="hm-tooltip__metric hm-tooltip__metric--defense">
            Dépense défense : {eurPcFmt.format(d.def_pc)} €/hab.
          </div>
        {/if}
        {#if d.soc_pc != null && Number.isFinite(d.soc_pc)}
          <div class="hm-tooltip__metric hm-tooltip__metric--social">
            Dépense sociale : {eurPcFmt.format(d.soc_pc)} €/hab.
          </div>
        {/if}
        {#if d.def_pib != null && Number.isFinite(d.def_pib)}
          <div class="hm-tooltip__secondary hm-tooltip__secondary--pib">
            Part défense : {pibFmt.format(d.def_pib)} % du PIB
          </div>
        {/if}
        {#if d.soc_pib != null && Number.isFinite(d.soc_pib)}
          <div class="hm-tooltip__secondary hm-tooltip__secondary--pib">
            Part sociale : {pibFmt.format(d.soc_pib)} % du PIB
          </div>
        {/if}
        {#if (d.def_pib == null || !Number.isFinite(d.def_pib)) && (d.soc_pib == null || !Number.isFinite(d.soc_pib)) && (d.def_pc == null || !Number.isFinite(d.def_pc)) && (d.soc_pc == null || !Number.isFinite(d.soc_pc))}
          <div class="hm-tooltip__line hm-tooltip__line--muted">Donnée indisponible</div>
        {/if}
        {#if evLab}
          <div class="hm-tooltip__event">Contexte : {evLab}</div>
        {/if}
      </div>
    {/if}
  </div>
  <div class="heatmap-callout">
    La majorité des pays réduit leur ratio défense/social jusqu'en 2014. Après la Crimée, le basculement est
    visible pour les Baltes et l'Europe de l'Est.
  </div>
  <p class="heatmap-hint-footer">
    {compact ? 'Survol pour détails' : 'Survolez pour explorer les pays et les années'}
  </p>
</div>

<style>
  .heatmap-wrap {
    flex: 0 1 auto;
    width: 100%;
    min-height: 0;
    position: relative;
    z-index: 0;
  }

  .heatmap-heading-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.35rem 0.75rem;
    margin-bottom: 0.5rem;
  }

  .heatmap-action-hint {
    margin: 0;
    font-size: 0.62rem;
    font-style: italic;
    letter-spacing: 0.04em;
    color: var(--color-text-dim);
    max-width: 12rem;
    text-align: right;
    line-height: 1.35;
  }

  .heatmap-wrap--compact .heatmap-heading-row {
    margin-bottom: 0;
  }

  .heatmap-wrap--compact .section-heading {
    font-size: 0.78rem;
    margin-bottom: 0.1rem;
  }

  .heatmap-wrap--compact .heatmap-legend {
    padding: 7px 10px;
    margin-bottom: 7px;
    gap: 10px;
  }

  .heatmap-wrap--compact .hl-title {
    font-size: 11px;
  }

  .heatmap-wrap--compact .hl-item {
    font-size: 11px;
  }

  .heatmap-wrap--compact .hl-swatch {
    width: 16px;
    height: 11px;
  }

  .heatmap-wrap--compact .heatmap-container {
    overflow-x: hidden;
  }

  .heatmap-wrap--compact .heatmap-hint-footer {
    font-size: 0.58rem;
    margin-top: 0.12rem;
  }

  .heatmap-wrap--compact .heatmap-callout {
    font-size: 12px;
    margin-top: 6px;
    line-height: 1.5;
  }

  .heatmap-wrap--compact .heatmap-events {
    font-size: 10px;
    margin-bottom: 0.42rem;
  }

  .section-heading {
    margin: 0 0 0.15rem;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-label, var(--color-text-muted));
  }

  .heatmap-legend {
    position: relative;
    z-index: 0;
    background: #e8e4da;
    border-radius: 5px;
    padding: 6px 10px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .hl-title {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #3a3028;
    white-space: nowrap;
  }

  .hl-items {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .hl-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #5a5040;
  }

  .hl-swatch {
    width: 16px;
    height: 11px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .heatmap-events {
    margin: 0 0 0.5rem;
    font-size: 10px;
    line-height: 1.45;
    color: var(--hm-marker-label, #3a3028);
    opacity: 0.95;
  }

  .heatmap-events__chip {
    font-weight: 700;
    color: var(--hm-marker-label, #3a3028);
    letter-spacing: 0.02em;
  }

  .heatmap-plot-stack {
    position: relative;
    z-index: 2;
    width: 100%;
    min-height: 0;
    /* Visible : le tooltip au-dessus de la 1re ligne ne doit pas être rogné. */
    overflow: visible;
    border-radius: 6px;
    background: var(--bg-elevated, #e0ddd4);
  }

  .heatmap-container {
    width: 100%;
    min-height: 0;
    overflow-x: auto;
    overflow-y: hidden;
    border-radius: 6px;
  }

  .heatmap-svg {
    display: block;
    width: 100%;
    min-width: 200px;
  }

  .heatmap-hint-footer {
    margin: 0.28rem 0 0;
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    color: var(--color-text-dim);
    opacity: 0.88;
  }

  .heatmap-callout {
    font-size: 12px;
    font-style: italic;
    color: #5a5040;
    border-left: 2px solid #c45a38;
    padding-left: 8px;
    margin-top: 6px;
    border-radius: 0;
    line-height: 1.5;
  }

  .hm-tooltip {
    position: absolute;
    z-index: 30;
    max-width: min(17rem, 92vw);
    padding: 0.62rem 0.75rem;
    font-size: 0.76rem;
    line-height: 1.45;
    font-weight: 500;
    letter-spacing: 0.01em;
    color: var(--color-text-data, #1a1a14);
    background: rgba(253, 251, 247, 0.97);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    pointer-events: none;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.08),
      0 8px 24px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(6px);
    transition: opacity 0.15s ease;
  }

  .hm-tooltip__title {
    font-weight: 700;
    margin-bottom: 0.12rem;
    color: var(--color-text-data, #1a1a14);
  }

  .hm-tooltip__meta {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 0.35rem;
  }

  .hm-tooltip__metric {
    margin: 0.12rem 0;
    font-weight: 600;
  }

  .hm-tooltip__metric--defense {
    color: var(--color-defense);
  }

  .hm-tooltip__metric--social {
    color: var(--color-social);
  }

  .hm-tooltip__secondary {
    margin: 0.18rem 0 0;
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .hm-tooltip__line {
    margin: 0.06rem 0;
  }

  .hm-tooltip__line--muted {
    opacity: 0.75;
    font-style: italic;
  }

  .hm-tooltip__event {
    margin-top: 0.38rem;
    padding-top: 0.32rem;
    border-top: 1px solid var(--color-border);
    font-size: 0.72rem;
    color: var(--color-text-muted);
  }
</style>
