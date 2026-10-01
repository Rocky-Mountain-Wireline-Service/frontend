<script setup lang="ts">
import { computed, ref } from 'vue';
import { PortableText } from '@portabletext/vue';
import { useForm } from '@/composables/useForm';
import { CheckCircle2, AlertCircle, Paperclip } from 'lucide-vue-next';
import type { DynamicForm, PortableText as PT } from '@/types/content';
import SectionHeading from '@/components/ui/SectionHeading.vue';

const props = defineProps<{
  section: { heading?: string; intro?: PT; form?: DynamicForm | null };
}>();

const definition = computed(() => props.section.form ?? null);
const { values, files, errors, status, formError, honeypot, fields, setFile, submit } = useForm(
  () => definition.value
);

const isActive = computed(() => definition.value && definition.value.active !== false);
const useHoneypot = computed(() => definition.value?.spamProtection?.honeypot !== false);
const errorSummary = ref<HTMLElement | null>(null);

const fieldId = (name: string) => `field-${name}`;
const errorId = (name: string) => `field-${name}-error`;

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

const INPUT_CLASS =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus-visible:outline-3 focus-visible:outline-dashed focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2';
</script>

<template>
  <!--
    `scroll-mt` keeps the heading clear of the sticky header when a link lands
    on this anchor; without it the heading sits underneath the bar.
  -->
  <section v-if="isActive" id="contact-form" class="scroll-mt-24 px-6 py-12 md:py-20">
    <div class="mx-auto max-w-2xl">
      <SectionHeading v-if="section.heading">{{ section.heading }}</SectionHeading>
      <div v-if="section.intro?.length" class="prose-body mt-4">
        <PortableText :value="section.intro" />
      </div>
      <p v-if="definition?.description" class="mt-4 text-[var(--color-text-secondary)]">
        {{ definition.description }}
      </p>

      <!-- Success replaces the form: there is nothing left to do here. -->
      <div
        v-if="status === 'success'"
        role="status"
        class="mt-8 flex items-start gap-3 rounded-lg bg-[var(--color-success-light)] p-6 ring-1 ring-[var(--color-success)]"
      >
        <CheckCircle2 :size="22" class="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
        <p class="font-medium text-[var(--color-text)]">
          {{ definition?.successMessage || 'Thanks — we have got your message and will be in touch.' }}
        </p>
      </div>

      <form v-else class="mt-8 space-y-5" novalidate @submit.prevent="onSubmit">
        <div
          v-if="formError"
          ref="errorSummary"
          tabindex="-1"
          role="alert"
          class="flex items-start gap-3 rounded-lg bg-[var(--color-danger-light)] p-4 ring-1 ring-[var(--color-danger)]"
        >
          <AlertCircle :size="20" class="mt-0.5 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
          <p class="text-sm font-medium text-[var(--color-text)]">{{ formError }}</p>
        </div>

        <!--
          The honeypot is positioned off-screen rather than display:none —
          some bots skip fields that are not rendered at all. tabindex="-1" and
          aria-hidden keep it away from real users and assistive tech.
        -->
        <div v-if="useHoneypot" class="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label for="website">Do not fill this out</label>
          <input id="website" v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" />
        </div>

        <div v-for="field in fields" :key="field._key ?? field.name">
          <label :for="fieldId(field.name)" class="mb-1.5 block text-sm font-semibold text-[var(--color-text)]">
            {{ field.label }}
            <span v-if="field.required" class="text-[var(--color-danger)]" aria-hidden="true">*</span>
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
            :class="INPUT_CLASS"
          />

          <select
            v-else-if="field.type === 'select'"
            :id="fieldId(field.name)"
            v-model="values[field.name]"
            :name="field.name"
            :required="field.required"
            :aria-invalid="Boolean(errors[field.name])"
            :aria-describedby="errors[field.name] ? errorId(field.name) : undefined"
            :class="INPUT_CLASS"
          >
            <option value="">Please choose…</option>
            <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>

          <fieldset v-else-if="field.type === 'radio'" class="mt-1 flex flex-wrap gap-x-6 gap-y-2">
            <legend class="sr-only">{{ field.label }}</legend>
            <label
              v-for="opt in field.options"
              :key="opt"
              class="inline-flex items-center gap-2 text-[var(--color-text)]"
            >
              <input
                v-model="values[field.name]"
                type="radio"
                :name="field.name"
                :value="opt"
                class="h-4 w-4 accent-[var(--color-primary)]"
              />
              {{ opt }}
            </label>
          </fieldset>

          <label
            v-else-if="field.type === 'file'"
            :class="[
              INPUT_CLASS,
              'flex cursor-pointer items-center gap-2 text-[var(--color-text-secondary)]',
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
            :class="INPUT_CLASS"
          />

          <p v-if="errors[field.name]" :id="errorId(field.name)" class="mt-1.5 text-sm text-[var(--color-danger)]">
            {{ errors[field.name] }}
          </p>
        </div>

        <button
          type="submit"
          :disabled="status === 'submitting'"
          class="focus-ring inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-8 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ status === 'submitting' ? 'Sending…' : 'Submit' }}
        </button>
      </form>
    </div>
  </section>
</template>
