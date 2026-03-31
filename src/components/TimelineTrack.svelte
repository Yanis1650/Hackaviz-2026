<script>
  /**
   * Piste timeline + pyramides événements.
   * Couleurs (--pyramid-fill en inline + classes) : bleu = UE, orange = crise éco, rouge = guerre.
   */
  import { TIMELINE_EVENTS } from '../lib/narration.js';

  let {
    year = $bindable(2002),
    minY = 2002,
    maxY = 2024,
    /** Années affichées comme repères discrets (ex. débuts de chapitres). */
    markerYears = /** @type {number[]} */ ([]),
    /** @type {typeof TIMELINE_EVENTS} */
    events = TIMELINE_EVENTS
  } = $props();

  const fillPct = $derived(
    maxY <= minY ? 100 : ((year - minY) / (maxY - minY)) * 100
  );

  /** @param {number} y */
  function markerLeftPct(y) {
    if (maxY <= minY) return 0;
    return ((y - minY) / (maxY - minY)) * 100;
  }

  /** Une graduation par année (pas seulement les checkpoints narratifs). */
  const allYears = $derived(
    Array.from({ length: Math.max(0, maxY - minY + 1) }, (_, i) => minY + i)
  );

  const chapterYearSet = $derived(new Set(markerYears));
</script>

