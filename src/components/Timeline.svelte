<script>
  /**
   * Barre narrative : année + ère à gauche ; piste (événements + slider) à droite.
   */
  import TimelineTrack from './TimelineTrack.svelte';
  import { NARRATION, obtenirPeriode } from '../lib/narration.js';

  let { year = $bindable(2002) } = $props();

  const GLOBAL_MIN = 2002;
  const GLOBAL_MAX = 2024;
  const markerYears = NARRATION.map((p) => p.annees[0]);

  const periode = $derived(obtenirPeriode(year));
</script>

<div class="narrative-bar">
  <div
    class="status-col"
    style:--status-accent={periode.accent}
    aria-live="polite"
  >
    <span class="status-year">{year}</span>
    <span class="status-era">{periode.titreCourt}</span>
  </div>

  <div class="nav-col">
    <div class="track-slot">
      <TimelineTrack bind:year minY={GLOBAL_MIN} maxY={GLOBAL_MAX} {markerYears} />
    </div>
  </div>
</div>

<style>
  .narrative-bar {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0.55rem 0.65rem;
    width: 100%;
    max-width: min(720px, 94vw);
    margin: 0 auto;
    padding: 0.35rem 0.5rem 0.38rem;
    border-radius: 10px;
    background: rgba(12, 14, 24, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.32),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
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
    color: var(--status-accent, #e68a4f);
    letter-spacing: 0.02em;
  }

  .status-era {
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--status-accent, #e68a4f);
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

  @media (max-width: 480px) {
    .narrative-bar {
      flex-wrap: wrap;
    }

    .status-col {
      flex-direction: row;
      align-items: baseline;
      gap: 0.35rem;
      width: 100%;
      justify-content: flex-start;
      min-width: 0;
    }

    .status-era {
      max-width: none;
    }
  }
</style>
