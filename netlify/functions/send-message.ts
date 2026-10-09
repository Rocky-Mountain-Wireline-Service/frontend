import type { Context } from '@netlify/functions';
import { Resend } from 'resend';
import { storeConfigured, storeSubmission } from '../lib/submissions';

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'sales@rmws.com';
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
  formTitle?: string;
  formSlug?: string;
  pagePath?: string;
  fields?: { label?: string; name?: string; value?: string }[];
  attachments?: { filename?: string; contentType?: string; content?: string }[];
  website?: string;
  elapsedSeconds?: number;
}

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
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return `<a href="mailto:${safe}" style="color:${BRAND};">${safe}</a>`;
  }
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length === 10 && /^[\d\s()+.-]+$/.test(value)) {
    return `<a href="tel:${digits}" style="color:${BRAND};">${safe}</a>`;
  }
  return safe.replace(/\n/g, '<br />');
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
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

  // Both spam checks run again here. The client-side versions only deter naive
  // bots, since anything can POST this endpoint directly.
  if (body.website) {
    // Report success so a bot gets no signal about why it was dropped.
    return json({ success: true }, 200);
  }
  if (typeof body.elapsedSeconds === 'number' && body.elapsedSeconds < MIN_ELAPSED_SECONDS) {
    return json({ error: 'That was submitted a little too quickly. Please try again.' }, 400);
  }

  const fields = (body.fields ?? [])
    .filter((f) => f?.label && String(f.value ?? '').trim())
    .slice(0, MAX_FIELDS)
    .map((f) => ({ ...f, value: String(f.value).slice(0, MAX_VALUE_LENGTH) }));
  if (!fields.length) {
    return json({ error: 'Please fill in the form before submitting.' }, 400);
  }

  const attachments = body.attachments ?? [];
  const totalBytes = attachments.reduce(
    (sum, a) => sum + Math.ceil(((a.content?.length ?? 0) * 3) / 4),
    0
  );
  if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
    return json({ error: 'Those attachments are too large. Please keep them under 4MB.' }, 413);
  }

  // Reply-To is what makes the notification useful: hitting reply reaches the
  // person who filled in the form rather than the sending domain.
  const replyTo = fields.find((f) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.value).trim()))?.value;

  const formTitle = body.formTitle || 'Website enquiry';
  const rows = fields
    .map(
      (f) => `
      <tr>
        <td style="padding:10px 14px;font-weight:600;color:#4b5563;vertical-align:top;width:180px;border-bottom:1px solid #f1f1f1;">${escapeHtml(f.label!)}</td>
        <td style="padding:10px 14px;color:#1f2937;border-bottom:1px solid #f1f1f1;">${renderValue(String(f.value))}</td>
      </tr>`
    )
    .join('');

  const usableAttachments = attachments.filter((a) => a.filename && a.content);

  const store = async () => {
    await storeSubmission({
      formSlug: String(body.formSlug ?? '').slice(0, 120),
      formTitle: formTitle.slice(0, 200),
      pagePath: String(body.pagePath ?? '').slice(0, 300),
      fields: fields.map((f) => ({ label: f.label!, name: f.name ?? '', value: String(f.value) })),
      files: usableAttachments.map((a) => ({
        filename: a.filename!.slice(0, 200),
        contentType: a.contentType ?? '',
        content: a.content!,
      })),
    });
  };

  const email = async () => {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      ...(replyTo ? { replyTo: String(replyTo) } : {}),
      subject: `${formTitle} — ${SITE_DOMAIN}`,
      attachments: attachments
        .filter((a) => a.filename && a.content)
        .map((a) => ({ filename: a.filename!, content: a.content! })),
      html: `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;">
          <h2 style="color:${BRAND};margin:0 0 6px;">${escapeHtml(formTitle)}</h2>
          <p style="margin:0 0 22px;font-size:13px;color:#6b7280;">
            Submitted via ${escapeHtml(SITE_DOMAIN)}
          </p>
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
          ${
            attachments.length
              ? `<p style="margin:22px 0 0;font-size:13px;color:#6b7280;">
                   ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}:
                   ${attachments.map((a) => escapeHtml(a.filename ?? 'file')).join(', ')}
                 </p>`
              : ''
          }
        </div>
      `,
    });
    if (error) throw new Error(`Resend: ${JSON.stringify(error)}`);
  };

  // Run side by side and judged together: one failing must not lose a
  // submission the other has already delivered.
  const [stored, emailed] = await Promise.allSettled([
    canStore ? store() : Promise.reject(new Error('not configured')),
    canEmail ? email() : Promise.reject(new Error('not configured')),
  ]);
  if (canStore && stored.status === 'rejected') console.error('Storing the submission failed:', stored.reason);
  if (canEmail && emailed.status === 'rejected') console.error('Emailing the submission failed:', emailed.reason);

  if (stored.status === 'rejected' && emailed.status === 'rejected') {
    return json({ error: 'Failed to send your message. Please try again.' }, 502);
  }
  return json({ success: true }, 200);
};
