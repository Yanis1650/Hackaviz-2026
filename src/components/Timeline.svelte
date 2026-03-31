<script>
  /**
   * Barre narrative pleine largeur : année + ère ; piste temps ; bascule unité globale à droite (option A).
   */
  import TimelineTrack from './TimelineTrack.svelte';
  import { NARRATION, obtenirPeriode } from '../lib/narration.js';
  import { metricMode, basculerMetrique } from '../lib/metricMode.js';

  let { year = $bindable(2002) } = $props();

  const GLOBAL_MIN = 2002;
  const GLOBAL_MAX = 2024;
  const markerYears = NARRATION.map((p) => p.annees[0]);

  const periode = $derived(obtenirPeriode(year));
</script>

<div class="narrative-bar">
  <div class="status-col" aria-live="polite">
    <span class="status-year">{year}</span>
    <span class="status-era">{periode.titreCourt}</span>
  </div>

  <div class="nav-col">
    <div class="track-slot">
      <TimelineTrack bind:year minY={GLOBAL_MIN} maxY={GLOBAL_MAX} {markerYears} />
    </div>
  </div>

  <div class="metric-slot">
    <button
      type="button"
      class="metric-toggle"
      class:metric-toggle--active={$metricMode === 'pib_pct'}
      onclick={basculerMetrique}
      title="Unité affichée sur toute la vue : €/habitant ou % du PIB"
    >
      {#if $metricMode === 'per_capita'}
        €/hab. <span class="metric-toggle__badge">→ % PIB</span>
      {:else}
        % du PIB <span class="metric-toggle__badge">→ €/hab.</span>
      {/if}
    </button>
  </div>
</div>

<style>
  .narrative-bar {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0.55rem 0.75rem;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0.42rem 0.62rem 0.45rem;
    border-radius: 10px;
    background: var(--bg-surface, #eae8e0);
    border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
    box-shadow:
      0 2px 12px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.65);
    box-sizing: border-box;
  }

  .status-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    min-width: 3.4rem;
    padding: 0 0.15rem;
    text-align: center;
    gap: 0.06rem;
  }

  .status-year {
    font-size: clamp(1.05rem, 3.2vw, 1.35rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    color: var(--slider-year-color, #2a6040);
    letter-spacing: 0.02em;
  }

  .status-era {
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--slider-phase-color, #8a8278);
    line-height: 1.15;
    max-width: 6.5rem;
    opacity: 0.95;
  }

  .nav-col {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
    justify-content: center;
  }

  .track-slot {
    width: 100%;
    min-width: 0;
    padding-top: 0.02rem;
  }

  .metric-slot {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    align-self: center;
    margin-left: auto;
    min-width: 0;
  }

  .metric-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    height: 30px;
    min-height: 30px;
    padding: 0.35rem 0.75rem;
    box-sizing: border-box;
    background: transparent;
    border: 1px solid var(--btn-border, rgba(232, 197, 71, 0.3));
    border-radius: 999px;
    color: var(--color-text-muted);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    white-space: nowrap;
    transition:
      border-color 0.15s ease,
      color 0.15s ease,
      background 0.15s ease,
      box-shadow 0.15s ease;
  }

  .metric-toggle:hover {
    border-color: rgba(232, 197, 71, 0.5);
    color: var(--color-text-data, #1a1a14);
    background: var(--btn-bg, rgba(232, 197, 71, 0.12));
  }

  .metric-toggle--active {
    border-color: rgba(232, 197, 71, 0.55);
    color: var(--btn-text, #e8c547);
    background: var(--btn-bg, rgba(232, 197, 71, 0.12));
    box-shadow: 0 0 0 1px rgba(232, 197, 71, 0.22);
  }

  .metric-toggle__badge {
    font-size: 0.6rem;
    opacity: 0.72;
    font-weight: 500;
  }

  @media (max-width: 520px) {
    .narrative-bar {
      flex-wrap: wrap;
    }

    .status-col {
      flex-direction: row;
      align-items: baseline;
      gap: 0.35rem;
      width: auto;
      justify-content: flex-start;
      min-width: 0;
    }

    .status-era {
      max-width: none;
    }

    .nav-col {
      order: 3;
      flex: 1 1 100%;
      min-width: 0;
    }

    .metric-slot {
      order: 2;
      margin-left: auto;
      align-self: center;
    }
  }
</style>
