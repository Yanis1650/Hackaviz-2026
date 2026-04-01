<script>
  /**
   * Racine — données, année, carrousel horizontal (aligné sur le slider) + timeline.
   */
  import { onMount } from 'svelte';
  import { createStatsStore } from './lib/statsStore.js';
  import { createRatioScale } from './lib/scales.js';
  import CardCarousel from './components/CardCarousel.svelte';
  import ChapterFlash from './components/ChapterFlash.svelte';
  import Timeline from './components/Timeline.svelte';
  import { translateCountryNameEnToFr } from './lib/paysEnToFr.js';
  import { NARRATION, obtenirPeriode } from './lib/narration.js';

  let geoData = $state(null);
  let statsStore = $state(null);
  let countryNames = $state(null);
  let year = $state(2002);
  let loading = $state(true);
  let error = $state(null);
  /** Mesures #view-window : une slide = même taille que la fenêtre (carrousel horizontal). */
  let viewWindowH = $state(0);
  let viewWindowW = $state(0);
  let timelineZoneH = $state(0);

  /** Année précédente (hors réactivité) pour détecter les transitions sans relancer l’effet. */
  let prevYearPress = /** @type {number | null} */ (null);
  let flashNonce = $state(0);
  let flashData = $state(
    /** @type {null | { transition: { chapitreLigne: string, chapeau: string, corps: string, citations: { media: string, date: string, une: string }[] }}} */ (null)
  );
  function onFlashDone() {
    flashData = null;
  }

  /** Rouvre le panneau « actualités » (presse) du chapitre pour l’année affichée. */
  function ouvrirActualitesChapitre() {
    const p = obtenirPeriode(year);
    const entry = NARRATION.find((x) => x.id === p.id);
    if (entry?.transitionFlash) {
      flashNonce += 1;
      flashData = { transition: entry.transitionFlash };
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
    const chapterChanged = periodeNow.id !== periodeWas.id;

    if (chapterChanged) {
      const entry = NARRATION.find((p) => p.id === periodeNow.id);
      if (entry?.transitionFlash) {
        flashNonce += 1;
        flashData = { transition: entry.transitionFlash };
      }
    }
  });

  /** Tant que les binds n’ont pas réagi, estimer pour éviter des slides à taille nulle. */
  const slideHeightPx = $derived(
    viewWindowH > 0
      ? viewWindowH
      : typeof window !== 'undefined'
        ? Math.max(320, window.innerHeight - 96)
        : 640
  );

  const slideWidthPx = $derived(
    viewWindowW > 0
      ? viewWindowW
      : typeof window !== 'undefined'
        ? Math.max(280, window.innerWidth)
        : 960
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
      <div
        id="view-window"
        class="view-window"
        bind:clientHeight={viewWindowH}
        bind:clientWidth={viewWindowW}
      >
        <CardCarousel
          {year}
          slideHeightPx={slideHeightPx}
          slideWidthPx={slideWidthPx}
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
      <div class="timeline-zone" bind:clientHeight={timelineZoneH}>
        <Timeline bind:year onOpenActualites={ouvrirActualitesChapitre} />
      </div>
    </div>
  {/if}
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    /* Marge basse pour ne pas coller à la barre Windows / filigrane « Afficher le Bureau » en capture. */
    height: 100vh;
    height: 100dvh;
    max-height: 100dvh;
    width: 100%;
    overflow: hidden;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-sizing: border-box;
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
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0 0.65rem max(0.85rem, calc(0.45rem + env(safe-area-inset-bottom, 0px)));
    background: var(--slider-zone-bg, #e0dbd0);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    pointer-events: none;
  }

  .timeline-zone :global(.narrative-bar) {
    pointer-events: auto;
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
