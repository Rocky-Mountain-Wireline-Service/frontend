<script setup lang="ts">
import { computed, ref } from 'vue';
import { PortableText } from '@portabletext/vue';
import { useForm } from '@/composables/useForm';
import SectionHeading from '@/components/ui/SectionHeading.vue';
import { CheckCircle2, AlertCircle, Paperclip } from 'lucide-vue-next';
import type { DynamicForm, PortableText as PT } from '@/types/content';

const props = defineProps<{
  section: {
    heading?: string;
    intro?: PT;
    tone?: 'brand' | 'light';
    form?: DynamicForm | null;
  };
}>();

const definition = computed(() => props.section.form ?? null);
const { values, files, errors, status, formError, honeypot, fields, setFile, submit } = useForm(
  () => definition.value
);

const isActive = computed(() => definition.value && definition.value.active !== false);
const useHoneypot = computed(() => definition.value?.spamProtection?.honeypot !== false);
const errorSummary = ref<HTMLElement | null>(null);

/**
 * Brand is the default: on a short, high-intent form the red card carries
 * weight. A long one is a task rather than a moment — a job application is
 * worked through, not glanced at — and a calmer ground is easier to sit with.
 */
const isBrand = computed(() => (props.section.tone ?? 'brand') === 'brand');

/**
 * A form that puts fields side by side needs room for them; one that does not
 * reads better narrow. Derived from the fields themselves rather than asked of
 * the editor, since it follows from a choice they have already made.
 */
const isMultiColumn = computed(() => fields.value.some((f) => f.width && f.width !== 'full'));
const cardWidth = computed(() => (isMultiColumn.value ? 'max-w-4xl' : 'max-w-2xl'));

const fieldId = (name: string) => `field-${name}`;
const errorId = (name: string) => `field-${name}-error`;

const SPANS = {
  full: 'col-span-6',
  half: 'col-span-6 sm:col-span-3',
  third: 'col-span-6 sm:col-span-2',
} as const;
const spanFor = (field: { width?: 'full' | 'half' | 'third' }) => SPANS[field.width ?? 'full'];

async function onSubmit() {
  await submit();
  // Move focus to the error summary so a screen reader announces the failure
  // rather than leaving the user at a submit button with no feedback.
  if (status.value === 'error') {
    await new Promise((r) => requestAnimationFrame(r));
    errorSummary.value?.focus();
  }
}

function onFileChange(name: string, event: Event) {
  const input = event.target as HTMLInputElement;
  setFile(name, input.files?.[0] ?? null);
}

// ── Tone-dependent classes, named once rather than inlined per element ───────
const cardClass = computed(() =>
  isBrand.value
    ? 'bg-[var(--color-primary)] shadow-lg ring-1 ring-[var(--color-secondary)]/40'
    : 'bg-[var(--color-bg-card)] shadow-md ring-1 ring-[var(--color-border)]'
);
const labelClass = computed(() =>
  isBrand.value ? 'text-white' : 'text-[var(--color-text)]'
);
const requiredClass = computed(() =>
  isBrand.value ? 'text-[var(--color-secondary)]' : 'text-[var(--color-danger)]'
);
const introClass = computed(() =>
  isBrand.value ? 'text-white/85' : 'text-[var(--color-text-secondary)]'
);
const errorTextClass = computed(() =>
  // The page's danger red is unreadable on the red card.
  isBrand.value ? 'text-[#ffd9d9]' : 'text-[var(--color-danger)]'
);
const inputClass = computed(() =>
  isBrand.value
    ? 'w-full rounded-md border border-transparent bg-white px-3.5 py-2.5 text-[#1f2937] transition-colors placeholder:text-[#6b7280] focus:border-[var(--color-secondary)] focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-white focus-visible:outline-offset-2'
    : 'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2'
);
const submitClass = computed(() =>
  isBrand.value
    ? 'focus-ring-light bg-[var(--color-secondary)] text-[#1a1a1a] hover:bg-[var(--color-secondary-hover)]'
    : 'focus-ring bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
);
</script>

