import type { Config, Context } from '@netlify/functions';
import { Resend } from 'resend';
import { storeConfigured, storeSubmission } from '../lib/submissions';
import { checkAttachment, checkToken, fromThisSite, issueToken, spamReason, type CheckedFile } from '../lib/formGuard';

const DEFAULT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'sales@rmws.com';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'rmws.com';

/** Netlify caps a function request at 6MB. Base64 inflates a file by about a third. */
const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MIN_ELAPSED_SECONDS = 3;

const BRAND = '#710a0c';

/** A submission may carry this many fields and this much text in each. */
const MAX_FIELDS = 60;
const MAX_VALUE_LENGTH = 10_000;

interface Submission {
  formId?: string;
  formTitle?: string;
  formSlug?: string;
  pagePath?: string;
  fields?: { label?: string; name?: string; value?: string }[];
  attachments?: { filename?: string; contentType?: string; content?: string }[];
  website?: string;
  token?: string;
}

interface FormDefinition {
  title?: string;
  slug?: string;
  active?: boolean;
  notifyEmail?: string;
  minimumSeconds?: number;
  fields?: { name?: string; label?: string; type?: string; required?: boolean }[];
}

/**
 * The form as published in the Studio, looked up by ID. It decides which
 * fields are accepted, which are required, the title, and where the email goes
 * — none of that is taken from the request.
 *
 * Returns undefined when Sanity could not be reached, so a CMS outage degrades
 * to the request's own fields rather than losing an inquiry; null when the form
 * does not exist or is switched off.
 */
