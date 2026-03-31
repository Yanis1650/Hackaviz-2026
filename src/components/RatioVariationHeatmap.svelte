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

  /** Décalage tooltip : au-dessus du curseur pour ne pas masquer les cellules du bas ni les données du haut. */
  const TIP_OFFSET = { x: 16, y: -60 };

  let rootEl = $state(/** @type {HTMLDivElement | null} */ (null));
  let plotStackEl = $state(/** @type {HTMLDivElement | null} */ (null));
  let svgEl;
  let containerW = $state(260);

  /** @type {{ show: boolean, x: number, y: number, d: { iso3: string, year: number, variation: number|null, ratio: number|null, def_pib: number|null, soc_pib: number|null, code2: string } | null }} */
  let hmTip = $state({ show: false, x: 0, y: 0, d: null });

  const matrix = $derived(statsStore ? statsStore.getRatioVariationMatrix() : null);

  const ratioFmt = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
  const pctVs2002Fmt = new Intl.NumberFormat('fr-FR', {
    signDisplay: 'exceptZero',
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
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
          hmTip = {
            show: true,
            x: loc.x + TIP_OFFSET.x,
            y: loc.y + TIP_OFFSET.y,
            d
          };
        },
        move: (ev, d) => {
          const loc = pointerInStack(ev.clientX, ev.clientY);
          hmTip = {
            show: true,
            x: loc.x + TIP_OFFSET.x,
            y: loc.y + TIP_OFFSET.y,
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
  <p class="heatmap-legend-line">
    <span class="leg leg--down">Baisse du ratio</span>
    <span class="leg leg--mid">Stable</span>
    <span class="leg leg--up">Hausse</span>
  </p>
  {#if !compact}
    <p class="heatmap-events" aria-hidden="true">
      Même repères que la timeline :
      {#each TIMELINE_EVENTS as ev, i}
        <span class="heatmap-events__chip">{ev.label} ({ev.year})</span>{i < TIMELINE_EVENTS.length - 1 ? ' · ' : ''}
      {/each}
    </p>
  {/if}
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
        {#if d.def_pib != null && Number.isFinite(d.def_pib)}
          <div class="hm-tooltip__metric hm-tooltip__metric--defense">
            Défense {pibFmt.format(d.def_pib)} % PIB
          </div>
        {/if}
        {#if d.soc_pib != null && Number.isFinite(d.soc_pib)}
          <div class="hm-tooltip__metric hm-tooltip__metric--social">
            Social {pibFmt.format(d.soc_pib)} % PIB
          </div>
        {/if}
        {#if d.ratio != null && Number.isFinite(d.ratio)}
          <div class="hm-tooltip__secondary">
            Ratio défense / social (€/hab.) : {ratioFmt.format(d.ratio)}
          </div>
          {#if d.variation != null && Number.isFinite(d.variation)}
            <div class="hm-tooltip__secondary">
              Variation vs 2002 : {pctVs2002Fmt.format(d.variation * 100)} %
            </div>
          {/if}
        {:else if d.def_pib == null && d.soc_pib == null}
          <div class="hm-tooltip__line hm-tooltip__line--muted">Donnée indisponible</div>
        {/if}
        {#if evLab}
          <div class="hm-tooltip__event">Contexte : {evLab}</div>
        {/if}
      </div>
    {/if}
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
    font-size: 0.65rem;
    margin-bottom: 0.08rem;
  }

  .heatmap-wrap--compact .heatmap-legend-line {
    margin-bottom: 0.12rem;
    font-size: 0.62rem;
  }

  .heatmap-wrap--compact .heatmap-container {
    overflow-x: hidden;
  }

  .heatmap-wrap--compact .heatmap-hint-footer {
    font-size: 0.58rem;
    margin-top: 0.12rem;
  }

  .section-heading {
    margin: 0 0 0.15rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-label, var(--color-text-muted));
  }

  .heatmap-legend-line {
    margin: 0 0 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.6rem;
    font-size: 0.69rem;
    color: var(--color-text-muted);
  }

  .leg::before {
    content: '';
    display: inline-block;
    width: 0.65rem;
    height: 0.45rem;
    margin-right: 0.2rem;
    vertical-align: middle;
    border-radius: 2px;
  }

  .leg--down::before {
    background: var(--hm-low-4, #84a870);
  }

  .leg--mid::before {
    background: var(--hm-mid, #1e2218);
  }

  .leg--up::before {
    background: var(--hm-high-4, #be7648);
  }

  .heatmap-events {
    margin: 0 0 0.5rem;
    font-size: 9px;
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
    width: 100%;
    min-height: 0;
    overflow: hidden;
    border-radius: 6px;
    background: var(--bg-elevated, #e0ddd4);
  }

  .heatmap-container {
    width: 100%;
    min-height: 0;
    overflow-x: auto;
    overflow-y: hidden;
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

  .hm-tooltip {
    position: absolute;
    z-index: 8;
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
