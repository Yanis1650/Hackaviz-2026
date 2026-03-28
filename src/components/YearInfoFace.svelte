<script>
  /**
   * Face infos — narration, KPIs UE, ratio agrégé, heatmap, scatter (année via timeline).
   */
  import { obtenirPeriode } from '../lib/narration.js';
  import MacroScatterChart from './MacroScatterChart.svelte';
  import RatioVariationHeatmap from './RatioVariationHeatmap.svelte';
  import { metricMode } from '../lib/metricMode.js';

  let {
    year,
    statsStore,
    embedded = false,
    scatterLegendRegionKey = null,
    scatterSelectedCountryIso3 = null,
    onScatterLegendRegion = undefined,
    onScatterDotClick = undefined,
    /** @type {Map<string, string>|null|undefined} */
    countryNames = null
  } = $props();

  /** Mode courant synchronisé depuis le store global. */
  let mode = $state('per_capita');
  $effect(() => {
    return metricMode.subscribe((v) => { mode = v; });
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

  /** Formate la valeur KPI selon le mode actif. */
  function fmtKpi(kpiData, cle) {
    if (kpiData.mode === 'pib_pct') {
      const v = cle === 'def' ? kpiData.defensePct : kpiData.socialPct;
      return `${v.toFixed(2)} % PIB`;
    }
    const v = cle === 'def' ? kpiData.defenseMd : kpiData.socialMd;
    return `${v.toFixed(1)} Md€`;
  }
</script>

<article
  id="story-panel"
  class="info-face-card"
  class:info-face-card--embedded={embedded}
>
  <div
    class="narration"
    style:border-top-color={periode.accent}
    style:--narration-accent={periode.accent}
  >
    <h3 class="narration-title">{periode.titre}</h3>
    <p class="narration-text">{periode.texte}</p>
  </div>

  <div id="kpi-container" class="kpi-container">
    <div class="kpi kpi--defense">
      <span class="kpi-label">Total UE Défense</span>
      <span class="kpi-value">{fmtKpi(kpi, 'def')}</span>
    </div>
    <div class="kpi kpi--social">
      <span class="kpi-label">Total UE Social</span>
      <span class="kpi-value">{fmtKpi(kpi, 'soc')}</span>
    </div>
  </div>

  <p class="kpi-narrative">{kpiRatioPhrase}</p>

  <RatioVariationHeatmap {statsStore} />

  <div class="scatter-section">
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
</article>

<style>
  .info-face-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.85rem 1rem;
    overflow-y: auto;
    min-height: 0;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .narration {
    background: var(--color-bg-panel);
    border: 1px solid var(--color-border);
    border-top: 3px solid var(--color-accent);
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
    background: var(--color-bg-panel);
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
    color: var(--color-text-muted);
  }

  .kpi-value {
    font-size: clamp(1.05rem, 2.9vw, 1.38rem);
    font-weight: 600;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
  }

  .kpi--defense .kpi-value {
    color: var(--color-defense);
  }

  .kpi--social .kpi-value {
    color: var(--color-social);
  }

  .kpi-narrative {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.45;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .scatter-section {
    flex: 2 1 240px;
    min-height: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .scatter-section :global(#scatter-container) {
    min-height: 0;
  }

  .scatter-section :global(.scatter-wrap) {
    flex-shrink: 0;
  }

  .info-face-card :global(#heatmap-container) {
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
    padding: 0.38rem 0.4rem;
    gap: 0.4rem;
    flex: 1;
    min-height: 0;
    width: 100%;
    min-width: 0;
  }
</style>
