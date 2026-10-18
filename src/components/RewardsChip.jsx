import useRewards from '../lib/useRewards.js';

/* Header button: companion, streak, coins and level. A red dot counts rewards waiting to be claimed. */
export default function RewardsChip({ onClick }) {
  const s = useRewards();
  const label = `Rewards. ${s.streak} day streak, ${s.coins} coins, level ${s.level.level}.` +
    (s.claimable ? ` ${s.claimable} reward${s.claimable > 1 ? 's' : ''} ready to claim.` : '');
  return (
    <button type="button" className={'rw-chip' + (s.claimable ? ' ready' : '')} onClick={onClick} aria-label={label}>
      <span className="rw-chip-pet" aria-hidden="true">{s.pet}</span>
      <span className={'rw-chip-fl' + (s.due ? ' off' : '')} aria-hidden="true">🔥 <b>{s.streak}</b></span>
      <span aria-hidden="true">🪙 <b>{s.coins}</b></span>
      <span className="rw-chip-lv" aria-hidden="true">Lv {s.level.level}</span>
      {s.claimable > 0 && <i className="rw-dot" aria-hidden="true">{s.claimable}</i>}
    </button>
  );
}
