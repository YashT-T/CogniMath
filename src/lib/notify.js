/* Notifications: progress news and "come back" nudges. Everything lands in the in-app inbox (bell) and a toast;
   if the person opts in, the same message is also sent as a browser notification while the tab is in the background.
   The weak-topic nudge comes from the API (/api/nudges). Browser alerts need CogniMath open in a tab (a closed app needs a push server). */
import { getDays } from './history.js';
import { status, GOAL } from './rewards.js';
import { userId } from './questionMemory.js';

const K = 'cm.notes.v1', SECS = ['autism', 'dyslexia', 'dyscalculia', 'everyone'];
const today = () => status().today;
const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } };
const save = s => { try { localStorage.setItem(K, JSON.stringify(s)); } catch (e) {} dispatchEvent(new CustomEvent('cm:notes')); };

export const getNotes = () => { const s = load(); return { items: s.items || [], sys: !!s.sys, hour: s.hour == null ? 18 : s.hour }; };
export const unread = () => getNotes().items.filter(n => !n.read).length;
export function markRead() { const s = load(); (s.items || []).forEach(n => { n.read = true; }); save(s); }
export function setPref(k, v) { const s = load(); s[k] = v; save(s); }

const reg = () => ('serviceWorker' in navigator ? navigator.serviceWorker.register('/sw.js').catch(() => null) : Promise.resolve(null));
export async function enableSystem() {
  if (!('Notification' in window)) return 'unsupported';
  const p = await Notification.requestPermission();
  setPref('sys', p === 'granted');
  if (p === 'granted') { await reg(); push(null, 'Alerts are on 🔔', 'We will tell you about your progress and when it is a good time to come back.'); }
  return p;
}

/* key = once-per-day guard (null always sends). Keys starting "once:" are sent only once ever. */
export function push(key, title, body) {
  const s = load(), d = today(), f = (s.fired ||= {});
  if (key) { if (key.startsWith('once:') ? f[key] : f[key] === d) return; f[key] = key.startsWith('once:') ? 1 : d; }
  const item = { id: Date.now() + Math.random(), title, body, at: Date.now(), read: false };
  s.items = [item, ...(s.items || [])].slice(0, 30);
  save(s);
  if (document.hidden) {
    if (s.sys && 'Notification' in window && Notification.permission === 'granted') {
      const opt = { body, tag: key || 'cm', icon: undefined };
      navigator.serviceWorker && navigator.serviceWorker.getRegistration().then(r => (r ? r.showNotification(title, opt) : new Notification(title, opt)));
    }
  } else dispatchEvent(new CustomEvent('cm:toast', { detail: item }));
}

const answersToday = () => SECS.reduce((n, s) => n + ((getDays(s).find(x => x.date === today()) || {}).n || 0), 0);
const answersAll = () => SECS.reduce((n, s) => n + getDays(s).reduce((a, x) => a + x.n, 0), 0);

export function check() {
  const st = status(), n = answersToday(), s = getNotes();
  if (n >= GOAL) push('goal', 'Daily goal reached 🎯', `You answered ${n} questions today. Open Rewards to collect your goal chest.`);
  [25, 50, 100, 250, 500].filter(m => answersAll() >= m).forEach(m => push('once:tot' + m, `${m} answers and counting 🌟`, 'Every answer is practice your brain keeps. Nice work.'));
  SECS.forEach(sec => {
    const d = getDays(sec), a = d[d.length - 1], b = d[d.length - 2];
    if (a && b && a.date === today() && a.n >= 5 && a.acc - b.acc >= 10) push('up-' + sec, 'You are improving 📈', `Accuracy in ${sec === 'everyone' ? 'Everyone' : sec} is up ${a.acc - b.acc} points since your last practice day.`);
  });
  if (n === 0 && st.streak > 0 && new Date().getHours() >= s.hour) push('risk', `Your ${st.streak}-day streak is waiting 🔥`, 'A few questions today keeps it going. Streak freezes in the shop can also protect it.');
  if (st.due && document.hidden) push('chest', "Today's chest is ready 🎁", 'Open CogniMath to claim your daily reward.');
  if (n > 0 && n < GOAL && document.hidden) push('nearly', `${GOAL - n} answers to today's goal`, 'You are close. One short round gets you there.');
}

/* Weak-topic nudge from the API. Silent if the server is not running. */
async function weak() {
  if (location.protocol === 'file:') return;
  try {
    const r = await fetch('/api/nudges?user=' + userId); if (!r.ok) return;
    const j = await r.json();
    if (j.weak) push('weak', 'Worth another look 🧩', `${j.weak.topic} felt tricky lately (${j.weak.acc}% right). A short, gentle round could help.`);
  } catch (e) {}
}

export function initNotify() {
  const s = load(), now = Date.now();
  if (s.sys) reg();
  if (s.visit && now - s.visit > 6 * 3600e3) {
    const n = answersToday();
    push('back', 'Welcome back 👋', n >= GOAL ? 'You already hit today’s goal. Anything more is a bonus.' : `You are ${GOAL - n} answers from today’s goal.`);
  }
  s.visit = now; save(s);
  check(); weak();
  const tick = () => { setPref('visit', Date.now()); check(); };
  const id = setInterval(tick, 60000), on = () => check(), vis = () => { check(); if (document.hidden) weak(); };
  addEventListener('cm:progress', on); document.addEventListener('visibilitychange', vis);
  return () => { clearInterval(id); removeEventListener('cm:progress', on); document.removeEventListener('visibilitychange', vis); };
}
