/* CogniMath rewards: daily check-in streak, sprint win-streak claims, XP / levels, badges, coins and a small shop.
   Everything is saved in this browser (localStorage), like the other practice spaces. No accounts yet.
   Design rules: streaks are protected by freezes, a miss is never shamed, and every effect can be turned off. */
import CM from './questions.js';
import { scoped } from './userScope.js';

const BASE = 'cm.rewards.v1';
const key = () => scoped(BASE);           // one save slot per signed-in user (guests keep the plain key)
export const EVT = 'cm:rewards';
const DAY = 864e5;

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / DAY);
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };

/* ---------- catalogue ---------- */
export const GOAL = 10;                       // answers per day for the daily goal (any practice space)
export const GOAL_REWARD = { coins: 15, xp: 20 };
export const MAX_FREEZES = 2;
export const PRICES = { freeze: 60, boost: 40 };

// Daily streak milestones: reaching the day awards the bonus and the badge automatically.
export const MILESTONES = {
  3: { coins: 20, badge: 'd3' },
  7: { coins: 50, badge: 'd7' },
  14: { coins: 80, badge: 'd14' },
  30: { coins: 150, badge: 'd30' },
  60: { coins: 250, badge: 'd60' },
  100: { coins: 500, badge: 'd100' }
};

// Win-streak ladder: win this many sprints in a row, then CLAIM the reward. Repeatable.
export const TIERS = [
  { at: 3, name: 'Hat-trick', icon: '🎩', coins: 30, xp: 40, badge: 'w3' },
  { at: 5, name: 'High five', icon: '🖐️', coins: 50, xp: 70, badge: 'w5' },
  { at: 7, name: 'Lucky seven', icon: '🍀', coins: 80, xp: 100, badge: 'w7' },
  { at: 10, name: 'Perfect ten', icon: '🔟', coins: 150, xp: 160, badge: 'w10' },
  { at: 15, name: 'Unstoppable', icon: '⚡', coins: 250, xp: 250, badge: 'w15' },
  { at: 25, name: 'Legend run', icon: '🏆', coins: 500, xp: 400, badge: 'w25' }
];

export const BADGES = [
  { id: 'first', icon: '🎯', name: 'First sprint', hint: 'Finish any sprint.' },
  { id: 'win1', icon: '🥇', name: 'First win', hint: 'Beat the ghost once.' },
  { id: 'quick', icon: '⚔️', name: 'Quickdraw win', hint: 'Win a Quickdraw sprint.' },
  { id: 'perfect', icon: '💯', name: 'Flawless', hint: 'Answer 8 or more with no misses in one sprint.' },
  ...TIERS.map(t => ({ id: t.badge, icon: t.icon, name: t.name, hint: `Win ${t.at} sprints in a row, then claim it.` })),
  { id: 'd3', icon: '🔥', name: 'Warming up', hint: 'Check in 3 days in a row.' },
  { id: 'd7', icon: '🌟', name: 'Full week', hint: 'Check in 7 days in a row.' },
  { id: 'd14', icon: '💎', name: 'Fortnight', hint: 'Check in 14 days in a row.' },
  { id: 'd30', icon: '🌙', name: 'Month master', hint: 'Check in 30 days in a row.' },
  { id: 'd60', icon: '🛡️', name: 'Iron habit', hint: 'Check in 60 days in a row.' },
  { id: 'd100', icon: '👑', name: 'Centurion', hint: 'Check in 100 days in a row.' },
  { id: 'goal5', icon: '✅', name: 'Goal getter', hint: `Hit the daily goal (${GOAL} answers) on 5 different days.` },
  { id: 'ans100', icon: '🧠', name: '100 right', hint: 'Get 100 answers right, in any space.' },
  { id: 'ans500', icon: '📚', name: '500 right', hint: 'Get 500 answers right, in any space.' },
  { id: 'explorer', icon: '🧭', name: 'Explorer', hint: 'Play a sprint in every topic.' },
  { id: 'lv5', icon: '🚀', name: 'Level 5', hint: 'Reach level 5.' },
  { id: 'lv10', icon: '🌈', name: 'Level 10', hint: 'Reach level 10.' },
  { id: 'fresh', icon: '🌱', name: 'Fresh start', hint: 'Come back and start a new streak. Coming back counts.' }
];
const BADGE = Object.fromEntries(BADGES.map(b => [b.id, b]));
export const badgeInfo = id => BADGE[id];

export const PETS = [
  { e: '🙂', cost: 0, name: 'Starter' }, { e: '🦊', cost: 40, name: 'Fox' }, { e: '🐙', cost: 60, name: 'Octopus' },
  { e: '🦉', cost: 80, name: 'Owl' }, { e: '🐲', cost: 150, name: 'Dragon' }, { e: '🚀', cost: 250, name: 'Rocket' },
  { e: '👑', cost: 400, name: 'Crown' }
];

const TITLES = ['Rookie', 'Spark', 'Climber', 'Sprinter', 'Ace', 'Whiz', 'Champion', 'Legend'];