<template>
  <section
    v-if="isActive"
    id="contact-form"
    class="scroll-mt-24 bg-[var(--color-bg-secondary)] px-6 py-12 md:py-16"
  >
    <!--
      The form sits in a card rather than loose on the page. Unconstrained it
      was a column of fields in a much wider field of background with nothing
      balancing it, which is what reads as empty space — the fields had no
      edges. The off-white ground is what lets the card have an edge at all; on
      pure white a light panel needs a border to exist.
    -->
    <div :class="['mx-auto overflow-hidden rounded-lg', cardWidth, cardClass]">
      <div class="px-6 py-10 sm:px-10">
        <SectionHeading v-if="section.heading" align="center" :invert="isBrand">
          {{ section.heading }}
        </SectionHeading>

        <div
          v-if="section.intro?.length"
          :class="['form-intro mt-5 text-center', introClass]"
        >
          <PortableText :value="section.intro" />
        </div>
        <p v-if="definition?.description" :class="['mt-4 text-center', introClass]">
          {{ definition.description }}
        </p>

        <!-- Success replaces the form: there is nothing left to do here. -->
        <div
          v-if="status === 'success'"
          role="status"
          :class="[
            'mt-8 flex items-start gap-3 rounded-md p-6',
            isBrand
              ? 'bg-black/25 ring-1 ring-[var(--color-secondary)]/60'
              : 'bg-[var(--color-success-light)] ring-1 ring-[var(--color-success)]',
          ]"
        >
          <CheckCircle2
            :size="22"
            :class="['mt-0.5 shrink-0', isBrand ? 'text-[var(--color-secondary)]' : 'text-[var(--color-success)]']"
            aria-hidden="true"
          />
          <p :class="['font-medium', isBrand ? 'text-white' : 'text-[var(--color-text)]']">
            {{ definition?.successMessage || 'Thanks — we have got your message and will be in touch.' }}
          </p>
        </div>

        <form
          v-else
          class="mt-8 grid grid-cols-6 gap-x-4 gap-y-5"
          novalidate
          @submit.prevent="onSubmit"
        >
          <div
            v-if="formError"
            ref="errorSummary"
            tabindex="-1"
            role="alert"
            :class="[
              'col-span-6 flex items-start gap-3 rounded-md p-4',
              isBrand
                ? 'bg-black/25 ring-1 ring-[#ffd9d9]/50'
                : 'bg-[var(--color-danger-light)] ring-1 ring-[var(--color-danger)]',
            ]"
          >
            <AlertCircle :size="20" :class="['mt-0.5 shrink-0', errorTextClass]" aria-hidden="true" />
            <p :class="['text-sm font-medium', isBrand ? 'text-white' : 'text-[var(--color-text)]']">
              {{ formError }}
            </p>
          </div>

          <!--
            The honeypot is positioned off-screen rather than display:none —
            some bots skip fields that are not rendered at all. tabindex="-1"
            and aria-hidden keep it away from real users and assistive tech.
          -->
          <div v-if="useHoneypot" class="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label for="website">Do not fill this out</label>
            <input id="website" v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" />
          </div>

          <div v-for="field in fields" :key="field._key ?? field.name" :class="spanFor(field)">
            <label :for="fieldId(field.name)" :class="['mb-1.5 block text-sm font-semibold', labelClass]">
              {{ field.label }}
              <span v-if="field.required" :class="requiredClass" aria-hidden="true">*</span>
              <span v-if="field.required" class="sr-only">(required)</span>
            </label>

            <textarea
              v-if="field.type === 'textarea'"
              :id="fieldId(field.name)"
              v-model="values[field.name]"
              :name="field.name"
              rows="5"
              :required="field.required"
              :aria-invalid="Boolean(errors[field.name])"
              :aria-describedby="errors[field.name] ? errorId(field.name) : undefined"
              :class="inputClass"
            />

            <select
              v-else-if="field.type === 'select'"
              :id="fieldId(field.name)"
              v-model="values[field.name]"
              :name="field.name"
              :required="field.required"
              :aria-invalid="Boolean(errors[field.name])"
              :aria-describedby="errors[field.name] ? errorId(field.name) : undefined"
              :class="inputClass"
            >
              <option value="">Please choose…</option>
              <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>

            <fieldset v-else-if="field.type === 'radio'" class="mt-1 flex flex-wrap gap-x-6 gap-y-2">
              <legend class="sr-only">{{ field.label }}</legend>
              <label
                v-for="opt in field.options"
                :key="opt"
                :class="['inline-flex items-center gap-2', labelClass]"
              >
                <input
                  v-model="values[field.name]"
                  type="radio"
                  :name="field.name"
                  :value="opt"
                  :class="['h-4 w-4', isBrand ? 'accent-[var(--color-secondary)]' : 'accent-[var(--color-primary)]']"
                />
                {{ opt }}
              </label>
            </fieldset>

            <label
              v-else-if="field.type === 'file'"
              :class="[
                inputClass,
                'flex cursor-pointer items-center gap-2',
                isBrand ? 'text-[#4b5563]' : 'text-[var(--color-text-secondary)]',
              ]"
            >
              <Paperclip :size="16" aria-hidden="true" />
              <span class="truncate">{{ files[field.name]?.name || 'Choose a file (max 4MB)' }}</span>
              <input
                :id="fieldId(field.name)"
                type="file"
                :name="field.name"
                :required="field.required"
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
                class="sr-only"
                @change="onFileChange(field.name, $event)"
              />
            </label>

            <input
              v-else
              :id="fieldId(field.name)"
              v-model="values[field.name]"
              :name="field.name"
              :type="field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
              :required="field.required"
              :aria-invalid="Boolean(errors[field.name])"
              :aria-describedby="errors[field.name] ? errorId(field.name) : undefined"
              :class="inputClass"
            />

            <p
              v-if="errors[field.name]"
              :id="errorId(field.name)"
              :class="['mt-1.5 text-sm font-medium', errorTextClass]"
            >
              {{ errors[field.name] }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="status === 'submitting'"
            :class="[
              'col-span-6 mt-1 w-full rounded-md px-8 py-3.5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              submitClass,
            ]"
          >
            {{ status === 'submitting' ? 'Sending…' : 'Submit' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-intro :deep(p + p) {
  margin-top: 0.5rem;
}
</style>
