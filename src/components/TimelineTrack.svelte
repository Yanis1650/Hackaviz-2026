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
            ? '#4a9eff'
            : ev.kind === 'eco'
              ? '#f59e0b'
              : '#c0392b'}
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
      Glisser vers la droite pour avancer dans le temps · Tab puis flèches ← → pour l’année
    </span>
  </div>

  <div class="timeline-track-wrap">
    {#each markerYears as my (my)}
      {#if my >= minY && my <= maxY}
        <span
          class="track-marker"
          style:left="{markerLeftPct(my)}%"
          aria-hidden="true"
        ></span>
      {/if}
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
</div>

<style>
  .timeline-stack {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    width: 100%;
  }

  .timeline-hint-row {
    display: flex;
    align-items: center;
    gap: 0.32rem;
    justify-content: flex-end;
    flex-wrap: wrap;
    padding: 0 0.05rem 0.02rem;
    margin-top: -0.02rem;
  }

  .timeline-hint-icon {
    flex-shrink: 0;
    color: rgba(200, 206, 220, 0.55);
  }

  .timeline-hint-text {
    font-size: 0.54rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.25;
    color: rgba(168, 178, 198, 0.78);
    text-align: right;
    max-width: 18rem;
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
    color: rgba(240, 242, 248, 0.82);
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
    --pyramid-fill: #4a9eff;
    color: rgba(154, 198, 255, 0.95);
  }

  .timeline-event--eco {
    --pyramid-fill: #f59e0b;
    color: rgba(253, 214, 150, 0.95);
  }

  .timeline-event--war {
    --pyramid-fill: #c0392b;
    color: rgba(240, 160, 150, 0.95);
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
    outline: 2px solid rgba(255, 255, 255, 0.35);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .timeline-track-wrap {
    position: relative;
    width: 100%;
    height: 12px;
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
    height: 2px;
    margin-top: -1px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.45);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
    pointer-events: none;
    z-index: 0;
  }

  .track-marker {
    position: absolute;
    top: 50%;
    width: 1px;
    height: 7px;
    margin-top: -3.5px;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.22);
    pointer-events: none;
    z-index: 1;
    border-radius: 1px;
  }

  .timeline-track-fill {
    position: absolute;
    left: 0;
    top: 50%;
    height: 2px;
    margin-top: -1px;
    border-radius: 999px;
    z-index: 2;
    background: linear-gradient(
      90deg,
      rgba(192, 57, 43, 0.35) 0%,
      rgba(192, 57, 43, 0.78) 100%
    );
    pointer-events: none;
    transition: width 0.08s ease-out;
  }

  .timeline-slider {
    -webkit-appearance: none;
    appearance: none;
    position: relative;
    z-index: 3;
    width: 100%;
    height: 12px;
    margin: 0;
    background: transparent;
    cursor: pointer;
    outline: none;
  }

  .timeline-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #c0392b;
    cursor: grab;
    border: 1px solid #0a0a0f;
    box-shadow:
      0 0 0 1px rgba(192, 57, 43, 0.45),
      0 1px 4px rgba(0, 0, 0, 0.4);
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .timeline-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.04);
  }

  .timeline-slider::-webkit-slider-thumb:hover {
    transform: scale(1.06);
    box-shadow:
      0 0 0 2px rgba(192, 57, 43, 0.4),
      0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .timeline-slider::-moz-range-thumb {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #c0392b;
    cursor: grab;
    border: 1px solid #0a0a0f;
    box-shadow:
      0 0 0 1px rgba(192, 57, 43, 0.45),
      0 1px 4px rgba(0, 0, 0, 0.4);
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
