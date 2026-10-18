import { useEffect } from 'react';
import { TIERS, badgeInfo, claimTier } from '../lib/rewards.js';
import { confetti, sfx } from '../lib/fx.js';
import useRewards, { openRewards } from '../lib/useRewards.js';

/* Compact win-streak meter shown on the Play page. */
export function WinMeter() {
  const s = useRewards(), nx = s.nextTier;
  return (
    <div className="rw-wm">
      <div className="rw-wm-top">
        <b>🔥 Win streak: {s.wins}</b>
        {s.pending.length > 0
          ? <button type="button" className="rw-wm-claim" onClick={() => openRewards('wins')}>Claim {s.pending.length} reward{s.pending.length > 1 ? 's' : ''}</button>
          : <small>Best {s.bestWins}</small>}
      </div>
      {nx ? (
        <>
          <div className="rw-bar" aria-label={`${s.wins} of ${nx.at} wins`}><i style={{ width: (100 * s.wins) / nx.at + '%' }} /></div>
          <small>{nx.at - s.wins} more win{nx.at - s.wins > 1 ? 's' : ''} in a row for {nx.icon} {nx.name}</small>
        </>
      ) : <small>You have reached every win-streak reward. Keep going!</small>}
    </div>
  );
}

/* Shown on the sprint result screen: XP, coins, level, win-streak progress and claimable rewards. */
export default function SprintRewards({ reward: r, host }) {
  const s = useRewards();
  useEffect(() => {
    if (!r) return;
    if (r.level) sfx.level(); else if (r.ready.length || r.badges.length) sfx.claim();
    if (r.ready.length || r.level || r.badges.length) confetti(host, { count: r.level ? 140 : 90 });
  }, [r]);
  if (!r) return null;

  const claim = at => {
    const c = claimTier(at);
    if (!c) return;
    sfx.claim(); confetti(host, { count: 120 });
  };
  const uniq = [...new Set(s.pending)];

  return (
    <section className="rw-sr" aria-label="Rewards earned this sprint">
      <h3>Rewards</h3>
      <div className="rw-sr-chips">
        <span className="rw-chipx xp">+{r.xp} XP{r.boosted ? ' · 2× boost' : ''}</span>
        <span className="rw-chipx coin">+{r.coins} 🪙</span>
        {r.perfect && <span className="rw-chipx">💯 Flawless</span>}
      </div>
      <div className="rw-bar" role="progressbar" aria-valuemin={0} aria-valuemax={s.level.need} aria-valuenow={s.level.into} aria-label="XP to next level"><i style={{ width: s.level.pct + '%' }} /></div>
      <small>Level {s.level.level} · {s.level.into}/{s.level.need} XP</small>
      {r.level && <p className="rw-lvup">⭐ Level up! You are now level {r.level.to}.</p>}

      <div className="rw-sr-streak">
        {r.won && <p><b>🔥 Win streak: {r.winStreak}</b></p>}
        {r.tie && <p><b>Tie.</b> Your win streak stays at {r.winStreak}.</p>}
        {!r.won && !r.tie && (r.lost > 0
          ? <p>Your {r.lost}-win streak ended. Your best is {r.bestWins}. Win the next one to start a new streak.</p>
          : <p>Beat the ghost to start a win streak.</p>)}
        {r.next && (r.won || r.tie) && <><div className="rw-bar sm" aria-label={`${r.winStreak} of ${r.next.at}`}><i style={{ width: (100 * r.winStreak) / r.next.at + '%' }} /></div>
          <small>{r.next.at - r.winStreak} more win{r.next.at - r.winStreak > 1 ? 's' : ''} for {r.next.icon} {r.next.name}</small></>}
      </div>

      {uniq.map(at => {
        const t = TIERS.find(x => x.at === at), n = s.pending.filter(a => a === at).length;
        return (
          <div className="rw-callout gold" key={at}>
            <span aria-hidden="true">{t.icon}</span>
            <div><b>{t.name}: {t.at} wins in a row!</b><small>+{t.coins} 🪙 · +{t.xp} XP · badge</small></div>
            <button type="button" className="rw-btn sm" onClick={() => claim(at)}>Claim{n > 1 ? ` ×${n}` : ''}</button>
          </div>
        );
      })}
      {r.badges.map(b => (
        <div className="rw-callout gold" key={b}><span aria-hidden="true">{badgeInfo(b).icon}</span>
          <div><b>New badge: {badgeInfo(b).name}</b><small>{badgeInfo(b).hint}</small></div></div>
      ))}
      <button type="button" className="rw-link" onClick={() => openRewards('wins')}>See all rewards</button>
    </section>
  );
}
