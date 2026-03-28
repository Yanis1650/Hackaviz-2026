<script>
  /**
   * Valeur KPI interpolée ; snap sans tween au changement de métrique (% PIB vs Md€).
   */
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  let {
    value,
    decimals = 2,
    suffix = '',
    duration = 900,
    /** @type {'pib_pct' | 'per_capita'} */
    metricMode = 'per_capita',
    reduceMotion = false
  } = $props();

  const displayed = tweened(0, { duration: 0, easing: cubicOut });

  let lastMode = /** @type {'pib_pct' | 'per_capita' | undefined} */ (undefined);

  $effect(() => {
    const m = metricMode;
    const v = Number(value);
    const safe = isFinite(v) ? v : 0;
    const modeSnap = lastMode !== undefined && lastMode !== m;
    lastMode = m;
    const dur = reduceMotion || modeSnap ? 0 : duration;
    displayed.set(safe, { duration: dur, easing: cubicOut });
  });
</script>

<span class="kpi-value">{$displayed.toFixed(decimals)}{suffix}</span>
