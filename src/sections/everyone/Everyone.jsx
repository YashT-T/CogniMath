import { useState } from 'react';
import Play from './Play.jsx';
import Progress from './Progress.jsx';
import WelcomeBack from './WelcomeBack.jsx';
import './everyone.css';

/* Everyone section: the original CogniMath one-minute sprints against a saved ghost run, plus the Progress view.
   The old router routes ("/" and "/progress") are now a Play / Progress switch inside this section. */
export default function Everyone({ ready }) {
  const [view, setView] = useState('play');
  return (
    <div id="ev-root" className="sec-everyone">
      <div className="wrap">
        <header className="bar">
          <nav aria-label="Everyone section pages">
            <button type="button" aria-current={view === 'play' ? 'page' : undefined} onClick={() => setView('play')}>Play</button>
            <button type="button" aria-current={view === 'progress' ? 'page' : undefined} onClick={() => setView('progress')}>Progress</button>
          </nav>
        </header>
        {ready && <WelcomeBack onProgress={() => setView('progress')} />}
        {view === 'play' ? <Play /> : <Progress onPlay={() => setView('play')} />}
      </div>
    </div>
  );
}
