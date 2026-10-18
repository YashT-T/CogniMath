import { useEffect, useRef, useState } from 'react';
import { BADGES, GOAL, MAX_FREEZES, MILESTONES, PETS, PRICES, TIERS, addDays, buy, claimGoal, claimTier, setting } from '../lib/rewards.js';
import { confetti, sfx } from '../lib/fx.js';
import useRewards from '../lib/useRewards.js';

const TABS = [['streak', '🔥 Streak'], ['wins', '🏆 Wins'], ['badges', '🎖️ Badges'], ['shop', '🛍️ Shop']];

/* Rewards hub: daily streak calendar, win-streak ladder (claim rewards), badges and the coin shop. */
export default function RewardsHub({ tab, onTab, onClose, onCheckIn }) {
  const dlg = useRef(null);
  const s = useRewards();
  const [note, setNote] = useState('');

  useEffect(() => {
    const d = dlg.current;
    if (tab && !d.open) { setNote(''); d.showModal(); }
    else if (!tab && d.open) d.close();
  }, [tab]);

  const celebrate = (r, text, big) => {
    setNote(text + (r.level ? ` Level up: ${r.level.to}!` : ''));
    (r.level ? sfx.level : sfx.claim)();
    confetti(dlg.current, { count: big ? 140 : 70 });
  };
  const doTier = at => { const r = claimTier(at); if (r) celebrate(r, `Claimed ${r.tier.name}: +${r.tier.coins} 🪙 +${r.tier.xp} XP${r.first ? ' and a new badge!' : '.'}`, true); };
  const doGoal = () => { const r = claimGoal(); if (r) celebrate(r, `Daily goal done: +${r.coins} 🪙 +${r.xp} XP.`); };
  const doBuy = (item, pet) => {
    const r = buy(item, pet);
    if (r.ok) { sfx.claim(); setNote(item === 'freeze' ? 'Streak freeze added.' : item === 'boost' ? '2× XP boost ready for your next sprint.' : 'Companion set.'); }
    else setNote(r.reason);
  };

  const L = s.level;
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(s.today, i - 13));
  const pendingBy = TIERS.map(t => s.pending.filter(a => a === t.at).length);

  return (
    <dialog ref={dlg} className="rw rw-hub" data-fx={s.fx ? 'on' : 'off'} aria-labelledby="rw-ht" onClose={onClose}>
      <div className="rw-in">
        <div className="rw-hub-top">
          <span className="rw-pet" aria-hidden="true">{s.pet}</span>
          <div className="rw-hub-id">
            <h2 id="rw-ht">Level {L.level} · {L.title}</h2>
            <div className="rw-bar" role="progressbar" aria-valuemin={0} aria-valuemax={L.need} aria-valuenow={L.into} aria-label="XP to next level"><i style={{ width: L.pct + '%' }} /></div>
            <small>{L.into} / {L.need} XP to level {L.level + 1}</small>
          </div>
          <div className="rw-purse" aria-label={`${s.coins} coins`}>🪙 <b>{s.coins}</b></div>
          <button type="button" className="rw-x" onClick={() => dlg.current.close()} aria-label="Close rewards">✕</button>
        </div>

        <div className="rw-tabs" role="tablist" aria-label="Rewards sections">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setNote(''); onTab(id); }}>{label}</button>
          ))}
        </div>

        <p className="rw-live" role="status" aria-live="polite">{note}</p>

        {tab === 'streak' && (
          <section aria-label="Daily streak">
            <div className="rw-card rw-streak">
              <div className="rw-streak-n"><span aria-hidden="true" className={s.due ? 'off' : ''}>🔥</span><b>{s.streak}</b><small>day streak</small></div>
              <div className="rw-streak-meta">
                <span>Best <b>{s.best}</b></span>
                <span>❄️ Freezes <b>{s.freezes}/{MAX_FREEZES}</b></span>
              </div>
              {s.due
                ? <button type="button" className="rw-btn" onClick={onCheckIn}>🎁 Open today’s chest</button>
                : <p className="rw-done">✓ Checked in today. Come back tomorrow to keep it going.</p>}
            </div>

            <h3 className="rw-h">Last 14 days</h3>
            <ol className="rw-cal" aria-label="Check-ins in the last 14 days">
              {last14.map(k => {
                const st = s.days.includes(k) ? 'done' : s.frozen.includes(k) ? 'frozen' : k === s.today ? 'today' : 'miss';
                const lab = { done: 'checked in', frozen: 'protected by a freeze', today: 'today', miss: 'no check-in' }[st];
                return <li key={k} className={st} aria-label={`${k}: ${lab}`}><small>{Number(k.slice(8))}</small><span aria-hidden="true">{st === 'done' ? '🔥' : st === 'frozen' ? '❄️' : ''}</span></li>;
              })}
            </ol>

            <h3 className="rw-h">Streak milestones</h3>
            <ul className="rw-ms">
              {Object.entries(MILESTONES).map(([d, m]) => {
                const day = +d, got = s.streak >= day, next = !got && s.nextMilestone === day;
                return (
                  <li key={d} className={got ? 'got' : next ? 'next' : ''}>
                    <span aria-hidden="true">{got ? '✅' : next ? '🎯' : '🔒'}</span>
                    <b>Day {d}</b>
                    <small>+{m.coins} 🪙 and a badge{next ? ` · ${day - s.streak} to go` : ''}</small>
                  </li>
                );
              })}
            </ul>
            <p className="rw-fine">Earn a ❄️ freeze every 7 days. A freeze quietly covers a missed day so your streak survives. If it does end, you just start a new one. Your best stays.</p>

            <h3 className="rw-h">Daily goal</h3>
            <div className={'rw-card rw-goal' + (s.goalReady ? ' is-ready' : '')}>
              <div><b>Answer {GOAL} questions today</b><small>Any practice space counts. Reward: +15 🪙 +20 XP.</small></div>
              <div className="rw-bar" aria-label={`${Math.min(s.goalN, GOAL)} of ${GOAL} answered`}><i style={{ width: Math.min(100, (100 * s.goalN) / GOAL) + '%' }} /></div>
              {s.goalClaimed ? <p className="rw-done">✓ Claimed today</p>
                : s.goalReady ? <button type="button" className="rw-btn" onClick={doGoal}>Claim reward</button>
                : <small>{s.goalN} / {GOAL}</small>}
            </div>
          </section>
        )}

        {tab === 'wins' && (
          <section aria-label="Win streak rewards">
            <div className="rw-card rw-streak">
              <div className="rw-streak-n"><span aria-hidden="true">🏅</span><b>{s.wins}</b><small>sprints won in a row</small></div>
              <div className="rw-streak-meta"><span>Best <b>{s.bestWins}</b></span><span>Total wins <b>{s.totals.wins}</b></span></div>
            </div>
            <p className="rw-fine">Beat the ghost in back-to-back sprints, then claim each reward. A loss starts the count again, a tie keeps it, and a sprint you quit does not count. You can earn every reward again and again.</p>
            <ul className="rw-tiers">
              {TIERS.map((t, i) => {
                const ready = pendingBy[i], reached = s.wins >= t.at, n = s.claimed[t.at] || 0;
                return (
                  <li key={t.at} className={'rw-tier' + (ready ? ' is-ready' : reached ? ' is-done' : '')}>
                    <span className="rw-tier-ico" aria-hidden="true">{t.icon}</span>
                    <div className="rw-tier-body">
                      <b>Win {t.at} in a row · {t.name}</b>
                      <small>+{t.coins} 🪙 · +{t.xp} XP · badge{n ? ` · claimed ×${n}` : ''}</small>
                      {!ready && !reached && <div className="rw-bar sm" aria-label={`${s.wins} of ${t.at}`}><i style={{ width: (100 * s.wins) / t.at + '%' }} /></div>}
                    </div>
                    {ready ? <button type="button" className="rw-btn sm" onClick={() => doTier(t.at)}>Claim{ready > 1 ? ` ×${ready}` : ''}</button>
                      : reached ? <span className="rw-chk" aria-label="Reached">✓</span>
                      : <small className="rw-left">{t.at - s.wins} to go</small>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === 'badges' && (
          <section aria-label="Badges">
            <p className="rw-fine"><b>{Object.keys(s.badges).length} of {BADGES.length}</b> badges earned.</p>
            <ul className="rw-badges">
              {BADGES.map(b => {
                const got = !!s.badges[b.id];
                return (
                  <li key={b.id} className={got ? 'got' : ''}>
                    <span className="rw-b-ico" aria-hidden="true">{got ? b.icon : '🔒'}</span>
                    <b>{b.name}</b>
                    <small>{got ? 'Earned' : b.hint}</small>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === 'shop' && (
          <section aria-label="Shop">
            <ul className="rw-shop">
              <li>
                <span aria-hidden="true">❄️</span>
                <div><b>Streak freeze</b><small>Covers one missed day. You hold {s.freezes} of {MAX_FREEZES}.</small></div>
                <button type="button" className="rw-btn sm" disabled={s.freezes >= MAX_FREEZES || s.coins < PRICES.freeze} onClick={() => doBuy('freeze')}>🪙 {PRICES.freeze}</button>
              </li>
              <li>
                <span aria-hidden="true">⚡</span>
                <div><b>2× XP boost</b><small>Doubles XP from your next sprint. You have {s.boost}.</small></div>
                <button type="button" className="rw-btn sm" disabled={s.boost >= 3 || s.coins < PRICES.boost} onClick={() => doBuy('boost')}>🪙 {PRICES.boost}</button>
              </li>
            </ul>
            <h3 className="rw-h">Companions</h3>
            <ul className="rw-pets">
              {PETS.map(p => {
                const own = s.own.includes(p.e), on = s.pet === p.e;
                return (
                  <li key={p.e}>
                    <button type="button" aria-pressed={on} disabled={!own && s.coins < p.cost} onClick={() => doBuy('pet', p.e)}>
                      <span aria-hidden="true">{p.e}</span>
                      <b>{p.name}</b>
                      <small>{on ? 'Selected' : own ? 'Owned' : `🪙 ${p.cost}`}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
            <h3 className="rw-h">Comfort</h3>
            <div className="rw-toggles">
              <label><input type="checkbox" checked={s.fx} onChange={e => setting('fx', e.target.checked)} /> Celebrations (confetti and animations)</label>
              <label><input type="checkbox" checked={s.sound} onChange={e => setting('sound', e.target.checked)} /> Reward sounds</label>
            </div>
          </section>
        )}
      </div>
    </dialog>
  );
}
