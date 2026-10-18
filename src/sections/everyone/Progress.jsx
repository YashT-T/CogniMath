import { useEffect, useState } from 'react';
import CM from '../../lib/questions.js';
import { MODES } from '../../lib/modes.js';
import { getProgress } from '../../lib/progress.js';

export default function Progress({ onPlay }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    getProgress().then(setD).catch(() => setErr(true));
  }, []);

  if (err) return <section className="hero"><h1>Progress</h1><p>Can’t reach the server, so there is no progress to show yet. Start it with <code>npm run dev</code>, then reload.</p></section>;
  if (!d) return <section className="hero"><h1>Progress</h1><p>Loading…</p></section>;

  const weak = Object.entries(d.tags)
    .filter(([, v]) => v.n >= 2 && v.m > 0)
    .sort((a, b) => b[1].m / b[1].n - a[1].m / a[1].n)
    .slice(0, 4);

  return (
    <>
      <section className="hero"><h1>Your practice</h1><p>Built from your real answers, not guesses.</p></section>

      {!d.plays ? (
        <p className="empty">No sprints yet. <button className="link" onClick={onPlay}>Play one</button> and this page fills in.</p>
      ) : (
        <>
          <div className="stats">
            <div className="stat" style={{ '--c': '#ffdc72' }}><b>{d.plays}</b><span>sprints played</span></div>
            <div className="stat" style={{ '--c': '#baf3d5' }}><b>{d.minutes}</b><span>minutes practised</span></div>
            <div className="stat" style={{ '--c': '#a9d8ff' }}><b>{d.best}</b><span>best score</span></div>
          </div>

          <div className="cols">
            <section>
              <h2>Accuracy by topic</h2>
              <ul className="rows">
                {CM.TOPICS.map(t => {
                  const s = d.topics[t.id], p = s ? Math.round(100 * s.ok / s.n) : null;
                  return (
                    <li key={t.id}>
                      <span>{t.name}</span>
                      <div className="track"><i style={{ width: `${p || 0}%`, background: t.color }} /></div>
                      <b>{p === null ? '–' : `${p}%`}</b>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h2>Work on next</h2>
              {weak.length ? weak.map(([tag, v]) => (
                <div className="focus" key={tag}>
                  <b>{tag}</b><small>Missed {v.m} of {v.n}</small>
                  <p>{CM.TIPS[tag]}</p>
                </div>
              )) : <p className="empty">Nothing stands out yet. Play a few more sprints.</p>}
            </section>
          </div>

          <h2>Recent sprints</h2>
          <div className="scroll">
            <table>
              <thead><tr><th>Topic</th><th>Format</th><th>Score</th><th>Ghost</th><th>Accuracy</th></tr></thead>
              <tbody>
                {d.recent.map(s => (
                  <tr key={s.at}>
                    <td>{CM.TOPICS.find(t => t.id === s.topic)?.name || s.topic}</td>
                    <td>{MODES[s.mode]?.name}</td>
                    <td>{s.score}</td><td>{s.ghost}</td>
                    <td>{s.n ? Math.round(100 * s.ok / s.n) + '%' : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
