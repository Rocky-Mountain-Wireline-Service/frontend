import { createClient } from '@libsql/client/web';

/**
 * Keeps a copy of each form submission so the client's dashboard can list and
 * manage them. Email alone meant a submission existed only in someone's inbox:
 * nothing to search, no record of what had been dealt with, and a résumé lost
 * the moment a message was deleted.
 *
 * Env:
 *   TURSO_CONFIG      {"databaseUrl":"…","authToken":"…"}
 *   FORMS_CLIENT_ID   this site's client ID in that database
 *
 * The tables are created by the dashboard repo (db/form-submissions.sql).
 */

export interface StoredField {
  label: string;
  name: string;
  value: string;
}

export interface StoredFile {
  filename: string;
  contentType: string;
  /** base64 */
  content: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function storeConfigured(): boolean {
  return Boolean(process.env.TURSO_CONFIG && process.env.FORMS_CLIENT_ID);
}

/** Which inbox a form belongs in, from what the form is called. */
export function kindOf(slug: string, title: string): 'contact' | 'application' | 'other' {
  const text = `${slug} ${title}`.toLowerCase();
  if (/employ|applic|career|job|hiring/.test(text)) return 'application';
  if (/contact|sales|inquir|enquir|quote|message/.test(text)) return 'contact';
  return 'other';
}

/** The person's name, email and phone, found among whatever fields the form has. */
function identify(fields: StoredField[]) {
  const byName = (pattern: RegExp) =>
    fields.find((f) => pattern.test(f.name.toLowerCase()) && f.value.trim())?.value.trim() ?? '';

  const full = byName(/^(full)?name$/);
  const name = full || [byName(/^first/), byName(/^last/)].filter(Boolean).join(' ');
  const email = fields.find((f) => EMAIL.test(f.value.trim()))?.value.trim() ?? '';
  const phone = byName(/^(mobile)?phone$/) || byName(/phone|tel/);
  return { name: name || null, email: email || null, phone: phone || null };
}

export async function storeSubmission(input: {
  formSlug: string;
  formTitle: string;
  pagePath: string;
  fields: StoredField[];
  files: StoredFile[];
}): Promise<void> {
  const { databaseUrl, authToken } = JSON.parse(process.env.TURSO_CONFIG || '{}');
  const clientId = process.env.FORMS_CLIENT_ID;
  if (!databaseUrl || !authToken || !clientId) throw new Error('Submission store is not configured');

  const db = createClient({ url: databaseUrl, authToken });
  // Generated here rather than by the database so the files can name the
  // submission they belong to within the same batch.
  const id = crypto.randomUUID().replace(/-/g, '');
  const who = identify(input.fields);

  // One transaction: a submission never lands without its résumé, or the reverse.
  await db.batch(
    [
      {
        sql: `INSERT INTO form_submissions
                (id, client_id, kind, form_slug, form_title, name, email, phone, fields, page_path)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          clientId,
          kindOf(input.formSlug, input.formTitle),
          input.formSlug || null,
          input.formTitle,
          who.name,
          who.email,
          who.phone,
          JSON.stringify(input.fields),
          input.pagePath || null,
        ],
      },
      ...input.files.map((file) => {
        const bytes = Buffer.from(file.content, 'base64');
        return {
          sql: `INSERT INTO form_submission_files
                  (submission_id, client_id, filename, content_type, size, content)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [id, clientId, file.filename, file.contentType || null, bytes.length, bytes],
        };
      }),
    ],
    'write'
  );
}
