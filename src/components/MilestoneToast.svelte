<script>
  /**
   * Toast compact (année marquante) : source typographiée, une en serif, ✕ non bloquant.
   */
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  /** @type {{ une: string, annee: number, media: string, dateLigne: string, rubrique: string, ondone?: () => void }} */
  let { une, annee, media, dateLigne, rubrique, ondone } = $props();

  const DURATION_MS = 4000;

  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  function fermer() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    ondone?.();
  }

  onMount(() => {
    timer = setTimeout(fermer, DURATION_MS);
    return () => {
      if (timer != null) clearTimeout(timer);
    };
  });
</script>

<div class="milestone-toast-wrap">
  <div
    class="milestone-toast"
    role="status"
    in:fly={{ y: 12, duration: 240 }}
    out:fade={{ duration: 180 }}
  >
    <div class="milestone-toast__top">
      <span class="milestone-toast__year">{annee}</span>
      <button
        type="button"
        class="milestone-toast__close"
        aria-label="Fermer le repère presse"
        onclick={fermer}
      >
        ✕
      </button>
    </div>
    <p class="milestone-toast__identity">{media} · {dateLigne} · {rubrique}</p>
    <p class="milestone-toast__une">{une}</p>
  </div>
</div>

<style>
  .milestone-toast-wrap {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(var(--timeline-zone-h, 108px) + 0.45rem);
    z-index: 40;
    display: flex;
    justify-content: center;
    padding: 0 0.625rem;
    pointer-events: none;
    box-sizing: border-box;
  }

  .milestone-toast {
    max-width: min(22rem, 100%);
    width: 100%;
    padding: 0.5rem 0.65rem 0.55rem;
    pointer-events: none;
    box-sizing: border-box;
    border-radius: 10px;
    border: none;
    border-top: 3px solid #c0392b;
    background: rgba(12, 14, 24, 0.58);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  }

  .milestone-toast__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.28rem;
  }

  .milestone-toast__year {
    font-variant-numeric: tabular-nums;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: #c9a227;
  }

  .milestone-toast__close {
    margin: 0;
    position: relative;
    z-index: 1;
    padding: 0.15rem 0.35rem;
    pointer-events: auto;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
    transition:
      background 0.12s ease,
      color 0.12s ease;
  }

  .milestone-toast__close:hover {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.9);
  }

  .milestone-toast__identity {
    margin: 0;
    padding-bottom: 7px;
    border-bottom: 0.5px solid #1a1d24;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    line-height: 1.35;
    color: rgba(200, 210, 230, 0.72);
  }

  .milestone-toast__une {
    margin: 0;
    padding-top: 7px;
    font-family: Georgia, serif;
    font-size: clamp(0.78rem, 2.2vw, 0.9rem);
    font-weight: 600;
    line-height: 1.35;
    color: #f5f0e8;
    text-wrap: balance;
  }

  @media (prefers-reduced-motion: reduce) {
    .milestone-toast {
      transition: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
  }
</style>
