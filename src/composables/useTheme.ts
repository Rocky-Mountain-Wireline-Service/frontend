import { computed, onMounted, onUnmounted, ref } from 'vue';

const STORAGE_KEY = 'rmws-theme';

/**
 * Dark mode as a plain on/off switch.
 *
 * A three-way system/light/dark cycle was confusing: the third state had no
 * obvious icon and people could not tell what the button would do next. The
 * system preference still decides the *starting* state, it just is not
 * something the visitor has to think about.
 *
 * Module-level refs, so the header toggle and anything else reading the theme
 * cannot disagree about what is applied.
 */

/** null = the visitor has not chosen; follow the operating system. */
const stored = ref<'light' | 'dark' | null>(null);
const systemDark = ref(false);

/** What is actually on screen: the choice if there is one, else the system. */
const isDark = computed(() => (stored.value ? stored.value === 'dark' : systemDark.value));

function read(): 'light' | 'dark' | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    // 'system' was written by the earlier three-way toggle; treat it as unset.
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    // Private mode and blocked site data both throw on access.
    return null;
  }
}

function paint() {
  const root = document.documentElement;
  if (stored.value) {
    root.setAttribute('data-theme', stored.value);
  } else {
    // Leave the attribute off so the CSS keeps following the system, and a
    // visitor who changes their OS theme sees the site follow along.
    root.removeAttribute('data-theme');
  }
}

export function useTheme() {
  let media: MediaQueryList | null = null;
  const onSystemChange = (e: MediaQueryListEvent) => { systemDark.value = e.matches; };

  onMounted(() => {
    media = window.matchMedia('(prefers-color-scheme: dark)');
    systemDark.value = media.matches;
    media.addEventListener('change', onSystemChange);

    stored.value = read();
    paint();
  });

  onUnmounted(() => media?.removeEventListener('change', onSystemChange));

  function toggle() {
    // Flip whatever is on screen, which is what the button appears to promise —
    // including the first press, when nothing has been chosen yet.
    stored.value = isDark.value ? 'light' : 'dark';
    paint();
    try {
      localStorage.setItem(STORAGE_KEY, stored.value);
    } catch {
      // Not being able to remember the choice is no reason to ignore it.
    }
  }

  const label = computed(() => (isDark.value ? 'Switch to light mode' : 'Switch to dark mode'));

  return { isDark, toggle, label };
}
