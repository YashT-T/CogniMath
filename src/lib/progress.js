/* Saves and reads sprint history.
   With the Express server running (npm run dev / npm start) the server is used.
   On static hosting such as Vercel there is no server, so the same data is kept in this browser (localStorage). */
const KEY = 'cm.sprints';

const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
const writeLocal = all => { try { localStorage.setItem(KEY, JSON.stringify(all.slice(-500))); } catch (e) {} };

// Same totals the server's GET /api/progress returns.
function summarize(all) {
  const topics = {}, tags = {};
  for (const s of all) {
    const t = (topics[s.topic] ||= { n: 0, ok: 0 });
    t.n += s.n; t.ok += s.ok;
    for (const [k, v] of Object.entries(s.tags || {})) {
      const g = (tags[k] ||= { n: 0, m: 0 });
      g.n += v.n; g.m += v.m;
    }
  }
  return { plays: all.length, minutes: all.length, best: Math.max(0, ...all.map(s => s.score)), topics, tags, recent: all.slice(-8).reverse() };
}

export function saveSprint(sprint) {
  writeLocal([...readLocal(), { ...sprint, at: Date.now() }]);
  fetch('/api/sprints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sprint) }).catch(() => {});
}

export async function getProgress() {
  try {
    const r = await fetch('/api/progress');
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) return await r.json();
  } catch (e) {}
  return summarize(readLocal());
}
