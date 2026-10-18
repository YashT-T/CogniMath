/* Questions this person has already been served, kept across every practice space.
   This browser keeps a copy. When the API server is running (npm run dev or npm start), it keeps the master copy too. */
const K = { user: 'cm.user', seen: 'cm.seen.v1' };
const MAX = 5000;

function userId() {
  try {
    let u = localStorage.getItem(K.user);
    if (!u || !/^[a-z0-9]{4,40}$/i.test(u)) {
      u = 'u' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(K.user, u);
    }
    return u;
  } catch (e) { return 'anonymous'; }
}
const USER = userId();

let seen = new Set();
try { seen = new Set(JSON.parse(localStorage.getItem(K.seen)) || []); } catch (e) {}
function save() { try { localStorage.setItem(K.seen, JSON.stringify([...seen].slice(-MAX))); } catch (e) {} }

// Resolves to null when there is no server (opened straight from disk, or the API is not running).
function api(path, body) {
  if (location.protocol === 'file:') return Promise.resolve(null);
  const url = body ? path : path + (path.includes('?') ? '&' : '?') + 'user=' + USER;
  const opts = body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: USER, ...body }) }
    : {};
  return fetch(url, opts).then(r => (r.ok ? r.json() : null)).catch(() => null);
}

api('/api/me').then(s => { if (s && Array.isArray(s.seen)) { s.seen.forEach(k => seen.add(k)); save(); } });

export { USER as userId };
export const isSeen = key => seen.has(key);
let queue = [], timer = null;
function flush() { timer = null; const keys = queue; queue = []; if (keys.length) api('/api/seen', { keys }); }
/* Marks a question as served. Recency is kept (oldest first) and the server keeps the master copy, batched. */
export function markSeen(key) {
  if (!key) return;
  const had = seen.has(key);
  seen.delete(key); seen.add(key);
  save();
  if (!had) { queue.push(String(key).slice(0, 300)); if (!timer) timer = setTimeout(flush, 1500); }
}
/* Picks n items, unseen ones first. If the pool is used up it falls back to the least recently served, so a repeat is never immediate. */
export function freshPick(arr, n, keyFn) {
  const rank = new Map([...seen].map((s, i) => [s, i]));
  const order = [...arr].map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const fresh = order.filter(x => !seen.has(keyFn(x)));
  const old = order.filter(x => seen.has(keyFn(x))).sort((a, b) => rank.get(keyFn(a)) - rank.get(keyFn(b)));
  const out = [...fresh, ...old].slice(0, n);
  out.forEach(x => markSeen(keyFn(x)));
  return out;
}
export function logAnswer(section, ok, key, topic, tag) {
  if (key) markSeen(key);
  api('/api/answers', { section, ok: !!ok, sig: key || null, topic: topic || null, tag: tag || null });
}
