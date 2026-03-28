<script>
  /**
   * Piste timeline — plage configurable, repères optionnels (grandes dates).
   */
  let {
    year = $bindable(2002),
    minY = 2002,
    maxY = 2024,
    /** Années affichées comme repères discrets (ex. débuts de chapitres). */
    markerYears = /** @type {number[]} */ ([])
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
    aria-valuemin={minY}
    aria-valuemax={maxY}
    aria-valuenow={year}
  />
</div>

<style>
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
      rgba(228, 26, 28, 0.3) 0%,
      rgba(230, 57, 70, 0.75) 100%
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
    background: var(--color-defense);
    cursor: grab;
    border: 1px solid #0a0a0f;
    box-shadow:
      0 0 0 1px rgba(228, 26, 28, 0.4),
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
      0 0 0 2px rgba(230, 57, 70, 0.35),
      0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .timeline-slider::-moz-range-thumb {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--color-defense);
    cursor: grab;
    border: 1px solid #0a0a0f;
    box-shadow:
      0 0 0 1px rgba(228, 26, 28, 0.4),
      0 1px 4px rgba(0, 0, 0, 0.4);
  }
</style>
