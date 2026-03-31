<script>
  /**
   * Carte SVG D3 — choroplèthe + mini-donuts (alternative statique à MapLibreEuropeMap).
   */
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { createEuropeProjection } from '../lib/projection.js';
  import {
    attachMapCountryHover,
    detachMapCountryHover
  } from '../lib/mapCountryHover.js';
  import { syncGlyphLayerFull } from '../lib/mapGlyphLayerSync.js';

  let {
    year,
    geoData,
    statsStore,
    ratioColorScale,
    hoverSync,
    onCountryHover
  } = $props();

  const MAP_W = 680;
  const MAP_H = 620;

  const COLOR_DEF = '#c45a38';
  const COLOR_SOC = '#3a6bc4';
  const TRANSITION_MS = 450;

  let svgEl;
  let initialized = false;
  let gPays, gGlyphs, projection, statsData;

  const hoverCb = /** @type {{ onCountryHover?: (p: { visible: boolean, text?: string, clientX: number, clientY: number }) => void }} */ (
    {}
  );

  $effect(() => {
    hoverCb.onCountryHover = onCountryHover;
  });

  onMount(() => {
    const svg = d3.select(svgEl);
    projection = createEuropeProjection(geoData, MAP_W, MAP_H);
    const pathGen = d3.geoPath(projection);
    statsData = statsStore.getData();

    gPays = svg.append('g').attr('class', 'pays-layer');
    gPays
      .selectAll('path')
      .data(geoData.features, (d) => d.properties.ISO3)
      .join('path')
      .attr('d', pathGen)
      .attr('stroke', '#4a5570')
      .attr('stroke-width', 0.65);

    gGlyphs = svg.append('g').attr('class', 'glyphs-layer');
    attachMapCountryHover(gPays, () => ({
      year: hoverSync.year,
      statsData,
      countryNames: hoverSync.countryNames,
      onHover: (p) => hoverCb.onCountryHover?.(p)
    }));
    initialized = true;
    return () => detachMapCountryHover(gPays);
  });

  function updateMap(yr) {
    if (!initialized) return;
    const y = String(yr);

    gPays
      .selectAll('path')
      .attr('fill', (d) => {
        const s = statsData[y]?.[d.properties.ISO3];
        if (s?.ratio != null && !isNaN(s.ratio)) return ratioColorScale(s.ratio);
        return '#e0ddd4';
      })
      .attr('fill-opacity', 0.85)
      .style('cursor', 'pointer');

    syncGlyphLayerFull({
      gGlyphs,
      projectXY: (d) => projection([d.properties.LON, d.properties.LAT]),
      year: yr,
      geoData,
      statsData,
      ratioColorScale,
      colorDef: COLOR_DEF,
      colorSoc: COLOR_SOC,
      transitionMs: TRANSITION_MS
    });
  }

  $effect(() => {
    updateMap(year);
  });
</script>

<svg
  bind:this={svgEl}
  viewBox="0 0 {MAP_W} {MAP_H}"
  class="d3-map"
  preserveAspectRatio="xMidYMid meet"
  overflow="hidden"
></svg>

<style>
  .d3-map {
    display: block;
    flex: 0 1 auto;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    min-width: 0;
    aspect-ratio: 680 / 620;
  }

  :global(.glyphs-layer) {
    pointer-events: none;
  }
</style>
