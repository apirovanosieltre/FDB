export const MAX_DIETARY_NOTES = 1000;

export function parseDietaryInput(body: Record<string, unknown>, attending: boolean): { notes: string | null; error?: never } | { error: string; notes?: never } {
  if (!attending) return { notes: null };
  if (typeof body.hasAllergies !== 'boolean') return { error: 'Please select Yes or No for food allergies and intolerances.' };
  if (!body.hasAllergies) return { notes: null };
  if (typeof body.allergyDetails !== 'string') return { error: 'Please describe your food allergies or intolerances.' };
  const notes = body.allergyDetails.trim();
  if (notes.length < 3 || notes.length > MAX_DIETARY_NOTES) return { error: 'Please describe your dietary needs in 3 to 1000 characters.' };
  if (body.dietaryConsent !== true) return { error: 'Please consent to sharing your dietary requirements with the organiser.' };
  return { notes };
}

export function newEditToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashEditToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
