/**
 * Normalise un numéro de téléphone international
 * Exemples:
 *   +213 0554581332 → +213554581332
 *   +213 554581332  → +213554581332
 *   +33 6 12 34 56 78 → +33612345678
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // 1. Supprimer tous les espaces, tirets, parenthèses
  let normalized = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // 2. S'assurer qu'il commence par +
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  // 3. Supprimer le 0 après l'indicatif pays (courant en Algérie, France, etc.)
  // +213 0554... → +213 554...
  // +33 06... → +33 6...
  const patterns = [
    { regex: /^\+213\s*0(\d+)$/, replace: '+213$1' },  // Algérie
    { regex: /^\+33\s*0(\d+)$/, replace: '+33$1' },    // France
    { regex: /^\+212\s*0(\d+)$/, replace: '+212$1' },  // Maroc
    { regex: /^\+216\s*0(\d+)$/, replace: '+216$1' },  // Tunisie
    { regex: /^\+49\s*0(\d+)$/, replace: '+49$1' },    // Allemagne
    { regex: /^\+39\s*0(\d+)$/, replace: '+39$1' },    // Italie
    { regex: /^\+34\s*0(\d+)$/, replace: '+34$1' },    // Espagne
  ];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(normalized)) {
      normalized = normalized.replace(pattern.regex, pattern.replace);
      break;
    }
  }
  
  return normalized;
}

/**
 * Vérifie si deux numéros sont identiques après normalisation
 */
export function arePhoneNumbersEqual(phone1: string, phone2: string): boolean {
  return normalizePhoneNumber(phone1) === normalizePhoneNumber(phone2);
}