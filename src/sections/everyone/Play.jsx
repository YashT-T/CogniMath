import { useRef, useState } from 'react';
import CM from '../../lib/questions.js';
import { MODES } from '../../lib/modes.js';
import Game from './Game.jsx';

export default function Play() {
  const T = CM.TOPICS;
  const [topic, setTopic] = useState(T[0]);
  const [mode, setMode] = useState('rush');
  const [matched, setMatched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const current = useRef('');
  current.current = topic.id + mode;

  const change = (t, m) => { if (t) setTopic(t); if (m) setMode(m); setMatched(false); };
  const surprise = () => change(T.filter(t => t !== topic)[Math.floor(Math.random() * (T.length - 1))]);
  const find = () => {
    if (matched) return setPlaying(true);
    const key = current.current;
    setBusy(true);
    setTimeout(() => { setBusy(false); if (key === current.current) setMatched(true); }, 900);
  };
  const g = topic.ghost;

  return (
    <>
      <section className="hero">
        <h1>One minute.<br />One ghost to beat.</h1>
        <p>Pick a topic, race a saved run from someone at your level, then get every miss explained.</p>
      </section>

      <div className="play">
        <div>
          <div className="head"><h2>Pick a topic</h2><button className="link" onClick={surprise}>Surprise me</button></div>
          <div className="tiles">
            {T.map(t => (
              <button key={t.id} className="tile" style={{ '--c': t.color }} aria-pressed={t === topic} onClick={() => change(t)}>
                <span className="ico" aria-hidden="true">{t.glyph}</span>
                <b>{t.name}</b>
                <small>{t.blurb}</small>
              </button>
            ))}
          </div>

          <h2>Pick a format</h2>
          <div className="modes">
            {Object.entries(MODES).map(([k, m]) => (
              <button key={k} className="mode" aria-pressed={k === mode} onClick={() => change(null, k)}>
                <b>{m.name}</b><small>{m.d}</small>
              </button>
            ))}
          </div>
        </div>

        <aside className="panel" aria-live="polite">
          <h2>{matched ? `Matched with ${g.name}` : `Ready for ${topic.name}?`}</h2>
          <p>{matched
            ? `No live player is waiting in this prototype, so you are racing a saved run rated ${g.rating}.`
            : 'We look for a live player first. If nobody is waiting, you race a saved run near your rating.'}</p>
          {matched && (
            <div className="opp"><span className="face" aria-hidden="true">👻</span>
              <span><b>{g.name}</b><small>Saved run · sample data</small></span>
              <span className="rate"><small>Rating</small><b>{g.rating}</b></span>
            </div>
          )}
          <button className="cta" disabled={busy} onClick={find}>
            {busy ? 'Checking for a live player…' : matched ? 'Start sprint' : 'Find my opponent'}
          </button>
        </aside>
      </div>

      {playing && <Game topic={topic} mode={mode} onClose={() => setPlaying(false)} />}
    </>
  );
}
