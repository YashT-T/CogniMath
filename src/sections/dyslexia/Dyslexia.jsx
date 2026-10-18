import { useEffect } from 'react';
import mountDyslexia from './mountDyslexia.js';
import ProgressCompare from '../../components/ProgressCompare.jsx';
import './dyslexia.css';

/* Dyslexia section (WordSpark). The games are drawn by mountDyslexia.js into the elements below, found by id.
   The markup is static on purpose: React renders it once and the game code updates it. */
export default function Dyslexia({ api }) {
  useEffect(() => { api.current = mountDyslexia(); }, []);
  return (
    <div id="dy-root" className="sec-dyslexia">
      <div className="wrap">
        <header className="bar">
          <span className="brand" translate="no">WordSpark</span>
          <div className="row" role="group" aria-label="Reading settings">
            <button type="button" className="pill" id="dy-sizeBtn">Text size: Normal</button>
            <button type="button" className="pill" id="dy-speedBtn">Voice speed: Normal</button>
            <button type="button" className="pill" id="dy-speakBtn" aria-pressed="true">Read questions aloud: On</button>
            <button type="button" className="pill" id="dy-calmBtn" aria-pressed="false">Reduce motion: Off</button>
          </div>
        </header>

        <ProgressCompare section="dyslexia" />

        <section className="back" role="status" aria-live="polite">
          <div>
            <h2>Your next practice</h2>
            <p id="dy-suggestCopy"></p>
          </div>
          <button type="button" className="cta violet" id="dy-suggestBtn">Play suggested game</button>
        </section>

        <section className="hero" id="dy-play">
          <h1>Practise words and sounds at your own pace</h1>
          <p>Pick a game. Each round has five short tasks and there is no clock. A wrong answer just shows you the right one. WordSpark is practice, not a diagnosis.</p>
        </section>

        <section className="stats-row" aria-label="Practice summary">
          <div className="stat" style={{ '--c': 'var(--mint)' }}><b id="dy-statRounds">0</b><span>Rounds finished</span></div>
          <div className="stat" style={{ '--c': 'var(--yellow)' }}><b id="dy-statAcc">100%</b><span>Answers right</span></div>
          <div className="stat" style={{ '--c': 'var(--blue)' }}><b id="dy-statStars">0</b><span>Stars earned</span></div>
        </section>

        <div className="play-layout">
          <div>
            <h2>1. Choose a game</h2>
            <div className="tiles-grid" id="dy-gamesGrid"></div>
          </div>

          <aside className="panel" aria-labelledby="dy-panelName">
            <h2 id="dy-panelName"></h2>
            <p id="dy-panelBlurb"></p>
            <small id="dy-panelLast"></small>
            <p className="voice-note" id="dy-voiceNote"></p>
            <button type="button" className="cta" id="dy-startBtn" style={{ width: '100%' }}>Start round</button>
          </aside>
        </div>

        <section id="dy-stage" className="stage" hidden aria-labelledby="dy-stageTitle">
          <div className="stage-top">
            <div>
              <h2 id="dy-stageTitle" tabIndex={-1}></h2>
              <small id="dy-stageMeta"></small>
            </div>
            <button type="button" className="pill" id="dy-stopBtn">Stop round</button>
          </div>
          <div className="meter" aria-hidden="true"><div className="meter-fill" id="dy-meterFill"></div></div>
          <h3 id="dy-stagePrompt"></h3>
          <div id="dy-stageBody"></div>
          <div id="dy-stageFeedback" translate="no" className="feedback" role="status" aria-live="polite"></div>
          <div className="stage-actions"><button type="button" className="cta" id="dy-nextBtn" hidden>Next question</button></div>
        </section>

        <section id="dy-review" className="stage" hidden aria-labelledby="dy-reviewHead">
          <h2 id="dy-reviewHead" tabIndex={-1}></h2>
          <p id="dy-reviewCopy"></p>
          <div className="rstats">
            <div className="rstat-box"><b className="big-num" id="dy-revRight"></b><small>Right</small></div>
            <div className="rstat-box"><b className="big-num" id="dy-revTotal"></b><small>Questions</small></div>
            <div className="rstat-box"><b className="big-num" id="dy-revStars"></b><small>Stars in total</small></div>
          </div>
          <div className="focus"><b>Skill tip</b><p id="dy-revTip"></p></div>
          <div id="dy-missBox" translate="no"></div>
          <div className="row" style={{ marginTop: '20px' }}>
            <button type="button" className="cta" id="dy-againBtn">Play again</button>
            <button type="button" className="cta card-bg" id="dy-otherBtn">Choose another game</button>
          </div>
        </section>
      </div>
    </div>
  );
}
