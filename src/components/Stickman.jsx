import { useEffect, useRef, useState } from 'react';
import { isLow, onStim } from '../lib/stim.js';

/* Stickman coach for the Autism, Dyslexia and Dyscalculia spaces. It listens for "cm:answer" (sent by recordAnswer)
   and answers with a pose, an emoji and a short line written for that space. Low stimulant = still pose, no animation. */
const POSE = {              // arms [lx,ly,rx,ry], legs [lx,rx], mouth path
  calm:  { a: [16, 54, 44, 54], l: [22, 38], m: 'M25 23 Q30 27 35 23' },
  wave:  { a: [16, 54, 46, 30], l: [22, 38], m: 'M24 22 Q30 30 36 22' },
  cheer: { a: [12, 30, 48, 30], l: [18, 42], m: 'M23 22 Q30 32 37 22' },
  proud: { a: [14, 58, 46, 58], l: [24, 36], m: 'M24 22 Q30 29 36 22' },
  think: { a: [16, 54, 34, 38], l: [24, 36], m: 'M26 26 Q30 24 34 26' }
};
const LINES = {
  autism: {
    hi: ['Hi! Nothing here is timed or surprising.', 'Welcome. We go at your pace.'],
    ok: ['Steady and calm. That was right.', 'Good one. Same pace, no rush.', 'Correct. You are doing this your way.'],
    no: ['That is okay. Mistakes are information.', 'No problem. Breathe, then we continue.']
  },
  dyslexia: {
    hi: ['Hi! Ready to play with words?', 'Hello! Big letters, no rush.'],
    ok: ['Great reading!', 'Letters and sounds, nailed.', 'Your brain is building new word paths.'],
    no: ['Tricky one. Words trip everybody sometimes.', 'Close! Reading grows with practice.']
  },
  dyscalculia: {
    hi: ['Hi! No timer. One step at a time.', 'Hello! Numbers are friendlier in small steps.'],
    ok: ['Numbers are on your side!', 'Nice number sense!', 'You spotted that pattern.'],
    no: ['Hard one. Let us look at it another way.', 'Mistakes grow your number sense.']
  }
};
const EMO = { ok: ['⭐', '🎉', '💪', '🌟', '👏'], no: ['💙', '🌱', '🤝'], hi: ['👋', '😊'] };
const pick = a => a[Math.floor(Math.random() * a.length)];

export default function Coach({ section }) {
  const L = LINES[section];
  const [low, setLow] = useState(isLow);
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem('cm.coach') === 'off'; } catch (e) { return false; } });
  const [s, setS] = useState({ mood: 'wave', msg: pick(L.hi), emo: pick(EMO.hi), n: 0 });
  const run = useRef({});

  useEffect(() => onStim(setLow), []);
  useEffect(() => { const x = LINES[section]; setS(p => ({ mood: 'wave', msg: pick(x.hi), emo: pick(EMO.hi), n: p.n + 1 })); }, [section]);
  useEffect(() => {
    const on = e => {
      const { section: sec, ok } = e.detail || {};
      if (sec !== section) return;
      const r = (run.current[sec] = ok ? (run.current[sec] || 0) + 1 : 0);
      if (!ok) return setS(p => ({ mood: 'think', msg: pick(L.no), emo: pick(EMO.no), n: p.n + 1 }));
      const big = r > 0 && (r === 3 || r % 5 === 0);
      setS(p => ({ mood: big ? 'cheer' : 'proud', msg: big ? r + ' in a row! Your streak is growing.' : pick(L.ok), emo: big ? '🏆' : pick(EMO.ok), n: p.n + 1 }));
    };
    addEventListener('cm:answer', on);
    return () => removeEventListener('cm:answer', on);
  }, [section]);

  const toggle = () => { const v = !hidden; setHidden(v); try { localStorage.setItem('cm.coach', v ? 'off' : 'on'); } catch (e) {} };
  if (hidden) return <button type="button" className="coach-show" onClick={toggle} aria-label="Show stickman coach">🧍</button>;
  const p = POSE[s.mood], sw = 3.2;
  return (
    <aside className={'coach c-' + section + (low ? ' still' : '')} aria-label="Stickman coach">
      <div className="coach-bubble" role="status" aria-live="polite" key={s.n}><span aria-hidden="true">{s.emo}</span> {s.msg}</div>
      <button type="button" className="coach-fig" onClick={() => setS(x => ({ mood: 'cheer', msg: pick(L.ok), emo: pick(EMO.ok), n: x.n + 1 }))} aria-label="Cheer me on">
        <svg viewBox="0 0 60 100" width="64" height="100" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" aria-hidden="true" className={'fig m-' + s.mood}>
          <circle cx="30" cy="18" r="11" fill="var(--coach-face, #fff7d6)" />
          <circle cx="26" cy="16" r="1.4" fill="currentColor" stroke="none" /><circle cx="34" cy="16" r="1.4" fill="currentColor" stroke="none" />
          <path d={p.m} strokeWidth="1.8" />
          <path d="M30 29 V64" /><path className="arms" d={`M30 38 L${p.a[0]} ${p.a[1]} M30 38 L${p.a[2]} ${p.a[3]}`} />
          <path d={`M30 64 L${p.l[0]} 94 M30 64 L${p.l[1]} 94`} />
        </svg>
      </button>
      <button type="button" className="coach-hide" onClick={toggle} aria-label="Hide stickman coach">×</button>
    </aside>
  );
}
