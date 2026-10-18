import { useEffect, useRef, useState } from 'react';
import Intro from './components/Intro.jsx';
import Everyone from './sections/everyone/Everyone.jsx';
import Dyslexia from './sections/dyslexia/Dyslexia.jsx';
import Dyscalculia from './sections/dyscalculia/Dyscalculia.jsx';
import Autism from './sections/autism/Autism.jsx';
import HowItHelps from './components/HowItHelps.jsx';
import RewardsChip from './components/RewardsChip.jsx';
import DailyCheckIn from './components/DailyCheckIn.jsx';
import RewardsHub from './components/RewardsHub.jsx';
import NotifyBell from './components/NotifyBell.jsx';
import Coach from './components/Stickman.jsx';
import { initNotify } from './lib/notify.js';
import { checkInPreview } from './lib/rewards.js';

/* One page, four practice spaces. Only the chosen space is shown; the others stay loaded but hidden,
   so each one keeps its own progress and settings. The choice is saved in the URL hash (#dyslexia) and in localStorage. */
const SECTIONS = [
  { id: 'everyone', name: 'Everyone', glyph: '🎯', color: 'var(--yellow)', blurb: 'One-minute sprints against a saved ghost run, with every miss explained.' },
  { id: 'dyslexia', name: 'Dyslexia-friendly', glyph: '📖', color: 'var(--blue)', blurb: 'Word and sound games with read-aloud, voice answers and bigger text.' },
  { id: 'dyscalculia', name: 'Dyscalculia-friendly', glyph: '🧱', color: 'var(--mint)', blurb: 'Number sense with blocks, pictures and numbers. No timer.' },
  { id: 'autism', name: 'Autism-friendly', glyph: '🌿', color: 'var(--lilac)', blurb: 'Predictable practice with a calm mode and an untimed format.' }
];
const ids = SECTIONS.map(s => s.id);

const fromUrl = () => {
  const h = location.hash.slice(1);
  if (ids.includes(h)) return h;
  try { const v = localStorage.getItem('cm.section'); if (ids.includes(v)) return v; } catch (e) {}
  return 'everyone';
};

export default function App() {
  // The intro plays every time the app opens (skipped automatically when reduced motion is on).
  const [intro, setIntro] = useState(true);
  const done = () => setIntro(false);
  const [how, setHow] = useState(false);

  // Rewards: today's check-in pops up once per day after the intro; the hub opens from the header or from anywhere via an event.
  const [daily, setDaily] = useState(false);
  const [hub, setHub] = useState(null);           // null (closed) or the open tab: 'streak' | 'wins' | 'badges' | 'shop'
  useEffect(() => {
    if (intro || !checkInPreview().due) return;
    const id = setTimeout(() => setDaily(true), 500);
    return () => clearTimeout(id);
  }, [intro]);
  useEffect(() => {
    const on = e => setHub(e.detail || 'streak');
    addEventListener('cm:open-rewards', on);
    return () => removeEventListener('cm:open-rewards', on);
  }, []);

  useEffect(() => initNotify(), []);

  const [sec, setSec] = useState(fromUrl);
  const prev = useRef(sec);
  const apis = { everyone: useRef(null), dyslexia: useRef(null), dyscalculia: useRef(null), autism: useRef(null) };
  const panel = useRef(null);

  const choose = id => {
    if (id === sec) return;
    setSec(id);
    try { localStorage.setItem('cm.section', id); } catch (e) {}
    history.replaceState(null, '', '#' + id);
  };

  // Back/forward or a pasted link with a different hash.
  useEffect(() => {
    const on = () => { const h = location.hash.slice(1); if (ids.includes(h)) setSec(h); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  // Leaving a section stops its timers, audio and dialogs; entering one applies its page-wide settings.
  useEffect(() => {
    const a = apis[prev.current].current, b = apis[sec].current;
    if (prev.current !== sec) {
      a && a.deactivate && a.deactivate();
      panel.current && panel.current.focus({ preventScroll: true });
    }
    b && b.activate && b.activate();
    prev.current = sec;
  }, [sec]);

  const cur = SECTIONS.find(s => s.id === sec);

  return (
    <>
      {intro && <Intro onDone={done} />}
      <header className="shell-top">
        <div className="shell-wrap shell-top-in">
          <div className="shell-logo" aria-hidden="true">+</div>
          <div>
            <span className="shell-brand">CogniMath</span>
            <p className="shell-tag">Playful practice, in the way that suits you.</p>
          </div>
          <div className="rw-chip-wrap"><RewardsChip onClick={() => setHub('streak')} /><NotifyBell /></div>
        </div>
      </header>

      <nav className="shell-wrap" aria-label="Choose a practice space">
        <div className="shell-head">
          <h2 className="shell-h">Choose your practice space</h2>
          <button type="button" className="shell-how" onClick={() => setHow(true)}>
            <span aria-hidden="true">✨</span> How {cur.name} helps
          </button>
        </div>
        <div className="shell-picks">
          {SECTIONS.map(s => (
            <button key={s.id} type="button" className="shell-pick" style={{ '--c': s.color }}
              aria-pressed={s.id === sec} onClick={() => choose(s.id)}>
              <span className="ico" aria-hidden="true">{s.glyph}</span>
              <b>{s.name}</b>
              <small>{s.blurb}</small>
            </button>
          ))}
        </div>
      </nav>

      <div ref={panel} tabIndex={-1} className="shell-panel" aria-label={cur.name + ' practice space'} role="region">
        <div hidden={sec !== 'everyone'}><Everyone ready={!intro} /></div>
        <div hidden={sec !== 'dyslexia'}><Dyslexia api={apis.dyslexia} /></div>
        <div hidden={sec !== 'dyscalculia'}><Dyscalculia api={apis.dyscalculia} /></div>
        <div hidden={sec !== 'autism'}><Autism api={apis.autism} /></div>
      </div>

      {['autism', 'dyslexia', 'dyscalculia'].includes(sec) && !intro && <Coach section={sec} />}
      <HowItHelps section={sec} open={how} onClose={() => setHow(false)} />
      <DailyCheckIn open={daily} onClose={() => setDaily(false)} onHub={() => { setDaily(false); setHub('streak'); }} />
      <RewardsHub tab={hub} onTab={setHub} onClose={() => setHub(null)} onCheckIn={() => { setHub(null); setDaily(true); }} />

      <p className="shell-foot shell-wrap">
        Prototype for practice. CogniMath does not diagnose anything and does not measure intelligence.
        Opponents are saved sample runs, not live players. Progress for the three support spaces is kept in this browser only.
      </p>
    </>
  );
}
