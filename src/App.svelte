<script>
  /**
   * Racine — données, année, fenêtre de vue verticale + timeline.
   */
  import { onMount } from 'svelte';
  import { createStatsStore } from './lib/statsStore.js';
  import { createRatioScale } from './lib/scales.js';
  import CardCarousel from './components/CardCarousel.svelte';
  import ChapterFlash from './components/ChapterFlash.svelte';
  import MilestoneToast from './components/MilestoneToast.svelte';
  import Timeline from './components/Timeline.svelte';
  import { translateCountryNameEnToFr } from './lib/paysEnToFr.js';
  import { metricMode, basculerMetrique } from './lib/metricMode.js';
  import { NARRATION, obtenirPeriode, obtenirReperesAnnee } from './lib/narration.js';

  let geoData = $state(null);
  let statsStore = $state(null);
  let countryNames = $state(null);
  let year = $state(2002);
  let loading = $state(true);
  let error = $state(null);
  /** Hauteur mesurée de #view-window (une slide = cette hauteur). */
  let viewWindowH = $state(0);
  let timelineZoneH = $state(0);

  /** Année précédente (hors réactivité) pour détecter les transitions sans relancer l’effet. */
  let prevYearPress = /** @type {number | null} */ (null);
  let flashNonce = $state(0);
  let flashData = $state(
    /** @type {null | { transition: { chapitreLigne: string, chapeau: string, corps: string, citations: { media: string, date: string, une: string }[] }}} */ (null)
  );
  let toastNonce = $state(0);
  let toastData = $state(
    /** @type {null | { une: string, annee: number, media: string, dateLigne: string, rubrique: string }} */ (null)
  );

  /** Toast reporté après la fin du flash (un seul objet visible à la fois). */
  let deferredToastPayload =
    /** @type {null | { une: string, annee: number, media: string, dateLigne: string, rubrique: string }} */ (null);

  /** @param {{ une: string, media: string, dateLigne: string, rubrique: string }} rep */
  function payloadToast(rep, y) {
    return {
      une: rep.une,
      annee: y,
      media: rep.media,
      dateLigne: rep.dateLigne,
      rubrique: rep.rubrique
    };
  }

  function onFlashDone() {
    flashData = null;
    if (deferredToastPayload != null) {
      const p = deferredToastPayload;
      deferredToastPayload = null;
      toastNonce += 1;
      toastData = p;
    }
  }

  $effect(() => {
    const y = year;
    if (prevYearPress === null) {
      prevYearPress = y;
      return;
    }
    const prev = prevYearPress;
    prevYearPress = y;

    const periodeNow = obtenirPeriode(y);
    const periodeWas = obtenirPeriode(prev);
    const rep = obtenirReperesAnnee(y);
    const milestone = rep != null && y !== prev;
    const chapterChanged = periodeNow.id !== periodeWas.id;

    if (chapterChanged) {
      const entry = NARRATION.find((p) => p.id === periodeNow.id);
      if (entry?.transitionFlash) {
        deferredToastPayload = null;
        flashNonce += 1;
        flashData = { transition: entry.transitionFlash };
        if (milestone) {
          deferredToastPayload = payloadToast(rep, y);
        }
      } else if (milestone) {
        toastNonce += 1;
        toastData = payloadToast(rep, y);
      }
    } else if (milestone) {
      toastNonce += 1;
      toastData = payloadToast(rep, y);
    }
  });

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
        {#key flashNonce}
          {#if flashData}
            <ChapterFlash transition={flashData.transition} ondone={onFlashDone} />
          {/if}
        {/key}
      </div>
      {#key toastNonce}
        {#if toastData && !flashData}
          <MilestoneToast
            une={toastData.une}
            annee={toastData.annee}
            media={toastData.media}
            dateLigne={toastData.dateLigne}
            rubrique={toastData.rubrique}
            ondone={() => {
              toastData = null;
            }}
          />
        {/if}
      {/key}
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
    height: 28px;
    min-height: 28px;
    padding: 0.32rem 0.8rem;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.06);
    border: 0.5px solid #444;
    border-radius: 20px;
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
  }

  .metric-toggle:hover {
    border-color: rgba(255, 255, 255, 0.28);
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.1);
  }

  .metric-toggle--active {
    border-color: rgba(100, 160, 255, 0.55);
    color: #7ab4ff;
    background: rgba(255, 255, 255, 0.08);
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
