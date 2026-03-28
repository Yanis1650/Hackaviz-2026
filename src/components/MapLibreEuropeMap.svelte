<script>
  /**
   * Europe choroplèthe MapLibre (zoom/pan) + calque SVG D3 pour halos/donnuts.
   * Pas d’image de fond : tout est WebGL/canvas + SVG `pointer-events: none` au-dessus.
   */
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import {
    createEmptyDarkStyle,
    boundsLngLatFromGeo,
    addEuropeChoroplethSourceAndLayers,
    applyFillFeatureStates,
    applyMapOutlineHighlight,
    EUROPE_FILL_LAYER_ID
  } from '../lib/maplibreChoropleth.js';
  import { attachMapLibreCountryHover } from '../lib/mapLibreCountryHover.js';
  import { syncGlyphLayerFull, projectGlyphGroups } from '../lib/mapGlyphLayerSync.js';
  import { metricMode } from '../lib/metricMode.js';

  let {
    year,
    /** Année du slider (prop réactive) — ne pas dériver de `year` de la slide dans le parent. */
    activeTimelineYear,
    geoData,
    statsStore,
    ratioColorScale,
    /** @type {{ countryNames: Map<string, string>|null }} */
    hoverSync,
    onCountryHover,
    /** Contours à surligner (liste ISO3 + couleur zone scatter). */
    outlineSpec = null,
    /** Clic sur un pays : bascule surbrillance (même logique que le point scatter). */
    onMapCountryOutlineClick = undefined
  } = $props();

  const COLOR_DEF = '#e41a1c';
  const COLOR_SOC = '#377eb8';
  const TRANSITION_MS = 450;

  /** Mode d'affichage courant (nominal €/hab. ou % PIB) — réactif aux changements du store. */
  let currentMetricMode = $state('per_capita');
  $effect(() => {
    return metricMode.subscribe((v) => { currentMetricMode = v; });
  });

  /** Lu pendant les callbacks MapLibre (render / survol) pour éviter une année figée. */
  const mapCtx = {
    year: 2002,
    statsData: /** @type {Record<string, Record<string, object>>} */ ({})
  };

  /** Copie des props dans un objet plain lu par getCtx (callbacks MapLibre hors runes). */
  const hoverRef = { slideYear: 2002, timelineYear: 2002 };

  $effect.pre(() => {
    mapCtx.year = year;
    hoverRef.slideYear = year;
    hoverRef.timelineYear = activeTimelineYear;
  });

  let mapEl = $state(null);
  let svgOverlayEl = $state(null);
  let mapReady = $state(false);

  /** @type {import('maplibre-gl').Map|null} */
  let map = null;
  /** @type {import('d3-selection').Selection<SVGGElement, unknown, null, undefined>|null} */
  let gGlyphs = null;

  const hoverCb = /** @type {{ onCountryHover?: (p: { visible: boolean, text?: string, clientX: number, clientY: number }) => void }} */ (
    {}
  );

  $effect(() => {
    hoverCb.onCountryHover = onCountryHover;
  });

  /** Callback carte lu hors runes (handler `load`). */
  const mapCountryClickRef = {
    /** @type {((iso3: string) => void) | undefined} */
    fn: undefined
  };
  $effect.pre(() => {
    mapCountryClickRef.fn = onMapCountryOutlineClick;
  });

  onMount(() => {
    mapCtx.statsData = statsStore.getData();

    map = new maplibregl.Map({
      container: mapEl,
      style: createEmptyDarkStyle(),
      attributionControl: false,
      pitch: 0,
      maxPitch: 0
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    /** Repositionne uniquement les glyphes (léger, chaque frame rendu). */
    let onRender = () => {};
    let detachHover = () => {};
    let detachFillClick = () => {};

    map.on('load', () => {
      if (!map) return;
      addEuropeChoroplethSourceAndLayers(map, geoData);
      map.fitBounds(boundsLngLatFromGeo(geoData), {
        padding: { top: 10, bottom: 10, left: 10, right: 10 },
        duration: 0,
        maxZoom: 5.85
      });

      const onFillClick = (/** @type {import('maplibre-gl').MapLayerMouseEvent} */ e) => {
        const iso = e.features?.[0]?.properties?.ISO3;
        if (iso && typeof iso === 'string') mapCountryClickRef.fn?.(iso);
      };
      const onFillEnter = () => {
        if (map) map.getCanvas().style.cursor = 'pointer';
      };
      const onFillLeave = () => {
        if (map) map.getCanvas().style.cursor = '';
      };
      map.on('click', EUROPE_FILL_LAYER_ID, onFillClick);
      map.on('mouseenter', EUROPE_FILL_LAYER_ID, onFillEnter);
      map.on('mouseleave', EUROPE_FILL_LAYER_ID, onFillLeave);
      detachFillClick = () => {
        if (!map) return;
        map.off('click', EUROPE_FILL_LAYER_ID, onFillClick);
        map.off('mouseenter', EUROPE_FILL_LAYER_ID, onFillEnter);
        map.off('mouseleave', EUROPE_FILL_LAYER_ID, onFillLeave);
      };

      const svg = d3.select(svgOverlayEl);
      gGlyphs = svg.append('g').attr('class', 'glyphs-layer');

      detachHover = attachMapLibreCountryHover(
        map,
        () => ({
          year: mapCtx.year,
          slideYear: hoverRef.slideYear,
          activeTimelineYear: hoverRef.timelineYear,
          statsData: mapCtx.statsData,
          countryNames: hoverSync.countryNames,
          onHover: (p) => hoverCb.onCountryHover?.(p)
        }),
        { debugLabel: `carte-${year}` }
      );

      onRender = () => {
        if (!gGlyphs || !map) return;
        const projectXY = (d) => {
          const p = map.project([d.properties.LON, d.properties.LAT]);
          return [p.x, p.y];
        };
        projectGlyphGroups(gGlyphs, projectXY);
      };

      map.on('render', onRender);
      mapReady = true;
    });

    const ro = new ResizeObserver(() => map?.resize());
    if (mapEl) ro.observe(mapEl);

    return () => {
      ro.disconnect();
      detachFillClick();
      detachHover();
      if (map) {
        map.off('render', onRender);
        map.remove();
      }
      map = null;
      gGlyphs = null;
    };
  });

  $effect(() => {
    const y = year;
    const mode = currentMetricMode;
    if (!mapReady || !map || !gGlyphs) return;
    applyFillFeatureStates(map, geoData, mapCtx.statsData, y, ratioColorScale);
    const projectXY = (d) => {
      const p = map.project([d.properties.LON, d.properties.LAT]);
      return [p.x, p.y];
    };
    syncGlyphLayerFull({
      gGlyphs,
      projectXY,
      year: y,
      geoData,
      statsData: mapCtx.statsData,
      ratioColorScale,
      colorDef: COLOR_DEF,
      colorSoc: COLOR_SOC,
      transitionMs: TRANSITION_MS,
      metricMode: mode
    });
    queueMicrotask(() => {
      if (map && gGlyphs) {
        projectGlyphGroups(gGlyphs, (d) => {
          const p = map.project([d.properties.LON, d.properties.LAT]);
          return [p.x, p.y];
        });
      }
    });
  });

  $effect(() => {
    const spec = outlineSpec;
    if (!mapReady || !map) return;
    applyMapOutlineHighlight(map, spec);
  });
</script>

<div class="maplibre-stack">
  <div bind:this={mapEl} class="maplibre-canvas" role="application" aria-label="Carte Europe interactive"></div>
  <svg
    bind:this={svgOverlayEl}
    class="glyph-svg-overlay"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  ></svg>
  <p class="maplibre-hint">Molette ou pincer pour zoomer — glisser pour déplacer</p>
</div>

<style>
  .maplibre-stack {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    flex: 1 1 auto;
    border-radius: 10px;
    overflow: hidden;
  }

  .maplibre-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* Calque D3 au-dessus du canvas : pas d’interception du pointeur → survol MapLibre conservé. */
  .glyph-svg-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }

  .maplibre-hint {
    position: absolute;
    right: 0.35rem;
    bottom: 0.2rem;
    margin: 0;
    max-width: 11rem;
    font-size: 0.69rem;
    line-height: 1.25;
    color: var(--color-text-dim);
    opacity: 0.75;
    pointer-events: none;
    text-align: right;
    z-index: 2;
  }

  :global(.maplibre-stack .maplibregl-canvas) {
    outline: none;
  }
</style>
