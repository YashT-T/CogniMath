import { useEffect } from 'react';
import mountAutism from './mountAutism.js';
import './autism.css';

/* Autism section. The games are drawn by mountAutism.js into the elements below, found by id.
   The markup is static on purpose: React renders it once and the game code updates it. */
export default function Autism({ api }) {
  useEffect(() => { api.current = mountAutism(); }, []);
  return (
    <div id="au-root" className="sec-autism">
      <div className="wrap">
        <header className="bar">
          <div className="brand-group">
            <button type="button" className="avatar-btn" id="au-openShopBtn" aria-label="Upgrade character companion">
              <span className="avatar-glyph" id="au-avatarGlyph">🦊</span>
              <span className="avatar-badge" id="au-avatarBadge">✨</span>
              <span id="au-avatarLabel">Calm Fox</span>
            </button>
            <span className="brand">CogniMath</span>
          </div>

          <nav aria-label="Practice controls">
            <div className="pill" role="status" title="Mistakes are feedback. Your streak never resets.">
              🔥 Practice streak: <span id="au-streakDisplay">0</span>
            </div>
            <div className="pill" role="status">
              ⭐ Points: <span id="au-pointsDisplay">50</span>
            </div>
            <button type="button" className="pill" id="au-sensoryToggleBtn" aria-pressed="false">
              ⚡ High stimulant
            </button>
          </nav>
        </header>

        <section className="back" role="status" aria-live="polite">
          <div>
            <h2 style={{ marginBottom: '4px' }}>Suggested next practice</h2>
            <p id="au-aiBannerCopy">Start with <strong>Matrix memory tiles</strong> to warm up spatial recall at your own pace.</p>
          </div>
          <button type="button" className="cta violet" id="au-playSuggestedBtn">Practice suggested topic</button>
        </section>

        <section className="hero">
          <h1>Pick a topic and practise at your pace</h1>
          <p>Choose any cognitive module below. Every mistake is explained at the end of a round, and your practice streak never resets.</p>
        </section>

        <section className="stats-row" aria-label="Practice summary">
          <div className="stat" style={{ '--c': 'var(--mint)' }}>
            <b id="au-statPlays">0</b>
            <span>Completed rounds</span>
          </div>
          <div className="stat" style={{ '--c': 'var(--yellow)' }}>
            <b id="au-statAccuracy">100%</b>
            <span>Overall accuracy</span>
          </div>
          <div className="stat" style={{ '--c': 'var(--blue)' }}>
            <b id="au-statLevel">Level 1</b>
            <span>Adaptive difficulty tier</span>
          </div>
        </section>

        <div className="play-layout">
          <div>
            <h2>1. Choose a practice topic</h2>
            <div className="tiles-grid" id="au-topicsGrid"></div>

            <h2>2. Choose your practice format</h2>
            <div className="modes-grid" id="au-modesGrid"></div>
          </div>

          <aside className="panel" aria-label="Start practice">
            <h2 id="au-panelTopicName">Matrix memory tiles</h2>
            <p id="au-panelTopicBlurb">Remember the highlighted pattern on the grid and tap the matching tiles.</p>
            <small id="au-panelGhostInfo">Matched with a saved ghost run (sample pace: 6 pts) • Adaptive Tier 1</small>
            <button type="button" className="cta" id="au-startSprintBtn" style={{ width: '100%', marginTop: '8px' }}>
              Start practice
            </button>
          </aside>
        </div>

        <dialog className="game" id="au-gameDialog" aria-labelledby="au-dialogTopicTitle">
          <div id="au-activeSprintView">
            <div className="game-top">
              <div>
                <h2 id="au-dialogTopicTitle" style={{ marginBottom: '2px' }}>Topic</h2>
                <small id="au-dialogMeta">Adaptive Level 1 • Keys 1–4 to answer</small>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="clock" role="timer" id="au-timerPill">60s</div>
                <button type="button" className="pill" id="au-finishEarlyBtn">Finish &amp; review</button>
              </div>
            </div>

            <div className="meter" aria-hidden="true">
              <div className="meter-fill" id="au-meterFill"></div>
            </div>

            <div id="au-questionStage"></div>

            <div id="au-liveFeedback" role="status" style={{ marginTop: '18px', fontWeight: 700, minHeight: '28px' }}></div>
          </div>

          <div id="au-reviewView" style={{ display: 'none' }}>
            <h2 id="au-reviewHeadline">Practice complete!</h2>
            <p id="au-reviewPaceCopy">Mistakes are feedback, never failure. Here is how your round went.</p>

            <div className="rstats">
              <div className="rstat-box">
                <b className="big-num" style={{ fontSize: '1.6rem' }} id="au-revScore">0</b>
                <small>Your score</small>
              </div>
              <div className="rstat-box">
                <b className="big-num" style={{ fontSize: '1.6rem' }} id="au-revGhost">5</b>
                <small>Sample ghost</small>
              </div>
              <div className="rstat-box">
                <b className="big-num" style={{ fontSize: '1.6rem' }} id="au-revAcc">100%</b>
                <small>Accuracy</small>
              </div>
              <div className="rstat-box">
                <b className="big-num" style={{ fontSize: '1.6rem' }} id="au-revLevel">Lv 1</b>
                <small>Next adaptive tier</small>
              </div>
            </div>

            <div id="au-focusSkillsBox"></div>
            <div id="au-missedQuestionsBox"></div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button type="button" className="cta" id="au-playAgainBtn">Play again</button>
              <button type="button" className="cta card-bg" id="au-closeDialogBtn">Choose another topic</button>
            </div>
          </div>
        </dialog>

        <dialog className="game" id="au-shopDialog" aria-labelledby="au-shopHeading">
          <div className="game-top">
            <h2 id="au-shopHeading">Character companion &amp; badge upgrades</h2>
            <button type="button" className="pill" id="au-closeShopBtn">Close (Esc)</button>
          </div>
          <p style={{ marginBottom: '16px' }}>Use your practice points to unlock new companions and badges for your top-left button.</p>
          <h3>Companions</h3>
          <div className="tiles-grid" id="au-avatarShopGrid" style={{ marginTop: '10px', marginBottom: '24px' }}></div>
          <h3>Corner badges</h3>
          <div className="tiles-grid" id="au-badgeShopGrid" style={{ marginTop: '10px' }}></div>
        </dialog>
      </div>
    </div>
  );
}
