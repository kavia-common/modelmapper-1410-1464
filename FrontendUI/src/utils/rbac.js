//
// Simple RBAC helpers
//

// PUBLIC_INTERFACE
export function canAccess(roles = [], allowed = []) {
  /** Returns true if roles intersect with allowed; empty allowed means true */
  if (!allowed || allowed.length === 0) return true;
  return roles.some((r) => allowed.includes(r));
}
