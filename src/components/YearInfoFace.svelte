<script>
  /**
   * Face infos — narration, KPIs UE, ratio agrégé, heatmap, scatter (année via timeline).
   */
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { obtenirPeriode } from '../lib/narration.js';
  import MacroScatterChart from './MacroScatterChart.svelte';
  import ScatterBottomInsights from './ScatterBottomInsights.svelte';
  import RatioVariationHeatmap from './RatioVariationHeatmap.svelte';
  import KpiTweenedValue from './KpiTweenedValue.svelte';
  import { metricMode } from '../lib/metricMode.js';

  let {
    year,
    /** Année sélectionnée sur la timeline (pour stagger à l’arrivée sur cette slide). */
    timelineYear = undefined,
    statsStore,
    embedded = false,
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

  const periode = $derived(obtenirPeriode(year));
  const kpi = $derived(statsStore.getUeTotalsForMode(year, mode));

  /** Phrase ratio agrégé UE (social / défense). */
  const kpiRatioPhrase = $derived.by(() => {
    const def = kpi.mode === 'pib_pct' ? kpi.defensePct : kpi.defenseMd;
    const soc = kpi.mode === 'pib_pct' ? kpi.socialPct : kpi.socialMd;
    if (def == null || def < 1e-4) {
      return 'Ratio agrégé indisponible (défense UE quasi nulle).';
    }
    const mult = soc / def;
    const nStr = mult < 10 ? mult.toFixed(1) : String(Math.round(mult));
    return `À l’échelle UE, la protection sociale totalise environ ${nStr}× la défense cette année.`;
  });

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

  function flyStaggerBars(/** @type {number} */ delay) {
    return reduceMotion ? { duration: 0 } : { y: 5, duration: 400, delay, easing: cubicOut };
  }
</script>

<article
  id="story-panel"
  class="info-face-card"
  class:info-face-card--embedded={embedded}
>
  <div
    class="narration"
    style:--narration-accent={periode.accent}
    style:box-shadow={`inset 0 3px 0 ${periode.accent}`}
  >
    <h3 class="narration-title">{periode.titre}</h3>
    <p class="narration-text">{periode.texte}</p>
  </div>

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

  <p class="kpi-narrative">{kpiRatioPhrase}</p>

  <div class="insight-stack">
    {#key staggerGen}
      <div class="heatmap-stagger" in:fade={fadeStagger(320)}>
        <RatioVariationHeatmap {statsStore} {year} compact={embedded} />
      </div>

      <div class="scatter-section">
        <div class="scatter-section__plot" in:fade={fadeStagger(480)}>
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
        <div class="bars-stagger" in:fly={flyStaggerBars(620)}>
          <ScatterBottomInsights {year} {statsStore} {countryNames} />
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
    gap: 0.5rem;
    padding: 0.85rem 1rem;
    overflow: hidden;
    min-height: 0;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .narration {
    border: none;
    background: var(--color-bg-insight);
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    flex-shrink: 0;
  }

  .narration-title {
    margin: 0 0 0.38rem;
    font-size: clamp(0.88rem, 2.4vw, 0.95rem);
    font-weight: 800;
    letter-spacing: 0.06em;
    line-height: 1.25;
    text-transform: uppercase;
    color: var(--narration-accent, #e8eaf0);
  }

  .narration-text {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.55;
    color: #a8b4cc;
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
    padding: 0.5rem 0.65rem;
    border-radius: 8px;
    background: var(--color-bg-insight);
    border: 0.5px solid var(--color-kpi-border);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .kpi-label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .heatmap-stagger {
    width: 100%;
    min-height: 0;
    flex-shrink: 0;
  }

  .bars-stagger {
    width: 100%;
    flex-shrink: 0;
  }

  :global(.kpi-value) {
    font-size: clamp(1.05rem, 2.9vw, 1.38rem);
    font-weight: 600;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
  }

  .kpi--defense :global(.kpi-value) {
    color: var(--color-defense);
  }

  .kpi--social :global(.kpi-value) {
    color: var(--color-social);
  }

  .kpi-narrative {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.45;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .insight-stack {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.4rem 0.45rem 0.42rem;
    border: none;
    border-radius: 8px;
    background: var(--color-bg-insight);
  }

  .scatter-section {
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
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

  .insight-stack :global(#heatmap-container) {
    width: 100%;
    min-height: 0;
  }

  .info-face-card::-webkit-scrollbar {
    width: 4px;
  }

  .info-face-card::-webkit-scrollbar-track {
    background: transparent;
  }

  .info-face-card::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }

  .info-face-card--embedded {
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    padding: 0.28rem 0.32rem;
    gap: 0.28rem;
    flex: 1;
    min-height: 0;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .info-face-card--embedded .narration {
    padding: 0.5rem 0.65rem;
  }

  .info-face-card--embedded .narration-text {
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .info-face-card--embedded .kpi-container {
    gap: 0.35rem 0.5rem;
  }

  .info-face-card--embedded .kpi {
    padding: 0.38rem 0.5rem;
  }

  .info-face-card--embedded .kpi-narrative {
    font-size: 0.68rem;
    line-height: 1.35;
  }
</style>
