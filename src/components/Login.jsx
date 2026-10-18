import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

/* Sign in / create account page. Guests can skip it; their progress then stays in this browser. */
export default function Login({ onGuest }) {
  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', bad: false });

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setMsg({ text: '', bad: false });
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMsg({ text: /fetch|network/i.test(error.message) ? 'Could not reach the sign-in service. Check your connection and try again.' : error.message.includes('Invalid login') ? 'That email and password do not match. Check them, or create an account.' : error.message, bad: true });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) setMsg({ text: error.message, bad: true });
        else if (!data.session) setMsg({ text: 'Account created. Check your email for a confirmation link, then sign in.', bad: false });
      }
    } catch (err) {
      setMsg({ text: 'Could not reach the sign-in service. Check your connection and try again.', bad: true });
    }
    setBusy(false);
  };

  return (
    <main className="shell-wrap auth">
      <h1 className="auth-h">{mode === 'in' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="auth-p">Sign in to keep your progress on every device. No account needed to play: you can continue as a guest.</p>

      <div className="auth-card">
        <div className="auth-tabs" role="group" aria-label="Sign in or create account">
          <button type="button" className="shell-pill" aria-pressed={mode === 'in'} onClick={() => { setMode('in'); setMsg({ text: '', bad: false }); }}>Sign in</button>
          <button type="button" className="shell-pill" aria-pressed={mode === 'up'} onClick={() => { setMode('up'); setMsg({ text: '', bad: false }); }}>Create account</button>
        </div>

        <form onSubmit={submit}>
          <label className="auth-label" htmlFor="auth-email">Email</label>
          <input id="auth-email" className="auth-input" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label className="auth-label" htmlFor="auth-pw">Password</label>
          <input id="auth-pw" className="auth-input" type="password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />
          <small className="auth-hint">{mode === 'up' ? 'At least 6 characters.' : ' '}</small>
          <div role="status" className={'auth-msg' + (msg.bad ? ' bad' : '')}>{msg.text}</div>
          <button type="submit" className="shell-cta" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
        </form>
      </div>

      <button type="button" className="shell-link" onClick={onGuest}>Continue without an account</button>
    </main>
  );
}