async function loadForm(formId: string | undefined): Promise<FormDefinition | null | undefined> {
  const projectId = process.env.VITE_SANITY_PROJECT_ID;
  const dataset = process.env.VITE_SANITY_DATASET;
  if (!formId || !/^[\w.-]+$/.test(formId)) return null;
  if (!projectId || !dataset) return undefined;
  try {
    const params = new URLSearchParams({
      query: `*[_type == "dynamicForm" && _id == $id][0]{
        title, "slug": slug.current, active, notifyEmail,
        "minimumSeconds": spamProtection.minimumSeconds,
        fields[]{ name, label, type, required }
      }`,
      $id: JSON.stringify(formId),
      perspective: 'published',
    });
    const res = await fetch(`https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?${params}`);
    if (!res.ok) return undefined;
    const form = ((await res.json()) as { result?: FormDefinition | null }).result;
    return form && form.active !== false ? form : null;
  } catch {
    return undefined;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * A value the recipient can act on: emails and phone numbers become links so
 * replying does not mean retyping. Everything else is escaped text with its
 * line breaks preserved.
 */
function renderValue(value: string): string {
  const safe = escapeHtml(value);
  if (EMAIL.test(value.trim())) {
    return `<a href="mailto:${safe}" style="color:${BRAND};">${safe}</a>`;
  }
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length === 10 && /^[\d\s()+.-]+$/.test(value)) {
    return `<a href="tel:${digits}" style="color:${BRAND};">${safe}</a>`;
  }
  return safe.replace(/\n/g, '<br />');
}

export default async (req: Request, _context: Context) => {
  // GET hands the page a signed token when a form appears (see formGuard.ts).
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ token: issueToken() }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  if (!fromThisSite(req)) {
    return json({ error: 'Forbidden' }, 403);
  }

  // A submission goes two places: the dashboard's inbox and an email. Either
  // one alone still gets it to the business, so neither is required — but with
  // neither there is nowhere for it to go.
  const canEmail = Boolean(process.env.RESEND_API_KEY);
  const canStore = storeConfigured();
  if (!canEmail && !canStore) {
    console.error('Neither RESEND_API_KEY nor the submission store is configured.');
    return json({ error: 'The contact form is not configured. Please call us instead.' }, 500);
  }

  let body: Submission;
  try {
    body = (await req.json()) as Submission;
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }

  // The honeypot: report success so a bot gets no signal about why it was dropped.
  if (body.website) {
    return json({ success: true }, 200);
  }

  const form = await loadForm(body.formId);
  if (form === null) {
    return json({ error: 'This form is no longer available. Please reload the page.' }, 400);
  }

  const tokenProblem = checkToken(body.token, form?.minimumSeconds ?? MIN_ELAPSED_SECONDS);
  if (tokenProblem) {
    return json({ error: tokenProblem }, 400);
  }

  // Only the fields the form defines, labeled as the Studio labels them. When
  // Sanity could not be reached, the request's fields are kept, trimmed.
  const submitted = new Map((body.fields ?? []).map((f) => [String(f?.name ?? ''), String(f?.value ?? '')]));
  const defined = form?.fields?.filter((f) => f.name && f.type !== 'file');
  const fields = (
    defined
      ? defined.map((f) => ({ label: f.label || f.name!, name: f.name!, value: submitted.get(f.name!) ?? '' }))
      : (body.fields ?? []).slice(0, MAX_FIELDS).map((f) => ({
          label: String(f?.label ?? f?.name ?? '').slice(0, 200),
          name: String(f?.name ?? '').slice(0, 60),
          value: String(f?.value ?? ''),
        }))
  )
    .map((f) => ({ ...f, value: f.value.slice(0, MAX_VALUE_LENGTH) }))
    .filter((f) => f.label && f.value.trim());

  if (!fields.length) {
    return json({ error: 'Please fill in the form before submitting.' }, 400);
  }
  const missing = defined?.filter((f) => f.required && !submitted.get(f.name!)?.trim());
  if (missing?.length) {
    const list = missing.map((f) => f.label).join(', ');
    return json({ error: `Please fill in: ${list}${/[.?!]$/.test(list) ? '' : '.'}` }, 400);
  }

  const attachments = body.attachments ?? [];
  const totalBytes = attachments.reduce(
    (sum, a) => sum + Math.ceil(((a.content?.length ?? 0) * 3) / 4),
    0
  );
  if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
    return json({ error: 'Those attachments are too large. Please keep them under 4MB.' }, 413);
  }
  const fileSlots = form?.fields ? form.fields.filter((f) => f.type === 'file').length : 1;
  if (attachments.length > fileSlots) {
    return json({ error: 'Too many attachments.' }, 400);
  }
  const files = attachments.map(checkAttachment);
  if (files.some((f) => !f)) {
    return json({ error: 'Please attach a PDF, Word, RTF, ODT or plain-text document.' }, 400);
  }
  const usableAttachments = files as CheckedFile[];

  const formTitle = (form?.title || body.formTitle || 'Website inquiry').replace(/[\r\n]+/g, ' ').slice(0, 200);
  const formSlug = form?.slug ?? String(body.formSlug ?? '').slice(0, 120);
  const spam = spamReason(fields.map((f) => f.value));

  // Reply-To is what makes the notification useful: hitting reply reaches the
  // person who filled in the form rather than the sending domain.
  const replyTo = fields.find((f) => EMAIL.test(f.value.trim()))?.value.trim();

  const rows = fields
    .map(
      (f) => `
      <tr>
        <td style="padding:10px 14px;font-weight:600;color:#4b5563;vertical-align:top;width:180px;border-bottom:1px solid #f1f1f1;">${escapeHtml(f.label)}</td>
        <td style="padding:10px 14px;color:#1f2937;border-bottom:1px solid #f1f1f1;">${renderValue(f.value)}</td>
      </tr>`
    )
    .join('');

  const store = async () => {
    await storeSubmission({
      formSlug,
      formTitle,
      pagePath: String(body.pagePath ?? '').slice(0, 300),
      fields,
      files: usableAttachments,
      // Likely spam is kept, out of the way, rather than thrown away.
      ...(spam ? { status: 'archived', notes: `Filed automatically as likely spam (${spam}).` } : {}),
    });
  };

  const email = async () => {
    const to = form?.notifyEmail && EMAIL.test(form.notifyEmail.trim()) ? form.notifyEmail.trim() : DEFAULT_TO_EMAIL;
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM_EMAIL,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject: `${formTitle} — ${SITE_DOMAIN}`,
      attachments: usableAttachments.map((a) => ({ filename: a.filename, content: a.content })),
      html: `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;">
          <h2 style="color:${BRAND};margin:0 0 6px;">${escapeHtml(formTitle)}</h2>
          <p style="margin:0 0 22px;font-size:13px;color:#6b7280;">
            Submitted via ${escapeHtml(SITE_DOMAIN)}
          </p>
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
          ${
            usableAttachments.length
              ? `<p style="margin:22px 0 0;font-size:13px;color:#6b7280;">
                   ${usableAttachments.length} attachment${usableAttachments.length === 1 ? '' : 's'}:
                   ${usableAttachments.map((a) => escapeHtml(a.filename)).join(', ')}
                 </p>`
              : ''
          }
        </div>
      `,
    });
    if (error) throw new Error(`Resend: ${JSON.stringify(error)}`);
  };

  // Likely spam is not emailed. When there is no store to file it in, it is
  // emailed after all, so a false positive still reaches someone.
  const sendEmail = canEmail && (!spam || !canStore);

  // Run side by side and judged together: one failing must not lose a
  // submission the other has already delivered.
  const [stored, emailed] = await Promise.allSettled([
    canStore ? store() : Promise.reject(new Error('not configured')),
    sendEmail ? email() : Promise.reject(new Error('not sent')),
  ]);
  if (canStore && stored.status === 'rejected') console.error('Storing the submission failed:', stored.reason);
  if (sendEmail && emailed.status === 'rejected') console.error('Emailing the submission failed:', emailed.reason);

  if (stored.status === 'rejected' && emailed.status === 'rejected') {
    return json({ error: 'Failed to send your message. Please try again.' }, 502);
  }
  return json({ success: true }, 200);
};

/**
 * One path for the page's GET and POST, limited per visitor: enough for anyone
 * filling in a form, far too few for a script. Setting a path also retires the
 * default /.netlify/functions/send-message address, which would bypass it.
 */
export const config: Config = {
  path: '/api/send-message',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
