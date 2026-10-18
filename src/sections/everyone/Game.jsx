import { useEffect, useReducer, useRef, useState } from 'react';
import CM from '../../lib/questions.js';
import review from '../../lib/review.js';
import { MODES } from '../../lib/modes.js';
import { recordAnswer } from '../../lib/history.js';
import { saveSprint } from '../../lib/progress.js';
import { recordSprint } from '../../lib/rewards.js';
import SprintRewards from '../../components/SprintRewards.jsx';

const SECS = 60;

export default function Game({ topic, mode, onClose }) {
  const dlg = useRef(null);
  const G = useRef(null);                 // all mutable sprint state lives here
  const [, bump] = useReducer(x => x + 1, 0);
  const [R, setR] = useState(null);       // review, set when the sprint ends

  const finish = () => {
    const g = G.current;
    if (g.over) return;
    g.over = true; clearTimeout(g.adv);
    const res = review({ log: g.log, score: g.score, ghost: g.gs });
    try { localStorage.setItem('cm.recent', JSON.stringify([...g.recent, ...g.seen].slice(-80))); } catch (e) {}
    saveSprint({ topic: topic.id, mode, score: g.score, ghost: g.gs, n: res.n, ok: res.ok, tags: res.by });
    const reward = recordSprint({ topic: topic.id, mode, score: g.score, ghost: g.gs, n: res.n, ok: res.ok });
    setR({ ...res, score: g.score, gs: g.gs, reward });
  };

  const ask = () => {
    const g = G.current;
    if (g.over) return;
    const q = CM.next(topic, g.seen, g.recent);
    if (!q) return finish();              // question pool exhausted: end cleanly
    g.seen.add(q.p);
    Object.assign(g, { q, t0: Date.now(), locked: false, picked: null, gt: 3 + Math.random() * 5, gok: Math.random() < 0.85 });
    bump();
  };

  const begin = () => {
    let recent = new Set();
    try { recent = new Set(JSON.parse(localStorage.getItem('cm.recent') || '[]')); } catch (e) {}
    const ev = [];
    for (let t = 0; (t += 5 + Math.random() * 4) < SECS;) ev.push({ t, ok: Math.random() < 0.8 });
    G.current = { seen: new Set(), recent, log: [], score: 0, gs: 0, over: false, locked: true, end: Date.now() + SECS * 1000, ev };
    setR(null); ask();
  };

  const answer = i => {
    const g = G.current;
    if (!g || g.over || g.locked) return;
    g.locked = true; g.picked = i;
    const q = g.q, t = (Date.now() - g.t0) / 1000, ok = i === q.c;
    g.log.push({ q, pick: q.a[i], ok, t });
    recordAnswer('everyone', ok);
    if (mode === 'rush') { if (ok) g.score++; }
    else { const win = ok && (t < g.gt || !g.gok); if (win) g.score++; else if (g.gok) g.gs++; }
    g.adv = setTimeout(ask, ok ? 500 : 900);
    bump();
  };

  const tick = () => {
    const g = G.current;
    if (!g || g.over) return;
    const left = g.end - Date.now();
    if (mode === 'rush') g.gs = g.ev.filter(e => e.ok && e.t <= SECS - left / 1000).length;
    if (left <= 0) finish();
    bump();
  };

  useEffect(() => {
    if (!dlg.current.open) dlg.current.showModal();
    begin();
    const id = setInterval(tick, 200);
    const key = e => { const g = G.current; if (g && !g.over && /^[1-4]$/.test(e.key)) answer(+e.key - 1); };
    document.addEventListener('keydown', key);
    return () => { clearInterval(id); document.removeEventListener('keydown', key); if (G.current) clearTimeout(G.current.adv); };
  }, []);

  const g = G.current;
  const left = g ? Math.max(0, g.end - Date.now()) : SECS * 1000, s = Math.ceil(left / 1000);

  return (
    <dialog ref={dlg} className="game" translate={topic.id === 'gram' ? 'no' : undefined} onClose={onClose} aria-labelledby="gt">
      {R ? (
        <div>
          <h2 id="gt">{R.headline}</h2>
          <p className="lede">{R.pace}</p>
          <div className="rstats">
            <div><b>{R.score}</b><span>Your score</span></div>
            <div><b>{R.gs}</b><span>{topic.ghost.name}</span></div>
            <div><b>{R.n ? R.acc + '%' : '–'}</b><span>Accuracy</span></div>
            <div><b>{R.n ? R.sec + 's' : '–'}</b><span>Per question</span></div>
          </div>

          <SprintRewards reward={R.reward} host={dlg.current} />

          {R.focus.length > 0 && <>
            <h3>What to work on</h3>
            {R.focus.map(f => <div className="focus" key={f.tag}><b>{f.tag}</b><small>{f.count}</small><p>{f.tip}</p></div>)}
          </>}
          {R.n > 0 && !R.focus.length && <><h3>What to work on</h3><p className="lede">No misses this sprint. Try Quickdraw or another topic to raise the difficulty.</p></>}
          {R.solid.length > 0 && R.focus.length > 0 && <p className="lede">Solid on: {R.solid.join(', ')}.</p>}

          {R.misses.length > 0 && <>
            <h3>Your misses, explained</h3>
            {R.misses.map((m, i) => (
              <div className="miss" key={i}>
                <p className="q">{m.q.p}</p>
                <p><span className="bad">You chose: {m.pick}</span><br /><span className="good">Correct: {m.q.a[m.q.c]}</span></p>
                <p className="why">{m.q.e}</p>
              </div>
            ))}
          </>}

          <div className="actions">
            <button className="cta violet" onClick={begin}>Play again</button>
            <button className="cta" onClick={() => dlg.current.close()}>Done</button>
          </div>
        </div>
      ) : g && g.q && (
        <div>
          <div className="g-head">
            <div><h2 id="gt">{topic.name}</h2><p>{MODES[mode].name} vs {topic.ghost.name}</p></div>
            <div className={'clock' + (s <= 10 ? ' low' : '')} role="timer">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</div>
          </div>
          <div className="meter"><i style={{ width: left / SECS / 10 + '%' }} /></div>
          <div className="vs"><span>You <b>{g.score}</b></span><span>{topic.ghost.name} <b>{g.gs}</b></span></div>
          <p className="tag">Question {g.log.length + 1} · {g.q.tag}</p>
          <h3 className="q-text">{g.q.p}</h3>
          <div className="opts">
            {g.q.a.map((a, i) => {
              const cls = g.locked ? (i === g.q.c ? ' ok' : i === g.picked ? ' no' : '') : '';
              return <button key={i} className={'opt' + cls} disabled={g.locked} onClick={() => answer(i)}><kbd>{i + 1}</kbd><span>{a}</span></button>;
            })}
          </div>
          <div className="g-foot"><span>Press 1–4 to answer. Explanations come after the sprint.</span>
            <button className="link" onClick={() => dlg.current.close()}>Quit sprint</button></div>
        </div>
      )}
    </dialog>
  );
}
