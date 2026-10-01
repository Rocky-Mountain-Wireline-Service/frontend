import { computed, reactive, ref } from 'vue';
import { trackLead } from '@/lib/analytics';
import type { DynamicForm, FormField } from '@/types/content';

/** Netlify caps a function request at 6MB; base64 inflates a file by about a third. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

interface Attachment {
  filename: string;
  contentType: string;
  /** base64, no data: prefix */
  content: string;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Drives a CMS-defined form.
 *
 * Spam handling reproduces what the previous site did, with both layers now
 * configurable per form rather than hardcoded:
 *
 *   1. A honeypot field that is hidden from people but not from bots. Anything
 *      that fills it in is dropped.
 *   2. A minimum time-to-complete. A form returned faster than a person could
 *      plausibly read it was almost certainly automated.
 *
 * Both are checked again in the Netlify function — a client-side check only
 * filters naive bots, since anything can POST the endpoint directly.
 */
export function useForm(form: () => DynamicForm | null | undefined) {
  const values = reactive<Record<string, string>>({});
  const files = reactive<Record<string, File | null>>({});
  const errors = reactive<Record<string, string>>({});
  const status = ref<SubmitStatus>('idle');
  const formError = ref('');
  const honeypot = ref('');
  const startedAt = ref(Date.now());

  const fields = computed<FormField[]>(() => form()?.fields ?? []);

  function reset() {
    for (const key of Object.keys(values)) delete values[key];
    for (const key of Object.keys(files)) delete files[key];
    clearErrors();
    honeypot.value = '';
    startedAt.value = Date.now();
  }

  function clearErrors() {
    for (const key of Object.keys(errors)) delete errors[key];
    formError.value = '';
  }

  function setFile(name: string, file: File | null) {
    if (file && file.size > MAX_FILE_BYTES) {
      errors[name] = 'That file is larger than 4MB. Please attach a smaller one.';
      files[name] = null;
      return;
    }
    delete errors[name];
    files[name] = file;
  }

  function validate(): boolean {
    clearErrors();
    for (const field of fields.value) {
      const value = field.type === 'file' ? files[field.name] : values[field.name];
      if (field.required && !value) {
        errors[field.name] = `${field.label} is required.`;
        continue;
      }
      const text = values[field.name];
      if (field.type === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        errors[field.name] = 'Enter a valid email address.';
      }
    }
    return Object.keys(errors).length === 0;
  }

  async function submit() {
    const def = form();
    if (!def || status.value === 'submitting') return;

    // Silently succeed for anything that trips the honeypot: telling a bot why
    // it was rejected only helps it try again.
    if (honeypot.value) {
      // Reports success so a bot learns nothing, but records no lead: counting
      // these would quietly inflate the client's conversion numbers.
      status.value = 'success';
      return;
    }

    const minimumSeconds = def.spamProtection?.minimumSeconds ?? 3;
    if (minimumSeconds > 0 && (Date.now() - startedAt.value) / 1000 < minimumSeconds) {
      formError.value = 'That was submitted a little too quickly. Please try again.';
      status.value = 'error';
      return;
    }

    if (!validate()) {
      // A form-level message as well as the per-field ones. Without it nothing
      // is announced on submit: the field errors appear in place, but focus
      // stays on the button and a screen reader user is given no indication
      // that anything happened, let alone where to look.
      const count = Object.keys(errors).length;
      formError.value =
        count === 1
          ? 'There is a problem with one field. Please check it and try again.'
          : `There are problems with ${count} fields. Please check them and try again.`;
      status.value = 'error';
      return;
    }

    status.value = 'submitting';
    formError.value = '';

    try {
      const attachments: Attachment[] = [];
      for (const field of fields.value) {
        const file = field.type === 'file' ? files[field.name] : null;
        if (!file) continue;
        attachments.push({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          content: await readAsBase64(file),
        });
      }

      const res = await fetch('/.netlify/functions/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: def._id,
          formTitle: def.title,
          elapsedSeconds: Math.round((Date.now() - startedAt.value) / 1000),
          website: honeypot.value,
          fields: fields.value
            .filter((f) => f.type !== 'file')
            .map((f) => ({ label: f.label, name: f.name, value: values[f.name] ?? '' })),
          attachments,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Something went wrong. Please try again.');
      }

      status.value = 'success';
      trackLead(def.title, window.location.pathname);
      reset();
    } catch (err) {
      formError.value = err instanceof Error ? err.message : 'Something went wrong.';
      status.value = 'error';
    }
  }

  return { values, files, errors, status, formError, honeypot, fields, setFile, submit, reset };
}
