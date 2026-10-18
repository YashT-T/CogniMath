import { useEffect, useState } from 'react';

// [symbol, colour, drift-x, drift-y, delay (s)] – each drifts out of the CM sign
const SYMBOLS = [
  ['+', '#baf3d5', -30, -110, 1.7], ['−', '#ffc2d6', 30, -125, 1.9], ['×', '#a9d8ff', 85, -100, 2.1],
  ['÷', '#ffdc72', 125, -55, 2.3], ['+', '#ff927c', 135, 15, 2.5], ['−', '#d9d3ff', 100, 55, 2.7]
];
const HOLD = 3900, TOTAL = 4700;     // ms until the zoom starts / until the app is revealed

export default function Intro({ onDone }) {
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onDone();
    const a = setTimeout(() => setOut(true), HOLD);
    const b = setTimeout(onDone, TOTAL);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  const draw = d => ({ '--d': d + 's' });
  return (
    <div className={'intro' + (out ? ' out' : '')} role="img" aria-label="CogniMath. A stick figure holds a CM sign and maths symbols float out of it.">
      <svg viewBox="0 0 400 300" aria-hidden="true">
        <line x1="140" y1="242" x2="260" y2="242" stroke="#ffffff33" strokeWidth="3" strokeLinecap="round" />
        <g className="man">
          <circle className="stick d" pathLength="1" cx="200" cy="92" r="20" style={draw(0.1)} />
          <line className="stick d" pathLength="1" x1="200" y1="112" x2="200" y2="185" style={draw(0.35)} />
          <line className="stick d" pathLength="1" x1="200" y1="185" x2="178" y2="238" style={draw(0.6)} />
          <line className="stick d" pathLength="1" x1="200" y1="185" x2="222" y2="238" style={draw(0.7)} />
          <line className="stick d wave" pathLength="1" x1="200" y1="132" x2="160" y2="158" style={draw(0.85)} />
          <line className="stick d" pathLength="1" x1="200" y1="132" x2="246" y2="118" style={draw(0.95)} />
          <g className="sign">
            <rect x="240" y="68" width="64" height="50" rx="10" fill="#ffdc72" stroke="#fff" strokeWidth="3" />
            <text x="272" y="102" textAnchor="middle" className="cm">CM</text>
          </g>
        </g>
        {SYMBOLS.map(([s, c, x, y, d], i) => (
          <text key={i} className="sym" x="272" y="106" fill={c} style={{ '--x': x + 'px', '--y': y + 'px', '--d': d + 's' }}>{s}</text>
        ))}
      </svg>
      <h1>CogniMath</h1>
      <button className="skip" onClick={onDone}>Skip</button>
    </div>
  );
}
