import { onBeforeUnmount, ref, watch, type Ref } from 'vue';

/**
 * Cloudflare Turnstile on a form: a check a person passes without noticing,
 * which a script filling in contact forms does not.
 *
 * Nothing loads until the server hands over a site key (with the form token),
 * so a site without Turnstile configured never contacts Cloudflare. The widget
 * stays hidden unless Cloudflare wants the visitor to click a checkbox
 * (appearance: interaction-only). A token is good for one submission, so the
 * form resets the widget after every attempt.
 */

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')));
    script.onerror = () => {
      loading = null;
      reject(new Error('Turnstile did not load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function useTurnstile(siteKey: Ref<string>, container: Ref<HTMLElement | null>) {
  const token = ref('');
  let widgetId: string | null = null;
  let api: TurnstileApi | null = null;

  async function mount() {
    if (!siteKey.value || !container.value || widgetId) return;
    try {
      api = await loadScript();
      widgetId = api.render(container.value, {
        sitekey: siteKey.value,
        appearance: 'interaction-only',
        theme: 'auto',
        callback: (t: string) => (token.value = t),
        'expired-callback': () => (token.value = ''),
        'error-callback': () => {
          token.value = '';
        },
      });
    } catch (err) {
      // The server decides: without a token it asks the visitor to try again.
      console.error(err);
    }
  }

  /** A fresh challenge after each submission; tokens are single-use. */
  function reset() {
    token.value = '';
    if (api && widgetId) api.reset(widgetId);
  }

  watch([siteKey, container], mount, { immediate: true });
  onBeforeUnmount(() => {
    if (api && widgetId) api.remove(widgetId);
  });

  return { token, reset };
}
