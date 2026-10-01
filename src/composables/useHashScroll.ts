import { nextTick, onMounted, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Scrolls to a URL hash once the page that contains it exists.
 *
 * The router's own `scrollBehavior` runs the moment navigation settles, which
 * on this site is before the page has fetched its sections — so a link to
 * /contact#contact-form found nothing and silently left the visitor at the top.
 * Waiting for the page's own ready flag is the only reliable signal, since the
 * target is rendered from CMS data.
 *
 * Matching on `fullPath` means following the same anchor twice still works
 * after navigating away and back.
 */
export function useHashScroll(ready: Ref<boolean>) {
  const route = useRoute();
  let handled = '';

  function go() {
    const hash = route.hash;
    if (!hash || !ready.value || handled === route.fullPath) return;

    void nextTick(() => {
      requestAnimationFrame(() => {
        let target: Element | null = null;
        try {
          target = document.querySelector(hash);
        } catch {
          // A hash that is not a valid selector is a link typo, not a crash.
          return;
        }
        if (!target) return;
        handled = route.fullPath;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  onMounted(go);
  watch([() => route.fullPath, ready], go, { flush: 'post' });
}