/* ---------- levels ---------- */
const need = l => 50 + 25 * (l - 1);                       // XP to go from level l to l + 1
export function levelInfo(xp) {
  let level = 1, rest = xp;
  while (rest >= need(level)) { rest -= need(level); level++; }
  return { level, into: rest, need: need(level), pct: Math.round((100 * rest) / need(level)), title: TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))] };
}

/* ---------- storage ---------- */
const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const blank = () => ({
  v: 1, xp: 0, coins: 0, freezes: 0, boost: 0,
  streak: 0, best: 0, last: null, days: [], frozen: [],
  wins: 0, bestWins: 0, pending: [], claimed: {},
  daily: { day: null, n: 0, claimed: false },
  badges: {}, totals: { sprints: 0, wins: 0, answers: 0, correct: 0, goals: 0, topics: {} },
  own: ['🙂'], pet: '🙂', fx: !reduced(), sound: true
});

let S = null;
function load() {
  const b = blank();
  try {
    const x = JSON.parse(localStorage.getItem(key()));
    if (x && typeof x === 'object') return { ...b, ...x, daily: { ...b.daily, ...x.daily }, totals: { ...b.totals, ...x.totals }, badges: { ...x.badges }, claimed: { ...x.claimed } };
  } catch (e) {}
  return b;
}
export const get = () => (S ||= load());
// Called when a different person starts using the app: forget the loaded state so the next read uses their slot.
export const resetRewards = () => { S = null; };
function save() {
  try { localStorage.setItem(key(), JSON.stringify(S)); } catch (e) {}
  dispatchEvent(new CustomEvent(EVT));
}
if (typeof addEventListener === 'function') addEventListener('storage', e => { if (e.key === key()) { S = null; dispatchEvent(new CustomEvent(EVT)); } });

/* ---------- internals ---------- */
function award(out, id) {
  const s = get();
  if (s.badges[id]) return;
  s.badges[id] = Date.now();
  out.push(id);
}
function checkBadges(out) {
  const s = get(), t = s.totals;
  if (t.sprints >= 1) award(out, 'first');
  if (t.wins >= 1) award(out, 'win1');
  if (t.goals >= 5) award(out, 'goal5');
  if (t.correct >= 100) award(out, 'ans100');
  if (t.correct >= 500) award(out, 'ans500');
  if (Object.keys(t.topics).length >= CM.TOPICS.length) award(out, 'explorer');
  const lv = levelInfo(s.xp).level;
  if (lv >= 5) award(out, 'lv5');
  if (lv >= 10) award(out, 'lv10');
}
// Adds XP and reports a level-up if there was one.
function giveXp(n) {
  const s = get(), from = levelInfo(s.xp).level;
  s.xp += n;
  const to = levelInfo(s.xp).level;
  return to > from ? { from, to } : null;
}

/* ---------- derived status ---------- */
export function status() {
  const s = get(), today = dayKey();
  const goalN = s.daily.day === today ? s.daily.n : 0;
  const goalClaimed = s.daily.day === today && s.daily.claimed;
  const due = s.last !== today;
  const goalReady = goalN >= GOAL && !goalClaimed;
  const nextTier = TIERS.find(t => t.at > s.wins) || null;
  return {
    ...s, today, due, goalN, goalClaimed, goalReady, level: levelInfo(s.xp), nextTier,
    claimable: (due ? 1 : 0) + (goalReady ? 1 : 0) + s.pending.length,
    nextMilestone: Object.keys(MILESTONES).map(Number).find(d => d > s.streak) || null
  };
}

/* ---------- daily check-in ---------- */
// What opening the chest WILL do. Reveals nothing random, so the UI can build anticipation.
export function checkInPreview() {
  const s = get(), t = dayKey();
  if (s.last === t) return { due: false };
  let streak = 1, freezesUsed = 0, restarted = false, missed = 0;
  if (s.last) {
    const gap = daysBetween(s.last, t);
    missed = Math.max(0, gap - 1);
    if (gap <= 1) streak = s.streak + 1;
    else if (missed <= s.freezes) { streak = s.streak + 1; freezesUsed = missed; }
    else { streak = 1; restarted = s.streak >= 2; }
  }
  return { due: true, streak, freezesUsed, restarted, missed, prev: s.streak, first: !s.last, best: s.best, base: baseCoins(streak) };
}
export const baseCoins = streak => 10 + Math.min(streak, 7) * 3;     // 13 on day 1, up to 31 from day 7
export const slotOf = streak => ((streak - 1) % 7) + 1;              // position in the weekly ribbon

