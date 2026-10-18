/* Saves and reads sprint history, in this order of preference:
   1. Signed in with Supabase: the user's own rows in the "sprints" table (see supabase/schema.sql).
   2. The Express server, when it is running (npm run dev / npm start).
   3. This browser (localStorage), which is what a guest on static hosting such as Vercel gets. */
import { supabase, currentUser } from './supabase.js';

const KEY = 'cm.sprints';
const inSection = (s, section) => (s.section || 'everyone') === section;

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

// sprint: { topic, mode, score, ghost, n, ok, tags, section? }
export async function saveSprint(sprint) {
  const row = { section: 'everyone', ...sprint };
  const user = await currentUser();
  if (user) {
    const { error } = await supabase.from('sprints').insert({
      section: row.section, topic: row.topic, mode: row.mode || null, score: row.score || 0, ghost: row.ghost || 0,
      n: row.n, ok: row.ok, tags: row.tags || {}
    });
    if (!error) return;
  }
  writeLocal([...readLocal(), { ...row, at: Date.now() }]);
  fetch('/api/sprints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) }).catch(() => {});
}

export async function getProgress(section = 'everyone') {
  const user = await currentUser();
  if (user) {
    const { data, error } = await supabase.from('sprints')
      .select('topic, mode, score, ghost, n, ok, tags, created_at')
      .eq('section', section).order('created_at', { ascending: false }).limit(500);
    if (!error && data) return summarize(data.reverse().map(r => ({ ...r, at: Date.parse(r.created_at) })));
  }
  try {
    const r = await fetch('/api/progress?section=' + section);
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) return await r.json();
  } catch (e) {}
  return summarize(readLocal().filter(s => inSection(s, section)));
}
