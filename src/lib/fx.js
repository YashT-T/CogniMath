/* Celebration effects: confetti and short chimes. Both respect the person's Celebrations / Sound settings
   (Rewards > Shop), and Celebrations start OFF for anyone whose device asks for reduced motion. */
import { get } from './rewards.js';

const COLORS = ['#ffd966', '#ff8f78', '#b6f0d2', '#a7d6ff', '#5b4ae1', '#ffc3d7'];

/* Confetti is drawn on a canvas placed INSIDE the given element. Modal dialogs sit in the browser's top layer,
   so a canvas on <body> would be hidden behind them. */
export function confetti(host, { count = 110, power = 1 } = {}) {
  if (!get().fx || !host) return;
  const cv = document.createElement('canvas');
  cv.className = 'rw-confetti';
  cv.setAttribute('aria-hidden', 'true');
  host.appendChild(cv);
  const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const ox = W / 2, oy = H * 0.42;
  const P = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, v = (4 + Math.random() * 9) * power;
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[(Math.random() * COLORS.length) | 0], round: Math.random() < 0.3 };
  });
  const t0 = performance.now();
  (function frame(t) {
    const k = t - t0;
    g.clearRect(0, 0, W, H);
    for (const p of P) {
      p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r);
      g.globalAlpha = Math.max(0, 1 - k / 2600); g.fillStyle = p.c;
      if (p.round) { g.beginPath(); g.arc(0, 0, p.s / 2, 0, 7); g.fill(); } else g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6);
      g.restore();
    }
    if (k < 2600) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}

let ctx;
function tone(f, at, dur, type = 'triangle', vol = 0.07) {
  const o = ctx.createOscillator(), a = ctx.createGain(), t = ctx.currentTime + at;
  o.type = type; o.frequency.value = f;
  a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(vol, t + 0.02); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(a).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.05);
}
function play(notes) {
  if (!get().sound) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    notes.forEach(([f, at, d, type]) => tone(f, at, d, type));
  } catch (e) {}
}
// Only call these from a click or key press so the browser allows sound.
export const sfx = {
  tap: () => play([[392, 0, 0.12]]),
  open: () => play([[330, 0, 0.1], [440, 0.08, 0.1], [554, 0.16, 0.1], [659, 0.24, 0.22], [880, 0.34, 0.35]]),
  jackpot: () => play([[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.12], [1319, 0.42, 0.5]]),
  claim: () => play([[523, 0, 0.1], [784, 0.09, 0.2]]),
  level: () => play([[392, 0, 0.12], [523, 0.12, 0.12], [659, 0.24, 0.12], [784, 0.36, 0.3]])
};
