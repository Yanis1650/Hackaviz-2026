<script>
  /**
   * Piste verticale 23 × une slide — translation pilotée par le slider (scroll-jacking).
   */
  import { onMount } from 'svelte';
  import YearSlideCard from './YearSlideCard.svelte';

  let {
    year,
    slideHeightPx,
    geoData,
    statsStore,
    countryNames,
    ratioColorScale
  } = $props();

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

  const MIN_YEAR = 2002;
  const MAX_YEAR = 2024;
  const YEARS = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, i) => MIN_YEAR + i
  );

  const slideIndex = $derived(Math.max(0, Math.min(YEARS.length - 1, year - MIN_YEAR)));

  const offsetY = $derived(slideHeightPx > 0 ? slideIndex * slideHeightPx : 0);
</script>

<div class="carousel-viewport" class:carousel-viewport--reduce-motion={reduceMotion}>
  <div
    id="cards-track"
    class="cards-track"
    style:transform="translate3d(0, {-offsetY}px, 0)"
  >
    {#each YEARS as cardYear (cardYear)}
      <YearSlideCard
        {cardYear}
        activeYear={year}
        slideHeightPx={slideHeightPx}
        {geoData}
        {statsStore}
        {countryNames}
        {ratioColorScale}
      />
    {/each}
  </div>
</div>

<style>
  /* Isolation du stacking : la piste reste sous les overlays éventuels de la vue. */
  .carousel-viewport {
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    position: relative;
    z-index: 1;
    isolation: isolate;
    box-sizing: border-box;
  }

  .cards-track {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    width: 100%;
    will-change: transform;
    transition: transform 0.55s cubic-bezier(0.32, 1.04, 0.58, 1);
  }

  .carousel-viewport--reduce-motion .cards-track {
    transition: none;
  }
</style>
