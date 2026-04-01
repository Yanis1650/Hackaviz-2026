<script>
  /**
   * Face infos — KPIs, heatmap, scatter (année via timeline).
   */
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import MacroScatterChart from './MacroScatterChart.svelte';
  import RatioVariationHeatmap from './RatioVariationHeatmap.svelte';
  import KpiTweenedValue from './KpiTweenedValue.svelte';
  import { metricMode } from '../lib/metricMode.js';

  let {
    year,
    /** Année sélectionnée sur la timeline (pour stagger à l’arrivée sur cette slide). */
    timelineYear = undefined,
    statsStore,
    embedded = false,
    heatmapHighlightedIso3 = null,
    scatterLegendRegionKey = null,
    scatterSelectedCountryIso3 = null,
    onScatterLegendRegion = undefined,
    onScatterDotClick = undefined,
    /** @type {Map<string, string>|null|undefined} */
    countryNames = null
  } = $props();

  const tl = $derived(timelineYear ?? year);

  let reduceMotion = $state(false);
  onMount(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion = mq.matches;
    const fn = () => {
      reduceMotion = mq.matches;
    };
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  });

  let staggerGen = $state(0);
  let prevTl = $state(/** @type {number | null} */ (null));

  $effect(() => {
    const t = tl;
    const y = year;
    if (t === y && prevTl !== t) {
      staggerGen += 1;
    }
    prevTl = t;
  });

  /** Mode courant synchronisé depuis le store global. */
  let mode = $state('per_capita');
  $effect(() => {
    return metricMode.subscribe((v) => {
      mode = v;
    });
  });

  const kpi = $derived(statsStore.getUeTotalsForMode(year, mode));

  const defNumeric = $derived(kpi.mode === 'pib_pct' ? kpi.defensePct : kpi.defenseMd);
  const socNumeric = $derived(kpi.mode === 'pib_pct' ? kpi.socialPct : kpi.socialMd);
  const kpiDecimals = $derived(kpi.mode === 'pib_pct' ? 2 : 1);
  const kpiSuffix = $derived(kpi.mode === 'pib_pct' ? ' % PIB' : ' Md€');
  const kpiModeKey = $derived(kpi.mode);

  function fadeStagger(/** @type {number} */ delay) {
    return reduceMotion ? { duration: 0 } : { duration: 340, delay };
  }

  function flyStaggerKpi() {
    return reduceMotion
      ? { duration: 0 }
      : { y: 6, duration: 420, delay: 180, easing: cubicOut };
  }
</script>

<article
  id="story-panel"
  class="info-face-card"
  class:info-face-card--embedded={embedded}
>
  {#key staggerGen}
    <div
      id="kpi-container"
      class="kpi-container"
      in:fly={flyStaggerKpi()}
    >
      <div class="kpi kpi--defense">
        <span class="kpi-label">Total UE Défense</span>
        <KpiTweenedValue
          value={defNumeric}
          decimals={kpiDecimals}
          suffix={kpiSuffix}
          metricMode={kpiModeKey}
          {reduceMotion}
        />
      </div>
      <div class="kpi kpi--social">
        <span class="kpi-label">Total UE Social</span>
        <KpiTweenedValue
          value={socNumeric}
          decimals={kpiDecimals}
          suffix={kpiSuffix}
          metricMode={kpiModeKey}
          {reduceMotion}
        />
      </div>
    </div>
  {/key}

  {#key staggerGen}
    <div class="fresque-frame" in:fade={fadeStagger(280)}>
      <RatioVariationHeatmap
        {statsStore}
        {year}
        compact={embedded}
        highlightedIso3={heatmapHighlightedIso3}
        {countryNames}
      />
    </div>
  {/key}

  <div class="insight-stack">
    {#key staggerGen}
      <div class="scatter-section">
        <div class="scatter-section__plot" in:fade={fadeStagger(320)}>
          <MacroScatterChart
            {year}
            {statsStore}
            embedded
            {countryNames}
            selectedRegion={scatterLegendRegionKey}
            onLegendRegionClick={onScatterLegendRegion}
            selectedDotIso3={scatterSelectedCountryIso3}
            onDotClick={onScatterDotClick}
          />
        </div>
      </div>
    {/key}
  </div>
</article>

<style>
  .info-face-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.75rem 0.85rem;
    overflow: hidden;
    min-height: 0;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  }

  .kpi-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: stretch;
    gap: 0.5rem 0.75rem;
    flex-shrink: 0;
  }

  .kpi {
    flex: 1 1 120px;
    min-width: 0;
    padding: 0.62rem 0.75rem;
    border-radius: 8px;
    background: transparent;
    border: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .kpi-label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-label, var(--color-text-muted));
  }

  .fresque-frame {
    flex-shrink: 0;
    width: 100%;
    min-height: 0;
    padding: 0.62rem 0.75rem 0.85rem;
    margin-bottom: 0.35rem;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    background: transparent;
    box-shadow: none;
    /* Laisser dépasser le tooltip heatmap (évite le clip sous la légende / bords). */
    overflow: visible;
  }

  .info-face-card--embedded .fresque-frame {
    padding: 0.5rem 0.62rem 0.72rem;
    border-radius: 8px;
  }

  .fresque-frame :global(#heatmap-container) {
    width: 100%;
    min-height: 0;
  }

  :global(.kpi-value) {
    font-size: clamp(1.05rem, 2.9vw, 1.38rem);
    font-weight: 600;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-data, inherit);
  }

  .kpi--defense :global(.kpi-value) {
    color: var(--color-defense);
  }

  .kpi--social :global(.kpi-value) {
    color: var(--color-social);
  }

  .insight-stack {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.35rem;
    padding: 0.85rem 0.75rem 0.72rem;
    border: 1px solid var(--color-border);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    background: transparent;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
  }

  .scatter-section {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .scatter-section__plot {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .scatter-section__plot :global(#scatter-container) {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .info-face-card::-webkit-scrollbar {
    width: 4px;
  }

  .info-face-card::-webkit-scrollbar-track {
    background: transparent;
  }

  .info-face-card::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 2px;
  }

  .info-face-card--embedded {
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    padding: 0.5rem 0.62rem;
    gap: 0.75rem;
    flex: 1;
    min-height: 0;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .info-face-card--embedded .kpi-container {
    gap: 0.35rem 0.5rem;
  }

  .info-face-card--embedded .kpi {
    padding: 0.5rem 0.62rem;
  }

</style>
