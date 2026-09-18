import { computed, onMounted, ref } from 'vue';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'rmws-theme';
const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

/**
 * Shared across every caller: a module-level ref rather than per-instance
 * state, so the header toggle and anything else reading the theme cannot
 * disagree about what is currently applied.
 *
 * Starts at 'system' to match the server-rendered HTML, which carries no
 * `data-theme`. Reading localStorage here instead would make the first client
 * render differ from the prerendered markup and trip a hydration mismatch —
 * the stored value is applied in onMounted, after hydration settles. The inline
 * script in index.html has already set the attribute by then, so there is no
 * visible flash.
 */
const preference = ref<ThemePreference>('system');

function apply(value: ThemePreference) {
  const root = document.documentElement;
  if (value === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', value);
  }
}

function read(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    // Private mode and blocked site data both throw on access.
    return 'system';
  }
}

export function useTheme() {
  onMounted(() => {
    preference.value = read();
    apply(preference.value);
  });

  function set(value: ThemePreference) {
    preference.value = value;
    apply(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Not being able to remember the choice is not a reason to ignore it.
    }
  }

  /** Cycles system -> light -> dark, so the automatic option stays reachable. */
  function cycle() {
    const next = ORDER[(ORDER.indexOf(preference.value) + 1) % ORDER.length]!;
    set(next);
  }

  const label = computed(() => {
    const next = ORDER[(ORDER.indexOf(preference.value) + 1) % ORDER.length]!;
    const names: Record<ThemePreference, string> = {
      system: 'match system',
      light: 'light',
      dark: 'dark',
    };
    return `Theme: ${names[preference.value]}. Switch to ${names[next]}.`;
  });

  return { preference, set, cycle, label };
}