<div class="timeline-stack">
  <div class="timeline-events" aria-label="Événements marquants">
    {#each events as ev (ev.year + ev.label)}
      {#if ev.year >= minY && ev.year <= maxY}
        <button
          type="button"
          class="timeline-event"
          class:timeline-event--ue={ev.kind === 'ue'}
          class:timeline-event--eco={ev.kind === 'eco'}
          class:timeline-event--war={ev.kind === 'war'}
          class:timeline-event--active={year === ev.year}
          style:left="{markerLeftPct(ev.year)}%"
          style:--pyramid-fill={ev.kind === 'ue'
            ? '#3a6bc4'
            : ev.kind === 'eco'
              ? '#c08020'
              : '#c45a38'}
          title="Aller à {ev.year} — {ev.label}"
          aria-label="Aller à {ev.year}, {ev.label}"
          aria-pressed={year === ev.year}
          onclick={() => {
            year = ev.year;
          }}
        >
          <span class="timeline-event__label">{ev.label}</span>
          <span class="timeline-event__pyramid" aria-hidden="true"></span>
        </button>
      {/if}
    {/each}
  </div>

  <div class="timeline-track-wrap">
    {#each allYears as y (y)}
      <span
        class="track-tick"
        class:track-tick--chapter={chapterYearSet.has(y)}
        style:left="{markerLeftPct(y)}%"
        aria-hidden="true"
      ></span>
    {/each}
    <div class="timeline-track-fill" style="width: {fillPct}%" aria-hidden="true"></div>
    <input
      id="timeline"
      type="range"
      class="timeline-slider"
      min={minY}
      max={maxY}
      step={1}
      bind:value={year}
      aria-label="Année sélectionnée"
      aria-describedby="timeline-slider-hint"
      aria-valuemin={minY}
      aria-valuemax={maxY}
      aria-valuenow={year}
    />
  </div>

  <div class="timeline-hint-row">
    <svg
      class="timeline-hint-icon"
      width="16"
      height="10"
      viewBox="0 0 16 10"
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points="1,2 5,5 1,8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.35"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.9"
      />
      <polyline
        points="6,2 10,5 6,8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.35"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.9"
      />
    </svg>
    <span id="timeline-slider-hint" class="timeline-hint-text">
      Chaque cran = une année · glisser vers la droite pour avancer · Tab puis ← →
    </span>
  </div>
</div>

<style>
  .timeline-stack {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    width: 100%;
  }

  .timeline-hint-row {
    display: flex;
    align-items: flex-start;
    gap: 0.35rem;
    justify-content: flex-start;
    width: 100%;
    padding: 0.06rem 0.05rem 0;
    box-sizing: border-box;
  }

  .timeline-hint-icon {
    flex-shrink: 0;
    margin-top: 0.12em;
    color: rgba(90, 86, 72, 0.55);
  }

  .timeline-hint-text {
    flex: 1;
    min-width: 0;
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    line-height: 1.35;
    color: rgba(90, 86, 72, 0.82);
    text-align: left;
    text-wrap: balance;
  }

  .timeline-events {
    position: relative;
    width: 100%;
    height: 1.72rem;
    pointer-events: none;
  }

  .timeline-event {
    position: absolute;
    bottom: 0;
    left: 0;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.12rem;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    pointer-events: auto;
    font: inherit;
    color: rgba(26, 26, 20, 0.82);
    max-width: 4.2rem;
  }

  .timeline-event__label {
    font-size: 0.48rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.1;
    text-align: center;
    text-wrap: balance;
    color: inherit;
  }

  .timeline-event__pyramid {
    display: block;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid var(--pyramid-fill, #888);
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
    transition:
      transform 0.12s ease,
      filter 0.12s ease;
  }

  .timeline-event--ue {
    --pyramid-fill: #3a6bc4;
    color: rgba(58, 107, 196, 0.95);
  }

  .timeline-event--eco {
    --pyramid-fill: #c08020;
    color: rgba(160, 100, 20, 0.95);
  }

  .timeline-event--war {
    --pyramid-fill: #c45a38;
    color: rgba(196, 90, 56, 0.95);
  }

  .timeline-event:hover .timeline-event__pyramid,
  .timeline-event:focus-visible .timeline-event__pyramid {
    transform: scale(1.12);
    filter: drop-shadow(0 0 4px color-mix(in srgb, var(--pyramid-fill) 55%, transparent));
  }

  .timeline-event--active .timeline-event__pyramid {
    transform: scale(1.18);
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--pyramid-fill) 70%, transparent));
  }

  .timeline-event:focus-visible {
    outline: 2px solid rgba(42, 96, 64, 0.45);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .timeline-track-wrap {
    position: relative;
    width: 100%;
    height: 18px;
    display: flex;
    align-items: center;
    border-radius: 999px;
  }

  .timeline-track-wrap::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 3px;
    margin-top: -1.5px;
    border-radius: 999px;
    background: var(--slider-track, #c4c0b4);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    z-index: 0;
  }

  /* Graduation annuelle — bien visible (chaque pas = une année). */
  .track-tick {
    position: absolute;
    top: 50%;
    width: 2px;
    height: 6px;
    margin-top: -3px;
    transform: translateX(-50%);
    background: rgba(26, 26, 20, 0.28);
    pointer-events: none;
    z-index: 1;
    border-radius: 1px;
    box-shadow: 0 0 1px rgba(0, 0, 0, 0.08);
  }

  /* Débuts de chapitre : même repères que la heatmap / pyramides. */
  .track-tick--chapter {
    width: 2px;
    height: 11px;
    margin-top: -5.5px;
    background: rgba(42, 96, 64, 0.55);
    box-shadow:
      0 0 0 1px rgba(42, 96, 64, 0.12),
      0 1px 2px rgba(0, 0, 0, 0.12);
  }

  .timeline-track-fill {
    position: absolute;
    left: 0;
    top: 50%;
    height: 3px;
    margin-top: -1.5px;
    border-radius: 999px;
    z-index: 2;
    background: linear-gradient(
      90deg,
      rgba(42, 96, 64, 0.35) 0%,
      rgba(196, 90, 56, 0.85) 100%
    );
    box-shadow: 0 0 8px rgba(196, 90, 56, 0.2);
    pointer-events: none;
    transition: width 0.08s ease-out;
  }

  .timeline-slider {
    -webkit-appearance: none;
    appearance: none;
    position: relative;
    z-index: 3;
    width: 100%;
    height: 18px;
    margin: 0;
    background: transparent;
    cursor: pointer;
    outline: none;
  }

  .timeline-slider::-webkit-slider-runnable-track {
    height: 3px;
    border-radius: 999px;
    background: transparent;
  }

  /* Firefox : piste explicite pour que le thumb ne soit pas écrasé / invisible. */
  .timeline-slider::-moz-range-track {
    height: 3px;
    background: transparent;
    border: none;
  }

  .timeline-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -5.5px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 32% 22%,
      #e89878 0%,
      var(--slider-cursor, #c45a38) 48%,
      #9a4028 100%
    );
    cursor: grab;
    border: 2px solid rgba(255, 252, 248, 0.95);
    box-shadow:
      0 0 10px 3px rgba(196, 90, 56, 0.45),
      0 0 18px 4px rgba(196, 90, 56, 0.22),
      0 2px 6px rgba(0, 0, 0, 0.12);
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .timeline-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.08);
  }

  .timeline-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow:
      0 0 12px 4px rgba(196, 90, 56, 0.5),
      0 0 22px 6px rgba(196, 90, 56, 0.25),
      0 2px 7px rgba(0, 0, 0, 0.12);
  }

  .timeline-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(255, 252, 248, 0.95);
    background: radial-gradient(
      circle at 32% 22%,
      #e89878 0%,
      var(--slider-cursor, #c45a38) 48%,
      #9a4028 100%
    );
    cursor: grab;
    box-shadow:
      0 0 10px 3px rgba(196, 90, 56, 0.45),
      0 0 18px 4px rgba(196, 90, 56, 0.22),
      0 2px 6px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 380px) {
    .timeline-event__label {
      font-size: 0.42rem;
    }

    .timeline-events {
      height: 1.55rem;
    }
  }
</style>
