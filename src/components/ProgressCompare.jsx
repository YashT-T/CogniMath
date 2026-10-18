import { useEffect, useState } from 'react';
import { compare } from '../lib/history.js';

const dayLabel = date => new Date(date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/* Progress card shown at the top of every space. Compares saved days, so you can see your improvement. */
export default function ProgressCompare({ section }) {
  const [, redraw] = useState(0);
  useEffect(() => {
    const on = e => { if (!e.detail || e.detail === section) redraw(x => x + 1); };
    addEventListener('cm:progress', on);
    return () => removeEventListener('cm:progress', on);
  }, [section]);

  const c = compare(section);
  if (!c.latest) {
    return (
      <section className="pc" aria-label="Your progress">
        <div className="pc-head">
          <div>
            <b>Your progress</b>
            <small>Answer a few questions here. Your results are saved on this device and compared from day to day.</small>
          </div>
        </div>
      </section>
    );
  }

  const trend = c.change == null ? 'flat' : c.change > 0 ? 'up' : c.change < 0 ? 'down' : 'flat';
  const headline = c.change == null
    ? `${c.latest.acc}% right today`
    : c.change === 0 ? 'Same as the day before'
    : `${c.change > 0 ? '+' : ''}${c.change} points from ${dayLabel(c.prev.date)}`;

  return (
    <section className="pc" aria-label="Your progress">
      <div className="pc-head">
        <div>
          <b>Your progress</b>
          <small>{c.totalAnswers} answers saved on this device</small>
        </div>
        <span className={'pc-delta ' + trend}>{headline}</span>
      </div>

      <div className="pc-now" aria-label={`Latest accuracy ${c.latest.acc}%`}>
        <div className="pc-track"><i style={{ width: c.latest.acc + '%' }} /></div>
        <span>{c.latest.acc}% right on {dayLabel(c.latest.date)}</span>
      </div>

      <div className="pc-compare">
        <div><small>Previous day</small><b>{c.prev ? c.prev.acc + '%' : '—'}</b></div>
        <div><small>First day</small><b>{c.first ? c.first.acc + '%' : '—'}</b></div>
        <div><small>Since the first day</small><b>{c.sinceFirst == null ? '—' : (c.sinceFirst > 0 ? '+' : '') + c.sinceFirst + ' pts'}</b></div>
      </div>

      {c.days.length > 1 && (
        <div className="pc-bars" role="img" aria-label="Accuracy for the last seven practice days">
          {c.days.map(d => (
            <div key={d.date} className="pc-col" title={`${dayLabel(d.date)}: ${d.acc}% right of ${d.n}`}>
              <div className="pc-bar"><i style={{ height: d.acc + '%' }} /></div>
              <small>{d.acc}%</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
