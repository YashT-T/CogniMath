import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(here, 'data.json');           // created on the first saved sprint
const DIST = path.join(here, '../dist');
const PORT = process.env.PORT || 3001;

const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; } };
const app = express();
app.use(express.json({ limit: '50kb' }));

// Save one finished sprint.
app.post('/api/sprints', (req, res) => {
  const { topic, mode, score, ghost, n, ok, tags, section } = req.body || {};
  if (typeof topic !== 'string' || !Number.isFinite(n) || !Number.isFinite(ok)) {
    return res.status(400).json({ error: 'Invalid sprint' });
  }
  const all = load();
  all.push({ section: typeof section === 'string' ? section.slice(0, 20) : 'everyone', topic, mode, score: +score || 0, ghost: +ghost || 0, n, ok, tags: tags || {}, at: Date.now() });
  fs.writeFileSync(FILE, JSON.stringify(all.slice(-500)));
  res.status(201).json({ saved: true });
});

// Everything the Progress page needs. Sprints are kept per practice space; the Everyone space is the default.
app.get('/api/progress', (req, res) => {
  const sec = typeof req.query.section === 'string' ? req.query.section : 'everyone';
  const all = load().filter(s => (s.section || 'everyone') === sec), topics = {}, tags = {};
  for (const s of all) {
    const t = (topics[s.topic] ||= { n: 0, ok: 0 });
    t.n += s.n; t.ok += s.ok;
    for (const [k, v] of Object.entries(s.tags || {})) {
      const g = (tags[k] ||= { n: 0, m: 0 });
      g.n += v.n; g.m += v.m;
    }
  }
  res.json({
    plays: all.length,
    minutes: all.length,                              // every sprint is 60 seconds
    best: Math.max(0, ...all.map(s => s.score)),
    topics, tags,
    recent: all.slice(-8).reverse()
  });
});

/* Per-person record: every question already served (so it is not repeated again), and a log of answers. */
const RFILE = path.join(here, 'records.json');
let R = (() => { try { return JSON.parse(fs.readFileSync(RFILE, 'utf8')); } catch { return {}; } })();
const saveR = () => { try { fs.writeFileSync(RFILE, JSON.stringify(R)); } catch (e) { console.error('Could not save records:', e.message); } };
const userOf = req => { const u = String((req.query && req.query.user) || (req.body && req.body.user) || ''); return /^[a-z0-9]{4,40}$/i.test(u) ? u : null; };
const recOf = u => (R[u] ||= { seen: [], log: [] });

app.get('/api/me', (req, res) => {
  const u = userOf(req); if (!u) return res.status(400).json({ error: 'Missing or invalid user' });
  res.json({ seen: recOf(u).seen });
});

app.post('/api/answers', (req, res) => {
  const u = userOf(req); if (!u) return res.status(400).json({ error: 'Missing or invalid user' });
  const { section, ok, sig, topic, tag } = req.body || {};
  const r = recOf(u);
  r.log.push({
    section: typeof section === 'string' ? section.slice(0, 20) : 'everyone',
    topic: typeof topic === 'string' ? topic.slice(0, 40) : null,
    tag: typeof tag === 'string' ? tag.slice(0, 60) : null,
    ok: ok === true, day: new Date().toISOString().slice(0, 10), at: Date.now()
  });
  r.log = r.log.slice(-3000);
  if (typeof sig === 'string' && sig && !r.seen.includes(sig.slice(0, 300))) r.seen.push(sig.slice(0, 300));
  r.seen = r.seen.slice(-5000);
  saveR();
  res.json({ ok: true, count: r.log.length });
});


// Batch of question signatures served to this person (used by every practice space so nothing repeats).
app.post('/api/seen', (req, res) => {
  const u = userOf(req); if (!u) return res.status(400).json({ error: 'Missing or invalid user' });
  const r = recOf(u), have = new Set(r.seen);
  for (const k of (Array.isArray(req.body.keys) ? req.body.keys : []).slice(0, 100)) {
    if (typeof k === 'string' && k && !have.has(k.slice(0, 300))) { r.seen.push(k.slice(0, 300)); have.add(k.slice(0, 300)); }
  }
  r.seen = r.seen.slice(-5000);
  saveR();
  res.json({ ok: true, count: r.seen.length });
});

// Facts for notifications: how today compares, and the topic that felt hardest this week.
app.get('/api/nudges', (req, res) => {
  const u = userOf(req); if (!u) return res.status(400).json({ error: 'Missing or invalid user' });
  const log = recOf(u).log, day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const week = log.filter(l => l.day >= day(6)), by = {};
  for (const l of week) if (l.topic) { const t = (by[l.topic] ||= { n: 0, ok: 0 }); t.n++; if (l.ok) t.ok++; }
  const hard = Object.entries(by).filter(([, t]) => t.n >= 4).map(([topic, t]) => ({ topic, acc: Math.round(100 * t.ok / t.n) })).sort((a, b) => a.acc - b.acc)[0];
  res.json({ today: log.filter(l => l.day === day(0)).length, week: week.length, weak: hard && hard.acc < 70 ? hard : null });
});

// In production, serve the built React app.
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}
app.listen(PORT, () => console.log(`CogniMath API on http://localhost:${PORT}`));
