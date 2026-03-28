<script>
  /**
   * Sous le scatter : barres « top 5 » variations défense/PIB depuis 2002.
   * Les chiffres agrégés restent en KPI / ligne ratio / nuage plus haut.
   */
  import { REGION_COLORS } from '../lib/countryRegions.js';
  import {
    getTopDefensePibDeltaRows,
    getMaxDeltaForScale,
    REF_YEAR
  } from '../lib/scatterBottomInsights.js';

  let {
    year,
    statsStore,
    /** @type {Map<string, string>|null|undefined} */
    countryNames = null
  } = $props();

  const barRows = $derived(getTopDefensePibDeltaRows(statsStore, year, 5));
  const xMax = $derived(getMaxDeltaForScale(barRows));

  let chartEl = $state(/** @type {HTMLDivElement | null} */ (null));
  let tip = $state(
    /** @type {{ show: boolean, x: number, y: number, name: string, value: string }} */ ({
      show: false,
      x: 0,
      y: 0,
      name: '',
      value: ''
    })
  );

  /** @param {number} d */
  function fmtDelta(d) {
    const sign = d >= 0 ? '+' : '';
    return `${sign}${d.toFixed(1).replace('.', ',')} pp`;
  }

  /** @param {{ iso3: string, code2: string }} r */
  function labelPays(r) {
    return countryNames?.get(r.iso3) ?? r.code2;
  }

  /** @param {{ iso3: string, code2: string, deltaPp: number }} r @param {MouseEvent} ev */
  function onBarEnter(r, ev) {
    if (!chartEl) return;
    const rect = chartEl.getBoundingClientRect();
    tip = {
      show: true,
      x: ev.clientX - rect.left + 10,
      y: ev.clientY - rect.top - 28,
      name: labelPays(r),
      value: fmtDelta(r.deltaPp)
    };
  }

  /** @param {MouseEvent} ev */
  function onBarMove(ev) {
    if (!tip.show || !chartEl) return;
    const rect = chartEl.getBoundingClientRect();
    tip = {
      ...tip,
      x: ev.clientX - rect.left + 10,
      y: ev.clientY - rect.top - 28
    };
  }

  function onBarLeave() {
    tip = { show: false, x: 0, y: 0, name: '', value: '' };
  }

  const barsAria = $derived.by(() => {
    if (barRows.length === 0) return 'Aucune variation affichée.';
    const parts = barRows.map(
      (r) => `${r.code2} ${fmtDelta(r.deltaPp)}`
    );
    return `Top variations défense en points de pourcentage du PIB depuis ${REF_YEAR} : ${parts.join(', ')}.`;
  });
</script>

<div class="scatter-bottom" aria-label="Variation relative de la dépense défense depuis 2002">
  <h4 class="bars-heading">
    Variation dépense défense {REF_YEAR} → {year} (points de % PIB)
  </h4>
  <div
    class="bars-chart"
    bind:this={chartEl}
    role="img"
    aria-label={barsAria}
  >
    {#each barRows as r (r.iso3)}
      <div
        class="bar-line"
        role="group"
        aria-label={`${labelPays(r)}, variation ${fmtDelta(r.deltaPp)}`}
        onmouseenter={(e) => onBarEnter(r, e)}
        onmousemove={onBarMove}
        onmouseleave={onBarLeave}
      >
        <span class="bar-code">{r.code2}</span>
        <div class="bar-track">
          <div
            class="bar-fill"
            style:width="{xMax > 0 ? Math.max(0, (r.deltaPp / xMax) * 100) : 0}%"
            style:background={REGION_COLORS[r.region] ?? REGION_COLORS.autre}
          ></div>
        </div>
        <span class="bar-label">{fmtDelta(r.deltaPp)}</span>
      </div>
    {/each}
    {#if barRows.length === 0}
      <p class="bars-empty">Pas assez de données pour cette année.</p>
    {/if}
    {#if tip.show}
      <div
        class="bars-tooltip"
        style:left="{tip.x}px"
        style:top="{tip.y}px"
        role="tooltip"
      >
        <span class="bars-tooltip__name">{tip.name}</span>
        <span class="bars-tooltip__val">{tip.value}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .scatter-bottom {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
    padding-top: 0.2rem;
    margin-top: 0.1rem;
    border: none;
    min-width: 0;
  }

  .bars-heading {
    margin: 0;
    font-size: 0.56rem;
    font-weight: 800;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #c8d0e2;
    line-height: 1.3;
  }

  .bars-chart {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.14rem;
    justify-content: center;
    min-height: 0;
  }

  .bars-tooltip {
    position: absolute;
    z-index: 6;
    max-width: min(14rem, 92vw);
    padding: 0.35rem 0.45rem;
    border-radius: 6px;
    font-size: 0.72rem;
    line-height: 1.35;
    color: #eef1f8;
    background: rgba(10, 12, 22, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.14);
    pointer-events: none;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  }

  .bars-tooltip__name {
    display: block;
    font-weight: 600;
    color: #e8eaf0;
  }

  .bars-tooltip__val {
    display: block;
    margin-top: 0.12rem;
    font-size: 0.68rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: #b8c4d8;
  }

  .bar-line {
    display: grid;
    grid-template-columns: 1.35rem 1fr 2.85rem;
    align-items: center;
    gap: 0.28rem;
    min-height: 0;
    cursor: default;
  }

  .bar-code {
    font-size: 0.6rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #c5cddc;
  }

  .bar-track {
    height: 7px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
    min-width: 0;
  }

  .bar-fill {
    height: 100%;
    border-radius: 4px;
    min-width: 0;
    transition: width 0.35s ease;
  }

  .bar-label {
    font-size: 0.6rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: #dde2ee;
    text-align: right;
  }

  .bars-empty {
    margin: 0;
    font-size: 0.62rem;
    color: var(--color-text-muted);
  }
</style>
