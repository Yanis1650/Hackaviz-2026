<script>
  /**
   * Piste horizontale : années 2024→2002 dans le DOM pour que, en avançant le slider (temps +),
   * la piste se décale vers la droite (la vue « arrive » par la gauche).
   */
  import { onMount } from 'svelte';
  import YearSlideCard from './YearSlideCard.svelte';

  let {
    year,
    slideHeightPx,
    slideWidthPx,
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
  const YEARS_ASC = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, i) => MIN_YEAR + i
  );
  /** Ordre gauche→droite : années récentes d’abord (inverse du slider temporel visuel). */
  const YEARS_TRACK = [...YEARS_ASC].reverse();

  const slideIndex = $derived(
    Math.max(0, Math.min(YEARS_TRACK.length - 1, MAX_YEAR - year))
  );

  const offsetX = $derived(slideWidthPx > 0 ? slideIndex * slideWidthPx : 0);
</script>

<div class="carousel-viewport" class:carousel-viewport--reduce-motion={reduceMotion}>
  <div
    id="cards-track"
    class="cards-track"
    style:transform="translate3d({-offsetX}px, 0, 0)"
  >
    {#each YEARS_TRACK as cardYear (cardYear)}
      <YearSlideCard
        {cardYear}
        activeYear={year}
        slideHeightPx={slideHeightPx}
        slideWidthPx={slideWidthPx}
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
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: stretch;
    height: 100%;
    width: max-content;
    min-width: 100%;
    will-change: transform;
    transition: transform 0.55s cubic-bezier(0.32, 1.04, 0.58, 1);
  }

  .carousel-viewport--reduce-motion .cards-track {
    transition: none;
  }
</style>
