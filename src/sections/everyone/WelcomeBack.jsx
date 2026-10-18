import { useEffect, useState } from 'react';
import CM from '../../lib/questions.js';

const AWAY_DAYS = 3;   // show the reminder after this many days away

export default function WelcomeBack({ onProgress }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let last = 0;
    try { last = +localStorage.getItem('cm.last') || 0; localStorage.setItem('cm.last', Date.now()); } catch (e) {}
    const days = last ? Math.floor((Date.now() - last) / 864e5) : 0;
    if (days < AWAY_DAYS) return;
    fetch('/api/progress').then(r => r.json()).then(d => setInfo({ days, d })).catch(() => setInfo({ days }));
  }, []);

  if (!info) return null;
  const { days, d } = info;
  let acc = null, weak = null;
  if (d && d.plays) {
    const t = Object.values(d.topics);
    acc = Math.round(100 * t.reduce((a, x) => a + x.ok, 0) / Math.max(1, t.reduce((a, x) => a + x.n, 0)));
    weak = Object.entries(d.tags).filter(([, v]) => v.n >= 2 && v.m).sort((a, b) => b[1].m / b[1].n - a[1].m / a[1].n)[0];
  }

  return (
    <aside className="back" role="status">
      <div>
        <h2>Welcome back. It has been {days} days.</h2>
        {acc !== null ? (
          <>
            <p>You have played {d.plays} sprint{d.plays > 1 ? 's' : ''} with {acc}% accuracy. Your best score is {d.best}.</p>
            {weak && <p><b>Worth a refresher:</b> {weak[0]}. {CM.TIPS[weak[0]]}</p>}
          </>
        ) : <p>Your first sprint takes one minute. Pick a topic and start.</p>}
      </div>
      <div className="acts">
        <button className="cta" onClick={() => { setInfo(null); onProgress(); }}>See my progress</button>
        <button className="link" onClick={() => setInfo(null)}>Dismiss</button>
      </div>
    </aside>
  );
}
