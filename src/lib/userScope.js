/* Which person is using the app right now, so saved data can be kept per user.
   A signed-in user gets their own keys (base + ":" + user id). A guest keeps the plain keys,
   so anything saved before accounts existed is still there for guest use. */
let uid = null;

// Returns true when the person actually changed.
export function setScopeUser(id) {
  id = id || null;
  if (id === uid) return false;
  uid = id;
  return true;
}
export const scoped = base => (uid ? `${base}:${uid}` : base);
