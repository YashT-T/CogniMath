import { useEffect, useReducer, useRef, useState } from 'react';
import { enableSystem, getNotes, markRead, push, setPref, unread } from '../lib/notify.js';

const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };

export default function NotifyBell() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [msg, setMsg] = useState('');
  const [, bump] = useReducer(x => x + 1, 0);
  const tm = useRef(0);
  useEffect(() => {
    const t = e => { setToast(e.detail); clearTimeout(tm.current); tm.current = setTimeout(() => setToast(null), 7000); };
    addEventListener('cm:notes', bump); addEventListener('cm:toast', t);
    return () => { removeEventListener('cm:notes', bump); removeEventListener('cm:toast', t); };
  }, []);
  const { items, sys, hour } = getNotes(), n = unread();
  const on = async () => { const p = await enableSystem(); setMsg(p === 'granted' ? '' : p === 'unsupported' ? 'This browser does not support notifications.' : 'Alerts are blocked. You can allow them in your browser site settings.'); };
  return (
    <div className="nb">
      <button type="button" className="nb-btn" aria-label={`Notifications${n ? `, ${n} new` : ''}`} aria-expanded={open}
        onClick={() => { setOpen(o => !o); if (!open) markRead(); }}>
        <span aria-hidden="true">🔔</span>{n > 0 && <i className="nb-dot">{n}</i>}
      </button>
      {open && (
        <div className="nb-panel" role="dialog" aria-label="Notifications">
          <h3>Your updates</h3>
          <ul>{items.length ? items.slice(0, 8).map(i => (
            <li key={i.id}><b>{i.title}</b><span>{i.body}</span><small>{ago(i.at)}</small></li>
          )) : <li><span>Nothing yet. Answer a few questions and your progress news shows up here.</span></li>}</ul>
          <div className="nb-set">
            {!sys && <button type="button" className="nb-act" onClick={on}>Turn on browser alerts</button>}
            {sys && <label>Remind me to practise after <select value={hour} onChange={e => setPref('hour', +e.target.value)}>{[9, 12, 15, 17, 18, 19, 20, 21].map(h => <option key={h} value={h}>{h}:00</option>)}</select></label>}
            <button type="button" className="nb-act ghost" onClick={() => push(null, 'Test nudge 🌟', 'This is how a progress update looks.')}>Send a test</button>
            {msg && <small role="status">{msg}</small>}
            <small>Alerts arrive while CogniMath is open in a tab, even in the background.</small>
          </div>
        </div>
      )}
      {toast && <div className="nb-toast" role="status"><b>{toast.title}</b> {toast.body}<button type="button" aria-label="Dismiss" onClick={() => setToast(null)}>×</button></div>}
    </div>
  );
}
