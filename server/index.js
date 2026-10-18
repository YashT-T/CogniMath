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

// In production, serve the built React app.
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}
app.listen(PORT, () => console.log(`CogniMath API on http://localhost:${PORT}`));
