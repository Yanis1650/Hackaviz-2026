<script>
  /**
   * Transition de chapitre (panneau latéral droit, ~4 s ou Passer) — carte et graphiques restent visibles et utilisables à gauche.
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

  function planifierFermeture(/** @type {number} */ delaiMs = DURATION_MS) {
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(fermer, delaiMs);
  }

  /** Survol du panneau : on annule l’auto-fermeture pour laisser lire tranquillement. */
  function surPanneauEntrer() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /** Sortie du panneau : on relance le délai avant fermeture. */
  function surPanneauSortir() {
    planifierFermeture(DURATION_MS);
  }

  onMount(() => {
    planifierFermeture(DURATION_MS);
    /** @param {KeyboardEvent} e */
    function onKey(e) {
      if (e.key === 'Escape') fermer();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      if (timer != null) clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  });
</script>

<div
  class="chapter-flash"
  in:fade={{ duration: 180 }}
  role="region"
  aria-labelledby="chapter-flash-title"
  aria-describedby="chapter-flash-desc"
>
  <div class="chapter-flash__spacer" aria-hidden="true"></div>
  <div
    class="chapter-flash__modal"
    role="region"
    aria-label="Actualités et citations du chapitre"
    aria-live="polite"
    onpointerenter={surPanneauEntrer}
    onpointerleave={surPanneauSortir}
  >
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
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-end;
    padding: clamp(0.35rem, 1.5vw, 0.85rem);
    box-sizing: border-box;
    pointer-events: none;
  }

  .chapter-flash__spacer {
    flex: 1 1 auto;
    min-width: 0;
    pointer-events: none;
  }

  .chapter-flash__modal {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    width: min(22rem, 42vw);
    min-width: min(16rem, 100%);
    max-width: calc(100% - 0.5rem);
    max-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 1rem 1.05rem 0.95rem;
    border-radius: 12px 0 0 12px;
    border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
    border-right: none;
    background: rgba(253, 251, 247, 0.98);
    box-shadow:
      -8px 0 32px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    pointer-events: auto;
    -webkit-overflow-scrolling: touch;
  }

  @media (max-width: 520px) {
    .chapter-flash__modal {
      width: min(20rem, 94vw);
      border-radius: 10px 0 0 10px;
      max-height: min(78vh, 36rem);
    }
  }

  .chapter-flash__chapitre {
    margin: 0 0 0.5rem;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-muted, #8a8278);
  }

  .chapter-flash__chapeau {
    margin: 0 0 0.55rem;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.05rem, 3vw, 1.35rem);
    font-weight: 700;
    line-height: 1.28;
    color: var(--color-title, #2a6040);
  }

  .chapter-flash__corps {
    margin: 0 0 0.85rem;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.82rem;
    line-height: 1.55;
    color: rgba(26, 26, 20, 0.88);
  }

  .chapter-flash__citations {
    margin: 0 0 1rem;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  }

  .chapter-flash__cite {
    margin: 0;
    padding: 7px 0;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
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
    color: var(--text-muted, #8a8278);
  }

  .chapter-flash__cite-pipe {
    flex: 0 0 auto;
    font-size: 0.65rem;
    font-weight: 300;
    color: rgba(90, 86, 72, 0.35);
  }

  .chapter-flash__cite-une {
    flex: 1 1 12rem;
    min-width: 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.45;
    color: #1a1a14;
  }

  .chapter-flash__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    padding-top: 0.5rem;
    border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  }

  .chapter-flash__footnote {
    margin: 0;
    flex: 1 1 10rem;
    max-width: 20rem;
    font-family: var(--font-main, system-ui, sans-serif);
    font-size: 0.58rem;
    font-style: italic;
    line-height: 1.35;
    color: var(--text-muted, #8a8278);
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
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: transparent;
    color: var(--text-secondary, #5a5648);
  }

  .chapter-flash__btn--ghost:hover {
    border-color: rgba(0, 0, 0, 0.2);
    color: #1a1a14;
  }

  .chapter-flash__btn--primary {
    border: 1px solid rgba(42, 96, 64, 0.35);
    background: rgba(42, 96, 64, 0.1);
    color: var(--btn-text, #2a6040);
  }

  .chapter-flash__btn--primary:hover {
    background: rgba(42, 96, 64, 0.16);
    border-color: rgba(42, 96, 64, 0.45);
  }

</style>
