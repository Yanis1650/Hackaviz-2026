<script>
  /**
   * Heatmap : variation du ratio Défense/Social vs 2002 (données figées, largeur responsive).
   */
  import { onMount } from 'svelte';
  import { renderRatioVariationHeatmap, HEATMAP_EVENT_MARKERS } from '../lib/ratioVariationHeatmap.js';

  let { statsStore, year, compact = false } = $props();

  let rootEl = $state(null);
  let svgEl;
  let containerW = $state(260);

  const matrix = $derived(statsStore ? statsStore.getRatioVariationMatrix() : null);

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
    if (!svgEl || !matrix) return;
    renderRatioVariationHeatmap(svgEl, {
      width: containerW,
      matrix,
      compact,
      activeYear: year
    });
  });
</script>

<div class="heatmap-wrap" class:heatmap-wrap--compact={compact}>
  <h4 class="section-heading">Variation du ratio Défense / Social (réf. 2002)</h4>
  <p class="heatmap-legend-line">
    <span class="leg leg--down">Baisse du ratio</span>
    <span class="leg leg--mid">Stable</span>
    <span class="leg leg--up">Hausse</span>
  </p>
  {#if !compact}
    <p class="heatmap-events" aria-hidden="true">
      Repères :
      {#each HEATMAP_EVENT_MARKERS as ev, i}
        {ev.year}{i < HEATMAP_EVENT_MARKERS.length - 1 ? ' · ' : ''}
      {/each}
      (UE, crise, Crimée, Ukraine)
    </p>
  {/if}
  <div id="heatmap-container" class="heatmap-container" bind:this={rootEl}>
    <svg bind:this={svgEl} class="heatmap-svg" aria-label="Heatmap variation ratio par pays et année"
    ></svg>
  </div>
</div>

<style>
  .heatmap-wrap {
    flex: 0 1 auto;
    width: 100%;
    min-height: 0;
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

  .section-heading {
    margin: 0 0 0.15rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .heatmap-legend-line {
    margin: 0 0 0.2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.6rem;
    font-size: 0.69rem;
    color: var(--color-text-dim);
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
    background: #2d6a4f;
  }

  .leg--mid::before {
    background: #e8dcc8;
  }

  .leg--up::before {
    background: #6a1b0f;
  }

  .heatmap-events {
    margin: 0 0 0.25rem;
    font-size: 0.65rem;
    line-height: 1.35;
    color: var(--color-text-dim);
    opacity: 0.9;
  }

  .heatmap-container {
    width: 100%;
    min-height: 0;
    overflow-x: auto;
    overflow-y: visible;
  }

  .heatmap-svg {
    display: block;
    width: 100%;
    min-width: 200px;
  }
</style>
