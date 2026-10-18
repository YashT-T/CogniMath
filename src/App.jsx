import { useEffect, useRef, useState } from 'react';
import Intro from './components/Intro.jsx';
import Login from './components/Login.jsx';
import { supabase } from './lib/supabase.js';
import Everyone from './sections/everyone/Everyone.jsx';
import Dyslexia from './sections/dyslexia/Dyslexia.jsx';
import Dyscalculia from './sections/dyscalculia/Dyscalculia.jsx';
import Autism from './sections/autism/Autism.jsx';

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
  // The intro plays once per browser tab session.
  const [intro, setIntro] = useState(() => { try { return !sessionStorage.getItem('cm.intro'); } catch (e) { return false; } });
  const done = () => { try { sessionStorage.setItem('cm.intro', '1'); } catch (e) {} setIntro(false); };

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
      <header className="shell-bar shell-wrap">
        <span className="shell-brand">CogniMath</span>
        <p className="shell-tag">Playful practice, in the way that suits you.</p>
        {supabase && !needLogin && !checking && (
          <div className="shell-acct">
            {session
              ? <><small>{session.user.email}</small><button type="button" className="shell-pill" onClick={signOut}>Sign out</button></>
              : <button type="button" className="shell-pill" onClick={() => setGuest(false)}>Sign in</button>}
          </div>
        )}
      </header>

      {needLogin && !intro && <Login onGuest={goGuest} />}

      <div hidden={needLogin || checking}>

      <nav className="shell-wrap" aria-label="Choose a practice space">
        <h2 className="shell-h">Choose your practice space</h2>
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

      <p className="shell-foot shell-wrap">
        Prototype for practice. CogniMath does not diagnose anything and does not measure intelligence.
        Opponents are saved sample runs, not live players.{' '}
        {supabase ? 'Signed-in progress is saved to your account; guest progress stays in this browser.' : 'Progress is kept in this browser.'}
      </p>
      </div>
    </>
  );
}
