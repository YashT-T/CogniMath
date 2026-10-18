import { useEffect } from 'react';
import { start, stop } from './engine.js';
import ProgressCompare from '../../components/ProgressCompare.jsx';
import './dyscalculia.css';

/* Dyscalculia section (NeuroFlow). engine.js draws the games into the elements below, found by id.
   The markup is static on purpose: React renders it once and the engine updates it. */
export default function Dyscalculia({ api }) {
  useEffect(() => { start(); api.current = { activate() {}, deactivate: stop }; }, []);
  return (
    <div id="dc-root" className="sec-dyscalculia">
      <header>
        <span className="brand" translate="no">NeuroFlow</span>
        <button className="av" id="dc-av" aria-label="Open avatar shop"><span id="dc-avE"></span><i id="dc-avB"></i></button>
        <div className="stats">
          <div className="chip" title="Streak never resets">🔥 <b id="dc-st">0</b></div>
          <div className="chip" title="Reward points">⭐ <b id="dc-pt">0</b></div>
        </div>
        <div className="hb">
          <button className="ib" id="dc-bp" aria-label="Progress">📊</button>
          <button className="ib" id="dc-bs" aria-label="Comfort settings">⚙️</button>
        </div>
        <button className="btn" id="dc-mode" aria-pressed="false"></button>
      </header>

      <main id="dc-dash">
        <ProgressCompare section="dyscalculia" />
        <section className="hero">
          <h1>Numbers, one gentle step at a time.</h1>
          <p>Pick a game, take your time, and see what to practise next. There is no timer.</p>
        </section>
        <section className="ai" id="dc-ai" aria-label="Recommendation"></section>
        <div className="grid" id="dc-grid"></div>
      </main>

      <main id="dc-stage" hidden>
        <div className="bar">
          <button className="btn" id="dc-back">← Back to menu</button>
          <h2 id="dc-gt"></h2>
          <span id="dc-lvl" className="chip"></span>
        </div>
        <div className="cra" id="dc-cra"></div>
        <p id="dc-ins" aria-live="polite"></p>
        <div className="sec" id="dc-gh" hidden></div>
        <div className="sec" id="dc-rep" hidden></div>
        <div className="area" id="dc-area"></div>
        <div className="fb" id="dc-fb" role="status" aria-live="polite"></div>
      </main>

      <main id="dc-prog" hidden></main>

      <div id="dc-modal" hidden>
        <div id="dc-mbox" role="dialog" aria-label="Avatar shop">
          <div className="bar"><h2 id="dc-mt">Avatar shop</h2><button className="btn" id="dc-mclose">Close</button></div>
          <p id="dc-mmsg">Spend points on a new avatar or badge.</p>
          <div id="dc-mbody"></div>
        </div>
      </div>
    </div>
  );
}
