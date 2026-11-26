import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Server-side defenses for the website forms. The page is static, so anything
 * the browser reports (how long the form was open, which fields it has, what a
 * file is) can be forged by a script that POSTs the endpoint directly. Each
 * check here rests on something the server controls instead.
 */

// ─── Form token ──────────────────────────────────────────────────────────────
// The page asks for a signed timestamp when a form appears and sends it back
// on submit. A submission without one never loaded the page; one returned too
// soon was filled in faster than a person reads; one days old was replayed.
// The signing key is FORM_TOKEN_SECRET, or derived from a secret the site
// already holds so the check works without another environment variable.

const MAX_TOKEN_AGE_SECONDS = 24 * 60 * 60;

function signingKey(): string | null {
  const base = process.env.FORM_TOKEN_SECRET || process.env.RESEND_API_KEY || process.env.FORMS_INTAKE_SECRET;
  return base ? createHash('sha256').update(`rmws-form-token:${base}`).digest('hex') : null;
}

const sign = (key: string, issued: string) => createHmac('sha256', key).update(issued).digest('base64url');

export function issueToken(): string | null {
  const key = signingKey();
  if (!key) return null;
  const issued = String(Math.floor(Date.now() / 1000));
  return `${issued}.${sign(key, issued)}`;
}

/** Null when the token is good; otherwise the message to show the visitor. */
export function checkToken(token: unknown, minimumSeconds: number): string | null {
  const key = signingKey();
  if (!key) return null; // nothing to sign with: fall back to the other checks
  const reload = 'This form has expired. Please reload the page and try again.';
  if (typeof token !== 'string' || !/^\d+\.[\w-]+$/.test(token)) return reload;
  const [issued, mac] = token.split('.');
  const expected = Buffer.from(sign(key, issued));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return reload;
  const age = Date.now() / 1000 - Number(issued);
  if (age > MAX_TOKEN_AGE_SECONDS) return reload;
  if (age < minimumSeconds) return 'That was submitted a little too quickly. Please try again.';
  return null;
}

// ─── Cloudflare Turnstile ────────────────────────────────────────────────────
// A challenge a person passes without noticing and a script does not. On only
// when both keys are set, so the forms work the same without them. The site key
// reaches the page through the form-token request, not the build.

export function turnstileSiteKey(): string | null {
  const { TURNSTILE_SITE_KEY: site, TURNSTILE_SECRET_KEY: secret } = process.env;
  return site && secret ? site : null;
}

/** Null when the visitor passed (or Turnstile is off); otherwise the message to show them. */
export async function checkTurnstile(token: unknown, ip: string | null): Promise<string | null> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSiteKey() || !secret) return null;
  const retry = 'We could not verify this submission. Please try again.';
  if (typeof token !== 'string' || !token || token.length > 2048) return retry;

  const params = new URLSearchParams({ secret, response: token });
  if (ip) params.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
      signal: AbortSignal.timeout(5000),
    });
    const outcome = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (outcome.success) return null;
    console.warn('Turnstile refused a submission:', outcome['error-codes']?.join(', ') || 'no reason given');
    return retry;
  } catch (err) {
    // Cloudflare unreachable: let it through to the content checks rather than
    // turn a real customer away during someone else's outage.
    console.error('Turnstile could not be checked:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Same-site requests ──────────────────────────────────────────────────────

/** Browsers always send Origin on a cross-site POST; it must be this site. */
export function fromThisSite(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin fetches may omit it; the token still applies
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

// ─── Content ─────────────────────────────────────────────────────────────────
// Real inquiries to a wireline company rarely carry links; SEO and "guest post"
// spam is made of them. A match is kept out of the inbox and email but still
// stored (archived, with the reason), so a false positive is never lost.
//
// Sales inquiries are held to more: after launch a third of them were vendors
// pitching services, typed by hand or by a script that passes as a person. Any
// link, or the stock phrases of a cold pitch, files one as archived. Job
// applications keep the looser rule, since applicants link their LinkedIn.

const LINK = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]{2,}/gi;
const MARKUP = /<a\s+href|\[url[=\]]|\[link[=\]]/i;
const PITCH = [
  /\bfree trial\b/i,
  /\b(15|fifteen|10|ten|quick)[- ]minute (call|chat|meeting)\b/i,
  /\bsocial media (management|marketing|services)\b/i,
  /\bseo (services|agency|audit|expert)\b/i,
  /\bsearch engine optimi[sz]ation\b/i,
  /\b(first|top) page (of|on) google\b/i,
  /\bguest post/i,
  /\bbacklinks?\b/i,
  /\blead generation\b/i,
  /\bappointment setting\b/i,
  /\bper accepted hour\b/i,
  /\b(if it'?s|if this is) not a (good )?fit\b/i,
  /\bwon'?t (reach out|contact you|email you) again\b/i,
  /\bunsubscribe\b|\bopt[- ]out\b/i,
];

export function spamReason(values: string[], { sales = false } = {}): string | null {
  const text = values.join('\n');
  if (MARKUP.test(text)) return 'contains link markup';
  const links = text.match(LINK)?.length ?? 0;
  if (sales && links) return links === 1 ? 'contains a link' : `contains ${links} links`;
  if (links > 2) return `contains ${links} links`;
  if (sales) {
    const pitch = PITCH.map((re) => text.match(re)?.[0]).find(Boolean);
    if (pitch) return `reads as a sales pitch ("${pitch}")`;
  }
  return null;
}

// ─── Attachments ─────────────────────────────────────────────────────────────
// The form accepts résumés. The file's name and stated type come from the
// browser, so its first bytes decide whether it really is one of these.

const DOCUMENT_TYPES: Record<string, { type: string; matches: (head: Buffer) => boolean }> = {
  pdf: { type: 'application/pdf', matches: (h) => h.subarray(0, 5).toString('latin1') === '%PDF-' },
  doc: { type: 'application/msword', matches: (h) => h.subarray(0, 4).toString('hex') === 'd0cf11e0' },
  docx: {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    matches: (h) => h.subarray(0, 4).toString('hex') === '504b0304',
  },
  odt: { type: 'application/vnd.oasis.opendocument.text', matches: (h) => h.subarray(0, 4).toString('hex') === '504b0304' },
  rtf: { type: 'application/rtf', matches: (h) => h.subarray(0, 5).toString('latin1') === '{\\rtf' },
  txt: { type: 'text/plain', matches: (h) => !h.includes(0) },
};

export interface CheckedFile {
  filename: string;
  contentType: string;
  content: string;
}

/** The file with a clean name and a type the server determined, or null. */
export function checkAttachment(file: { filename?: string; content?: string }): CheckedFile | null {
  if (!file.filename || !file.content) return null;
  const ext = file.filename.toLowerCase().split('.').pop() ?? '';
  const kind = DOCUMENT_TYPES[ext];
  if (!kind) return null;
  const head = Buffer.from(file.content.slice(0, 1400), 'base64');
  if (!kind.matches(head)) return null;
  const base = file.filename
    .slice(0, -(ext.length + 1))
    .replace(/[^\p{L}\p{N} .()_-]+/gu, '_')
    .replace(/^[\s._]+/, '')
    .trim()
    .slice(0, 120);
  return { filename: `${base || 'attachment'}.${ext}`, contentType: kind.type, content: file.content };
}
