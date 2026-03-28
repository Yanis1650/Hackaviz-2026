<script>
  /**
   * Transition de chapitre (modal plein cadre, ~4 s ou Passer).
   * Style presse : chapeau serif, corps sans, citations multiples.
   */
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  /** @type {{ transition: { chapitreLigne: string, chapeau: string, corps: string, citations: { media: string, date: string, une: string }[] }, ondone?: () => void }} */
  let { transition, ondone } = $props();

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

<div class="chapter-flash" in:fade={{ duration: 180 }}
  role="dialog"
  aria-modal="true"
  aria-labelledby="chapter-flash-title"
  aria-describedby="chapter-flash-desc"
>
  <div class="chapter-flash__backdrop" aria-hidden="true"></div>
  <div class="chapter-flash__modal" aria-live="polite">
    <p id="chapter-flash-title" class="chapter-flash__chapitre">{transition.chapitreLigne}</p>
    <h2 class="chapter-flash__chapeau">{transition.chapeau}</h2>
    <p id="chapter-flash-desc" class="chapter-flash__corps">{transition.corps}</p>

    <ul class="chapter-flash__citations">
      {#each transition.citations as c, i (i)}
        <li class="chapter-flash__cite">
          <div class="chapter-flash__cite-row">
            <span class="chapter-flash__cite-meta">{c.media} · {c.date}</span>
            <span class="chapter-flash__cite-pipe" aria-hidden="true">|</span>
            <span class="chapter-flash__cite-une">{c.une}</span>
          </div>
        </li>
      {/each}
    </ul>

    <div class="chapter-flash__actions">
      <p class="chapter-flash__footnote">
        Titres reformulés · données COFOG thèmes 2 et 10
      </p>
      <div class="chapter-flash__actions-btns">
        <button type="button" class="chapter-flash__btn chapter-flash__btn--ghost" onclick={fermer}>
          Passer
        </button>
        <button type="button" class="chapter-flash__btn chapter-flash__btn--primary" onclick={fermer}>
          Explorer les données →
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .chapter-flash {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(0.5rem, 3vw, 1.25rem);
    box-sizing: border-box;
    pointer-events: auto;
  }

  .chapter-flash__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(4, 6, 12, 0.72);
    backdrop-filter: blur(6px);
  }

  .chapter-flash__modal {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: min(34rem, 100%);
    max-height: min(88vh, 42rem);
    overflow-y: auto;
    padding: 1.1rem 1.2rem 1rem;
    border-radius: 12px;
    border: none;
    background: rgba(14, 16, 26, 0.97);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
    border-top: 3px solid #c0392b;
  }

  .chapter-flash__chapitre {
    margin: 0 0 0.5rem;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.42);
  }

  .chapter-flash__chapeau {
    margin: 0 0 0.55rem;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.05rem, 3vw, 1.35rem);
    font-weight: 700;
    line-height: 1.28;
    color: #f5f0e8;
  }

  .chapter-flash__corps {
    margin: 0 0 0.85rem;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.82rem;
    line-height: 1.55;
    color: rgba(226, 228, 235, 0.88);
  }

  .chapter-flash__citations {
    margin: 0 0 1rem;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid #1a1d24;
  }

  .chapter-flash__cite {
    margin: 0;
    padding: 7px 0;
    border-bottom: 0.5px solid #1a1d24;
  }

  .chapter-flash__cite:last-child {
    border-bottom: none;
  }

  .chapter-flash__cite-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.55rem;
  }

  .chapter-flash__cite-meta {
    flex: 0 0 auto;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.42);
  }

  .chapter-flash__cite-pipe {
    flex: 0 0 auto;
    font-size: 0.65rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.22);
  }

  .chapter-flash__cite-une {
    flex: 1 1 12rem;
    min-width: 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.45;
    color: #f5f0e8;
  }

  .chapter-flash__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    padding-top: 0.5rem;
    border-top: 0.5px solid #1a1d24;
  }

  .chapter-flash__footnote {
    margin: 0;
    flex: 1 1 10rem;
    max-width: 20rem;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.58rem;
    font-style: italic;
    line-height: 1.35;
    color: rgba(255, 255, 255, 0.38);
  }

  .chapter-flash__actions-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    justify-content: flex-end;
  }

  .chapter-flash__btn {
    margin: 0;
    cursor: pointer;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 8px;
    padding: 0.38rem 0.75rem;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .chapter-flash__btn--ghost {
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: transparent;
    color: rgba(255, 255, 255, 0.75);
  }

  .chapter-flash__btn--ghost:hover {
    border-color: rgba(255, 255, 255, 0.35);
    color: #fff;
  }

  .chapter-flash__btn--primary {
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    color: #e8eaf0;
  }

  .chapter-flash__btn--primary:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.22);
  }

  @media (prefers-reduced-motion: reduce) {
    .chapter-flash__backdrop {
      backdrop-filter: none;
    }
  }
</style>
