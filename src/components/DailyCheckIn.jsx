import { useEffect, useRef, useState } from 'react';
import { checkInPreview, claimCheckIn, slotOf, baseCoins, MILESTONES, badgeInfo } from '../lib/rewards.js';
import { confetti, sfx } from '../lib/fx.js';
import useRewards from '../lib/useRewards.js';

function useCountUp(target, run, fx, ms = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) { setV(0); return; }
    if (!fx) { setV(target); return; }
    let raf, t0;
    const f = t => { t0 ??= t; const k = Math.min(1, (t - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [target, run, fx]);
  return v;
}

/* Today's check-in. Anticipation (a wobbling chest) -> a tap -> a variable reveal (x1, lucky x1.5, rare x3 jackpot),
   a streak number that slams in, coins counting up, and a teaser for tomorrow. */
export default function DailyCheckIn({ open, onClose, onHub }) {
  const dlg = useRef(null);
  const { fx } = useRewards();
  const [pre, setPre] = useState(null);
  const [res, setRes] = useState(null);

  useEffect(() => {
    const d = dlg.current;
    if (open) {
      const p = checkInPreview();
      if (!p.due) { onClose(); return; }
      setPre(p); setRes(null);
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [open]);

  const coins = useCountUp(res ? res.coins : 0, !!res, fx);

  const openChest = () => {
    const r = claimCheckIn();
    if (!r) return;
    setRes(r);
    (r.mult === 3 ? sfx.jackpot : sfx.open)();
    confetti(dlg.current, { count: r.mult === 3 ? 230 : r.milestone ? 170 : 110, power: r.mult === 3 ? 1.3 : 1 });
    if (r.level) setTimeout(sfx.level, 1100);
  };

  const p = res || pre;
  if (!p) return <dialog ref={dlg} className="rw" onClose={onClose} />;
  const slot = slotOf(p.streak), weekStart = p.streak - slot;
  const note = p.first ? 'Welcome! Day 1 starts your streak.'
    : p.restarted ? `Fresh start. Your best is ${p.best} days, and now you get to beat it.`
    : p.freezesUsed ? `❄️ A streak freeze covered ${p.missed} missed day${p.missed > 1 ? 's' : ''}. Your streak is safe.`
    : `Day ${p.streak} of your streak`;

  return (
    <dialog ref={dlg} className="rw rw-daily" data-fx={fx ? 'on' : 'off'} aria-labelledby="rw-dt" onClose={onClose}>
      <div className="rw-hero">
        <div className="rw-flame" aria-hidden="true">🔥</div>
        {res ? (
          <div className="rw-slam" role="status">
            <b className="rw-big">{res.streak}</b>
            <span>day streak!</span>
          </div>
        ) : (
          <div className="rw-slam"><b className="rw-big dim">{p.streak}</b><span>{p.streak === 1 ? 'day to start' : 'days if you open it'}</span></div>
        )}
        <h2 id="rw-dt" className="rw-sr-only">Daily check-in</h2>
        <p className="rw-note">{note}</p>
      </div>

      <div className="rw-in">
        <ol className="rw-ribbon" aria-label="This week of your streak">
          {Array.from({ length: 7 }, (_, i) => {
            const n = i + 1, sn = weekStart + n, ms = MILESTONES[sn];
            const st = n < slot || (res && n === slot) ? 'done' : n === slot ? 'today' : 'next';
            return (
              <li key={n} className={'rw-slot ' + st} style={{ '--d': i * 60 + 'ms' }}>
                <small>Day {sn}</small>
                <span aria-hidden="true">{st === 'done' ? '✓' : ms ? '🎁' : '🪙'}</span>
                <b>{ms ? `+${ms.coins}` : `+${baseCoins(sn)}`}</b>
                {ms && <em>bonus</em>}
              </li>
            );
          })}
        </ol>

        {!res ? (
          <div className="rw-chest-wrap">
            <button type="button" className="rw-chest" onClick={openChest} aria-label="Open today's chest">🎁</button>
            <p className="rw-chest-t">Tap to open today’s chest</p>
            <small>Every chest has coins. Some are lucky ×1.5, and a rare one is a ×3 jackpot.</small>
            <button type="button" className="rw-link" onClick={() => dlg.current.close()}>Maybe later</button>
          </div>
        ) : (
          <div className="rw-reveal">
            <div className="rw-coins rw-pop" style={{ '--d': '0ms' }}>
              <span aria-hidden="true">🪙</span>
              <b aria-label={`${res.coins} coins`}>+{coins}</b>
              {res.label && <em className={'rw-tag ' + (res.mult === 3 ? 'jp' : 'lucky')}>{res.label} ×{res.mult}!</em>}
            </div>
            {res.milestone && (
              <div className="rw-callout gold rw-pop" style={{ '--d': '350ms' }}>
                <span aria-hidden="true">{badgeInfo(res.milestone.badge).icon}</span>
                <div><b>{res.streak}-day milestone</b><small>+{res.milestone.coins} bonus coins and the “{badgeInfo(res.milestone.badge).name}” badge</small></div>
              </div>
            )}
            {res.freezeEarned && (
              <div className="rw-callout blue rw-pop" style={{ '--d': '550ms' }}>
                <span aria-hidden="true">❄️</span>
                <div><b>Streak freeze earned</b><small>It protects your streak if you miss a day.</small></div>
              </div>
            )}
            {res.level && (
              <div className="rw-callout violet rw-pop" style={{ '--d': '750ms' }}>
                <span aria-hidden="true">⭐</span>
                <div><b>Level {res.level.to}!</b><small>You moved up from level {res.level.from}.</small></div>
              </div>
            )}
            {res.badges.filter(b => b !== res.milestone?.badge).map((b, i) => (
              <div className="rw-callout gold rw-pop" style={{ '--d': 900 + i * 150 + 'ms' }} key={b}>
                <span aria-hidden="true">{badgeInfo(b).icon}</span>
                <div><b>New badge: {badgeInfo(b).name}</b><small>{badgeInfo(b).hint}</small></div>
              </div>
            ))}
            <p className="rw-tomorrow rw-pop" style={{ '--d': '1000ms' }}>
              <b>Tomorrow:</b> day {res.streak + 1} chest, at least +{res.tomorrow} 🪙, with another shot at the ×3 jackpot.
              {res.nextMilestone && <> Next milestone: day {res.nextMilestone}, {res.nextMilestone - res.streak} day{res.nextMilestone - res.streak > 1 ? 's' : ''} away.</>}
            </p>
            <div className="rw-row">
              <button type="button" className="rw-btn" onClick={() => dlg.current.close()}>Keep the streak going</button>
              <button type="button" className="rw-link" onClick={onHub}>See all rewards</button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