export function claimCheckIn() {
  const p = checkInPreview();
  if (!p.due) return null;
  const s = get(), t = dayKey(), badges = [];
  // Variable reward: usually x1, sometimes lucky x1.5, rarely a x3 jackpot.
  const r = Math.random();
  const mult = r < 0.05 ? 3 : r < 0.3 ? 1.5 : 1;
  const chest = Math.round(p.base * mult);
  const ms = MILESTONES[p.streak] || null;
  const coins = chest + (ms ? ms.coins : 0);

  // Frozen days are remembered so the calendar can show them.
  if (p.freezesUsed) { for (let i = p.missed; i >= 1; i--) s.frozen.push(addDays(t, -i)); s.freezes -= p.freezesUsed; }
  s.frozen = s.frozen.slice(-30);
  s.streak = p.streak; s.best = Math.max(s.best, p.streak); s.last = t;
  s.days = [...s.days, t].slice(-60);

  let freezeEarned = false;
  if (p.streak % 7 === 0 && s.freezes < MAX_FREEZES) { s.freezes++; freezeEarned = true; }
  s.coins += coins;
  const level = giveXp(15 + Math.min(p.streak, 10));
  if (ms) award(badges, ms.badge);
  if (p.restarted) award(badges, 'fresh');
  checkBadges(badges);
  save();
  return { ...p, mult, label: mult === 3 ? 'Jackpot' : mult === 1.5 ? 'Lucky' : '', chest, milestone: ms, coins, freezeEarned, level, badges,
    tomorrow: baseCoins(p.streak + 1), nextMilestone: Object.keys(MILESTONES).map(Number).find(d => d > p.streak) || null };
}

/* ---------- daily goal (counts answers in every space) ---------- */
export function noteAnswer(ok) {
  const s = get(), t = dayKey();
  if (s.daily.day !== t) s.daily = { day: t, n: 0, claimed: false };
  s.daily.n++; s.totals.answers++;
  if (ok) s.totals.correct++;
  const out = []; checkBadges(out);
  save();
}
export function claimGoal() {
  const s = get(), st = status(), badges = [];
  if (!st.goalReady) return null;
  s.daily.claimed = true; s.coins += GOAL_REWARD.coins; s.totals.goals++;
  const level = giveXp(GOAL_REWARD.xp);
  checkBadges(badges); save();
  return { coins: GOAL_REWARD.coins, xp: GOAL_REWARD.xp, level, badges };
}

/* ---------- sprints ---------- */
export function recordSprint({ topic, mode, score, ghost, n, ok }) {
  if (!n) return null;                                            // nothing answered: no reward, no penalty
  const s = get(), badges = [];
  const won = score > ghost, tie = score === ghost;
  const before = s.wins, perfect = n >= 8 && ok === n, acc = ok / n;
  s.totals.sprints++; s.totals.topics[topic] = (s.totals.topics[topic] || 0) + 1;
  const ready = [];
  if (won) {
    s.totals.wins++; s.wins++; s.bestWins = Math.max(s.bestWins, s.wins);
    if (TIERS.some(t => t.at === s.wins)) { s.pending.push(s.wins); ready.push(s.wins); }
    if (mode === 'draw') award(badges, 'quick');
  } else if (!tie) s.wins = 0;                                    // a tie neither adds to nor breaks the streak
  if (perfect) award(badges, 'perfect');

  let xp = ok * 2 + (won ? 15 : tie ? 5 : 0) + (acc >= 0.85 && n >= 5 ? 10 : 0) + (perfect ? 10 : 0);
  const boosted = s.boost > 0;
  if (boosted) { xp *= 2; s.boost--; }
  const coins = (won ? 10 : tie ? 5 : 3) + (perfect ? 5 : 0);
  s.coins += coins;
  const level = giveXp(xp);
  checkBadges(badges); save();
  return { won, tie, xp, coins, boosted, perfect, winStreak: s.wins, lost: !won && !tie ? before : 0, bestWins: s.bestWins, ready, level, badges,
    next: TIERS.find(t => t.at > s.wins) || null };
}

export function claimTier(at) {
  const s = get(), i = s.pending.indexOf(at), t = TIERS.find(x => x.at === at);
  if (i < 0 || !t) return null;
  s.pending.splice(i, 1);
  s.claimed[at] = (s.claimed[at] || 0) + 1;
  s.coins += t.coins;
  const badges = [], first = !s.badges[t.badge];
  award(badges, t.badge);
  const level = giveXp(t.xp);
  checkBadges(badges); save();
  return { tier: t, first, level, badges };
}

/* ---------- shop & settings ---------- */
export function buy(item, pet) {
  const s = get();
  const pay = c => { if (s.coins < c) return { ok: false, reason: `You need ${c - s.coins} more coins.` }; s.coins -= c; return null; };
  let miss;
  if (item === 'freeze') {
    if (s.freezes >= MAX_FREEZES) return { ok: false, reason: `You can hold ${MAX_FREEZES} freezes at a time.` };
    if ((miss = pay(PRICES.freeze))) return miss;
    s.freezes++;
  } else if (item === 'boost') {
    if (s.boost >= 3) return { ok: false, reason: 'You already have 3 boosts ready.' };
    if ((miss = pay(PRICES.boost))) return miss;
    s.boost++;
  } else if (item === 'pet') {
    const p = PETS.find(x => x.e === pet);
    if (!p) return { ok: false, reason: 'Unknown companion.' };
    if (!s.own.includes(p.e)) { if ((miss = pay(p.cost))) return miss; s.own.push(p.e); }
    s.pet = p.e;
  }
  save();
  return { ok: true };
}
export function setting(k, v) { get()[k] = v; save(); }
