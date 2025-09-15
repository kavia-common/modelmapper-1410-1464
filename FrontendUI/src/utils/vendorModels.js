//
// Placeholder utility for vendor models fetching / transformation.
// In production, this would fetch from backend and transform to UI-friendly list.
//

// PUBLIC_INTERFACE
export function normalizeYangModels(models = []) {
  /** Normalize list of models (strings) and ensure uniqueness */
  const set = new Set(models.filter(Boolean).map(String));
  return Array.from(set);
}
