import { useEffect, useRef, useState } from 'react';
import Intro from './components/Intro.jsx';
import Login from './components/Login.jsx';
import LanguagePicker from './components/LanguagePicker.jsx';
import { supabase } from './lib/supabase.js';
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
import { checkInPreview, resetRewards, EVT as REWARDS_EVT } from './lib/rewards.js';
import { setScopeUser } from './lib/userScope.js';

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

  // Accounts: only active when the Supabase environment variables are set. undefined = still checking.
  const [session, setSession] = useState(supabase ? undefined : null);
  const [guest, setGuest] = useState(() => { try { return localStorage.getItem('cm.guest') === '1'; } catch (e) { return false; } });
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).catch(() => setSession(null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const goGuest = () => { try { localStorage.setItem('cm.guest', '1'); } catch (e) {} setGuest(true); };
  const signOut = async () => { try { localStorage.removeItem('cm.guest'); } catch (e) {} setGuest(false); await supabase.auth.signOut(); };
  // The practice spaces stay mounted (just hidden) while the login page shows, so their games keep working after sign-in.
  const needLogin = !!supabase && session === null && !guest;
  const checking = !!supabase && session === undefined;
  // Streak, coins, level, history and notifications belong to whoever is signed in (guests share the plain browser slot).
  // The switch happens during render so nothing ever paints another person's numbers; the event then refreshes any open widgets.
  const uid = session && session.user ? session.user.id : null;
  if (setScopeUser(uid)) resetRewards();
  useEffect(() => { dispatchEvent(new CustomEvent(REWARDS_EVT)); }, [uid]);
  const inApp = !needLogin && !checking;   // false on the sign-in page

  // Rewards: today's check-in pops up once per day after the intro; the hub opens from the header or from anywhere via an event.
  const [daily, setDaily] = useState(false);
  const [hub, setHub] = useState(null);           // null (closed) or the open tab: 'streak' | 'wins' | 'badges' | 'shop'
  useEffect(() => {
    if (intro || !inApp || !checkInPreview().due) return;
    const id = setTimeout(() => setDaily(true), 500);
    return () => clearTimeout(id);
  }, [intro, inApp, uid]);
  useEffect(() => {
    const on = e => setHub(e.detail || 'streak');
    addEventListener('cm:open-rewards', on);
    return () => removeEventListener('cm:open-rewards', on);
  }, []);

  // Reminders and the inbox are per user, so start them only once we know who is using the app (and restart on a switch).
  useEffect(() => (inApp ? initNotify() : undefined), [inApp, uid]);

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
  }, [sec, needLogin]);

  const cur = SECTIONS.find(s => s.id === sec);

  return (
    <>
      {intro && <Intro onDone={done} />}
      <header className="shell-top">
        <div className="shell-wrap shell-top-in">
          <div className="shell-logo" aria-hidden="true">+</div>
          <div>
            <span className="shell-brand" translate="no">CogniMath</span>
            <p className="shell-tag">Playful practice, in the way that suits you.</p>
          </div>
          {inApp && <div className="rw-chip-wrap"><RewardsChip onClick={() => setHub('streak')} /><NotifyBell /></div>}
          <div className={'shell-acct' + (inApp ? '' : ' alone')}>
            <LanguagePicker />
            {supabase && inApp && (
              session
                ? <><small>{session.user.email}</small><button type="button" className="shell-pill" onClick={signOut}>Sign out</button></>
                : <button type="button" className="shell-pill" onClick={() => setGuest(false)}>Sign in</button>
            )}
          </div>
        </div>
      </header>
      <div id="google_translate_element" className="shell-gt" aria-hidden="true"></div>

      {needLogin && !intro && <Login onGuest={goGuest} />}

      <div hidden={needLogin || checking}>

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
        Opponents are saved sample runs, not live players.{' '}
        {supabase ? 'Signed-in progress is saved to your account; guest progress stays in this browser.' : 'Progress is kept in this browser.'}
      </p>
      </div>
    </>
  );
}
