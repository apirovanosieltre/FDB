/** Keep accents meaningful, while ignoring case, Unicode composition and extra spaces. */
export function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
}
export function guestKey(firstName: string, lastName: string): string {
  return JSON.stringify([cleanName(firstName).toLowerCase(), cleanName(lastName).toLowerCase()]);
}
