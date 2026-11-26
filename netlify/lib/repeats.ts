import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';

/**
 * Catches the same message arriving again under a different name.
 *
 * Vendor campaigns send one script to thousands of contact forms, changing
 * only the sender's name and company: three "headset" pitches reached the
 * sales inbox in five days, each signed by someone else. An exact match would
 * miss them, so messages are compared by their overlapping three-word runs,
 * which survive a changed signature line.
 *
 * Only a fingerprint of each message is kept (hashes of those runs, in Netlify
 * Blobs), never its text, and only for 60 days. When the store cannot be
 * reached (local preview, an outage) the check is skipped.
 */

const STORE = 'form-repeats';
const KEEP_DAYS = 60;
const KEEP_MESSAGES = 300;
/** Shorter messages ("Please call me about a job") are too alike to compare. */
const MIN_WORDS = 25;
/** Share of three-word runs two messages must have in common to count as the same. */
const SIMILAR = 0.6;

interface Seen {
  at: number;
  runs: string[];
}

/** Three-word runs of the message, hashed, with addresses, links and numbers taken out. */
function fingerprint(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/\S+@\S+/g, ' ')
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/g, ' ')
    .replace(/[^\p{L}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < MIN_WORDS) return [];
  const runs = new Set<string>();
  for (let i = 0; i + 3 <= words.length; i++) {
    runs.add(createHash('sha1').update(words.slice(i, i + 3).join(' ')).digest('base64').slice(0, 10));
  }
  return [...runs];
}

const overlap = (a: Set<string>, b: string[]) => {
  const shared = b.filter((run) => a.has(run)).length;
  return shared / Math.min(a.size, b.length);
};

/**
 * Whether a message like this one arrived within the last 60 days, for the
 * form named. Every long-enough message is remembered, so the second copy of
 * a campaign is caught even when the first got through.
 */
export async function isRepeat(formKey: string, message: string): Promise<boolean> {
  const runs = fingerprint(message);
  if (!runs.length) return false;

  try {
    const store = getStore(STORE);
    const key = formKey.replace(/[^\w-]/g, '_');
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    const seen = ((await store.get(key, { type: 'json' })) as Seen[] | null)?.filter((s) => s.at > cutoff) ?? [];

    const mine = new Set(runs);
    const repeat = seen.some((s) => overlap(mine, s.runs) >= SIMILAR);

    await store.setJSON(key, [...seen, { at: Date.now(), runs }].slice(-KEEP_MESSAGES));
    return repeat;
  } catch (err) {
    console.error('Repeat check skipped:', err instanceof Error ? err.message : err);
    return false;
  }
}
