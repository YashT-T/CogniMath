/* Daily practice history for every space, saved in this browser (localStorage).
   Each answer is counted under today's date, so the app can compare days and show improvement. */
import { noteAnswer } from './rewards.js';
import { scoped } from './userScope.js';
const key = () => scoped('cm.history.v1');   // per signed-in user

const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function load() {
  try { return JSON.parse(localStorage.getItem(key())) || {}; } catch (e) { return {}; }
}
function store(h) {
  try { localStorage.setItem(key(), JSON.stringify(h)); } catch (e) {}
}

/* Call once per answered question. ok = true when the answer was right. */
export function recordAnswer(section, ok) {
  const h = load();
  const s = (h[section] ||= {});
  const day = (s[dayKey()] ||= { n: 0, ok: 0 });
  day.n += 1;
  if (ok) day.ok += 1;
  store(h);
  noteAnswer(ok);                                   // feeds the daily goal in the rewards system
  window.dispatchEvent(new CustomEvent('cm:progress', { detail: section }));
  window.dispatchEvent(new CustomEvent('cm:answer', { detail: { section, ok: !!ok } }));
}

/* One row per practice day, oldest first. */
export function getDays(section) {
  const s = load()[section] || {};
  return Object.keys(s).sort().map(date => ({
    date, n: s[date].n, ok: s[date].ok, acc: Math.round((100 * s[date].ok) / s[date].n)
  }));
}

/* Compares the latest practice day with the day before it, and with the first day ever recorded. */
export function compare(section) {
  const days = getDays(section);
  const latest = days[days.length - 1] || null;
  const prev = days.length > 1 ? days[days.length - 2] : null;
  const first = days[0] || null;
  return {
    days: days.slice(-7),
    latest,
    prev,
    first,
    change: latest && prev ? latest.acc - prev.acc : null,
    sinceFirst: latest && first && first !== latest ? latest.acc - first.acc : null,
    totalAnswers: days.reduce((a, d) => a + d.n, 0)
  };
}
