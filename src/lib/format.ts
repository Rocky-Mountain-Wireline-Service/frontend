/**
 * Display formatting shared across components.
 *
 * Phone numbers are stored as bare digits in the CMS ("9702459828") because
 * that is how the legacy data held them. Formatting on the way out keeps the
 * stored value canonical and easy to validate, while readers get something they
 * can scan — and it means changing the house style is one edit, not one per
 * component.
 */

/** (970) 245-9828 — the house style. Anything not a US 10-digit number is left alone. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 1-970-245-9828 and +1 970 245 9828 both arrive as 11 digits led by a 1.
  if (digits.length === 11 && digits.startsWith('1')) {
    const local = digits.slice(1);
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return phone;
}

/** A dialable href. Punctuation is stripped so the handset gets only digits. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** True when a contact card's link is a phone number, so its value can be formatted. */
export function isTelHref(href?: string): boolean {
  return Boolean(href?.startsWith('tel:'));
}
