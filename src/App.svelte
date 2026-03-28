<script>
  /**
   * Racine — données, année, fenêtre de vue verticale + timeline.
   */
  import { onMount } from 'svelte';
  import { createStatsStore } from './lib/statsStore.js';
  import { createRatioScale } from './lib/scales.js';
  import CardCarousel from './components/CardCarousel.svelte';
  import Timeline from './components/Timeline.svelte';
  import { translateCountryNameEnToFr } from './lib/paysEnToFr.js';
  import { metricMode, basculerMetrique } from './lib/metricMode.js';

  let geoData = $state(null);
  let statsStore = $state(null);
  let countryNames = $state(null);
  let year = $state(2002);
  let loading = $state(true);
  let error = $state(null);
  /** Hauteur mesurée de #view-window (une slide = cette hauteur). */
  let viewWindowH = $state(0);
  let timelineZoneH = $state(0);

  /** Tant que bind:clientHeight n’a pas réagi, estimer pour éviter des slides à hauteur nulle. */
  const slideHeightPx = $derived(
    viewWindowH > 0
      ? viewWindowH
      : typeof window !== 'undefined'
        ? Math.max(320, window.innerHeight - 96)
        : 640
  );

  const ratioColorScale = createRatioScale();

  function buildCountryNames(geo) {
    const m = new Map();
    for (const f of geo.features) {
      const iso = f.properties.ISO3;
      if (iso && !m.has(iso)) {
        m.set(iso, translateCountryNameEnToFr(f.properties.NAME));
      }
    }
    return m;
  }

  onMount(async () => {
    try {
      const [geo, rawStats] = await Promise.all([
        fetch('./data/carte.geojson').then((r) => r.json()),
        fetch('./data/processed_data.json').then((r) => r.json())
      ]);
      geoData = geo;
      statsStore = createStatsStore(rawStats);
      countryNames = buildCountryNames(geo);
    } catch (err) {
      error = err.message;
      console.error('Erreur de chargement des données :', err);
    } finally {
      loading = false;
    }
  });
</script>

<div
  class="app-layout"
  style:--slide-h="{slideHeightPx}px"
  style:--timeline-zone-h="{timelineZoneH}px"
>
  {#if loading}
    <div class="loader">Chargement des données…</div>
  {:else if error}
    <div class="loader error">Erreur : {error}</div>
  {:else}
    <div class="story-stack">
      <div id="view-window" class="view-window" bind:clientHeight={viewWindowH}>
        <CardCarousel
          {year}
          slideHeightPx={slideHeightPx}
          {geoData}
          {statsStore}
          {countryNames}
          {ratioColorScale}
        />
      </div>
      <div class="timeline-zone" bind:clientHeight={timelineZoneH}>
        <div class="metric-toggle-row">
          <button
            class="metric-toggle"
            class:metric-toggle--active={$metricMode === 'pib_pct'}
            onclick={basculerMetrique}
            title="Basculer entre dépenses nominales et % du PIB"
          >
            {#if $metricMode === 'per_capita'}
              €/hab. <span class="metric-toggle__badge">→ % PIB</span>
            {:else}
              % du PIB <span class="metric-toggle__badge">→ €/hab.</span>
            {/if}
          </button>
        </div>
        <Timeline bind:year />
      </div>
    </div>
  {/if}
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }

  .story-stack {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .view-window {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    position: relative;
    width: 100%;
  }

  .timeline-zone {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    padding: 0 0.5rem 0.65rem;
    background: transparent;
    pointer-events: none;
  }

  .timeline-zone :global(.narrative-bar) {
    pointer-events: auto;
  }

  .metric-toggle-row {
    display: flex;
    justify-content: center;
    pointer-events: auto;
    margin-bottom: 0.25rem;
  }

  .metric-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.75rem;
    background: rgba(20, 24, 40, 0.82);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
  }

  .metric-toggle:hover {
    border-color: rgba(255, 255, 255, 0.3);
    color: var(--color-text);
    background: rgba(30, 36, 58, 0.9);
  }

  .metric-toggle--active {
    border-color: rgba(100, 160, 255, 0.45);
    color: #7ab4ff;
    background: rgba(20, 30, 60, 0.88);
  }

  .metric-toggle__badge {
    font-size: 0.62rem;
    opacity: 0.55;
    font-weight: 400;
  }

  .loader {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-size: 1.1rem;
    color: var(--color-text-muted);
  }

  .loader.error {
    color: var(--color-defense);
  }
</style>
