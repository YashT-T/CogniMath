/* Autism section: predictable, low-stimulation practice with an untimed mode, sound and avatar upgrades.
   Wrapped in mount() so it only touches the DOM once the section has rendered.
   Every element id is prefixed "au-" so it cannot clash with the other sections. */
import { saveSprint } from '../../lib/progress.js';

export default function mountAutism() {
const $ = id => document.getElementById('au-' + id);
const ROOT = () => $('root');

    /********************************************************************
     * 1. TOPICS, FIXED POOLS & SKILL TIPS (Follows design.md Section 3 & 9)
     ********************************************************************/
    const CM = {
      TIPS: {
        'Spatial recall': 'Group glowing tiles into simple shapes like L-corners or pairs before the grid hides.',
        'Auditory arithmetic': 'Tap your finger once for each beep in the first group, pause, then count the second group.',
        'Number line estimation': 'Look at the halfway tick mark first to anchor where your slider needs to stop.',
        'Sequence rules': 'Say the colours or shapes aloud in rhythm to spot where the cycle repeats.',
        'Mental arithmetic': 'Break two-digit additions into tens first, then add the remaining ones.',
        'Grid deduction': 'Check which symbol is missing from the bottom row before checking the columns.',
        'Contextual cues': 'Match the everyday situation to how calm or alert your body would feel.'
      },
      TOPICS: [
        {
          id: 'matrix',
          name: 'Matrix memory tiles',
          blurb: 'Remember the highlighted tile pattern on the grid and tap it back.',
          glyph: '🟦',
          color: 'var(--blue)',
          tag: 'Spatial recall',
          ghost: 5
        },
        {
          id: 'beepmath',
          name: 'Rhythm & beep maths',
          blurb: 'Listen to two groups of harmonic beeps and calculate the total.',
          glyph: '🔔',
          color: 'var(--coral)',
          tag: 'Auditory arithmetic',
          ghost: 6
        },
        {
          id: 'tactile',
          name: 'Tactile number line',
          blurb: 'Slide along the interactive number track to land on the target value.',
          glyph: '📏',
          color: 'var(--mint)',
          tag: 'Number line estimation',
          ghost: 7
        },
        {
          id: 'pattern',
          name: 'Pattern puzzles',
          blurb: 'Spot the repeating rule and pick the symbol that completes the sequence.',
          glyph: '🔷',
          color: 'var(--pink)',
          tag: 'Sequence rules',
          ghost: 8
        },
        {
          id: 'rapid',
          name: 'Everyday maths',
          blurb: 'Practise mental addition, subtraction, and multiplication with adaptive numbers.',
          glyph: '⚡',
          color: 'var(--yellow)',
          tag: 'Mental arithmetic',
          ghost: 9
        },
        {
          id: 'logic',
          name: 'Logical reasoning',
          blurb: 'Deduce the missing piece in a structured 3x3 rule matrix.',
          glyph: '🧩',
          color: 'var(--lilac)',
          tag: 'Grid deduction',
          ghost: 7
        },
        {
          id: 'emotion',
          name: 'Everyday context cues',
          blurb: 'Connect predictable daily situations with the matching feeling.',
          glyph: '😊',
          color: 'var(--mint)',
          tag: 'Contextual cues',
          ghost: 6
        }
      ],
      MODES: [
        {
          id: 'calm',
          name: 'Calm practice (Untimed)',
          desc: 'Practise 5 questions per round with no countdown clock.'
        },
        {
          id: 'rush',
          name: 'Score rush (60s sprint)',
          desc: 'One minute practice sprint against a sample ghost pace.'
        }
      ]
    };

    /********************************************************************
     * 2. STATE & BROWSER STORAGE (cm.recent, cm.last per Section 2)
     ********************************************************************/
    const state = {
      selectedTopicId: 'matrix',
      selectedModeId: 'calm',
      sensoryLow: false,
      streak: 0,
      points: 50,
      plays: 0,
      totalAsked: 0,
      totalCorrect: 0,
      avatar: '🦊',
      avatarName: 'Calm Fox',
      badge: '✨',
      unlockedAvatars: ['🦊'],
      unlockedBadges: ['✨'],
      levels: { matrix: 1, beepmath: 1, tactile: 1, pattern: 1, rapid: 1, logic: 1, emotion: 1 },
      topicPlays: { matrix: 0, beepmath: 0, tactile: 0, pattern: 0, rapid: 0, logic: 0, emotion: 0 }
    };

    // Active sprint ref-equivalent state
    let sprint = {
      active: false,
      timeLeft: 60,
      timerId: null,
      score: 0,
      asked: 0,
      correctCount: 0,
      streakInRound: 0,
      currentQ: null,
      locked: false,
      misses: [],
      tags: {}
    };

    function loadStorage() {
      try {
                const saved = JSON.parse(localStorage.getItem('cm.neuroflow_state') || 'null');
        if (saved) Object.assign(state, saved);
      } catch (e) {}
    }

    function saveStorage(promptText) {
      try {
        localStorage.setItem('cm.neuroflow_state', JSON.stringify(state));
        if (promptText) {
          const recent = JSON.parse(localStorage.getItem('cm.autism.recent') || '[]');
          recent.unshift(promptText);
          localStorage.setItem('cm.autism.recent', JSON.stringify(recent.slice(0, 80)));
        }
      } catch (e) {}
    }

    /********************************************************************
     * 3. WEB AUDIO SYNTHESIZER (Adapts to Low vs High Stimulant)
     ********************************************************************/
    let audioCtx = null;
    function playBeep(freq = 440, duration = 0.16) {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = state.sensoryLow ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        const vol = state.sensoryLow ? 0.08 : 0.2;
        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    /********************************************************************
     * 4. RENDER PLAY PAGE (Topics, Modes, Side Panel, AI Banner)
     ********************************************************************/
    function renderPage() {
      // Header stats
      $('streakDisplay').textContent = state.streak;
      $('pointsDisplay').textContent = state.points;
      $('avatarGlyph').textContent = state.avatar;
      $('avatarBadge').textContent = state.badge;
      $('avatarLabel').textContent = state.avatarName;

      // Top summary stats
      $('statPlays').textContent = state.plays;
      const acc = state.totalAsked > 0 ? Math.round((state.totalCorrect / state.totalAsked) * 100) : 100;
      $('statAccuracy').textContent = `${acc}%`;
      const currentLv = state.levels[state.selectedTopicId] || 1;
      $('statLevel').textContent = `Level ${currentLv}`;

      // Topics Grid (.tile)
      const tGrid = $('topicsGrid');
      tGrid.innerHTML = '';
      CM.TOPICS.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tile';
        btn.style.setProperty('--c', t.color);
        btn.setAttribute('aria-pressed', t.id === state.selectedTopicId ? 'true' : 'false');
        btn.innerHTML = `
          <span class="ico" aria-hidden="true">${t.glyph}</span>
          <b>${t.name}</b>
          <small>${t.blurb}</small>
          <small style="font-weight:700; color:var(--ink); margin-top:4px;">Adaptive tier ${state.levels[t.id] || 1}</small>
        `;
        btn.onclick = () => {
          state.selectedTopicId = t.id;
          renderPage();
        };
        tGrid.appendChild(btn);
      });

      // Modes Grid (.mode)
      const mGrid = $('modesGrid');
      mGrid.innerHTML = '';
      CM.MODES.forEach(m => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mode';
        btn.setAttribute('aria-pressed', m.id === state.selectedModeId ? 'true' : 'false');
        btn.innerHTML = `
          <b>${m.name}</b>
          <small>${m.desc}</small>
        `;
        btn.onclick = () => {
          state.selectedModeId = m.id;
          renderPage();
        };
        mGrid.appendChild(btn);
      });

      // Sticky Violet Panel
      const activeTopic = CM.TOPICS.find(t => t.id === state.selectedTopicId);
      $('panelTopicName').textContent = activeTopic.name;
      $('panelTopicBlurb').textContent = activeTopic.blurb;
      $('panelGhostInfo').textContent =
        `Matched with a saved ghost run (sample pace: ${activeTopic.ghost} pts) • Adaptive Tier ${state.levels[activeTopic.id]}`;

      // AI Suggestion Banner (suggests least-practised topic)
      const sorted = [...CM.TOPICS].sort((a, b) => (state.topicPlays[a.id] || 0) - (state.topicPlays[b.id] || 0));
      const suggested = sorted[0];
      $('aiBannerCopy').innerHTML =
        `Try <strong>${suggested.name}</strong> next (Adaptive Tier ${state.levels[suggested.id]}) to build balanced practice progress.`;
      $('playSuggestedBtn').onclick = () => {
        state.selectedTopicId = suggested.id;
        renderPage();
        startSprint();
      };
    }

    /********************************************************************
     * 5. SPRINT ENGINE & QUESTION GENERATORS
     ********************************************************************/
    function startSprint() {
      const topic = CM.TOPICS.find(t => t.id === state.selectedTopicId);
      sprint = {
        active: true,
        timeLeft: 60,
        timerId: null,
        score: 0,
        asked: 0,
        correctCount: 0,
        streakInRound: 0,
        currentQ: null,
        locked: false,
        misses: [],
        tags: { [topic.tag]: { n: 0, m: 0 } }
      };

      state.topicPlays[topic.id] = (state.topicPlays[topic.id] || 0) + 1;
      $('activeSprintView').style.display = 'block';
      $('reviewView').style.display = 'none';
      $('dialogTopicTitle').textContent = topic.name;
      $('liveFeedback').textContent = '';

      const dialog = $('gameDialog');
      if (!dialog.open) dialog.showModal();

      if (state.selectedModeId === 'rush') {
        $('timerPill').textContent = '60s';
        $('meterFill').style.width = '100%';
        sprint.timerId = setInterval(() => {
          sprint.timeLeft -= 1;
          $('timerPill').textContent = `${sprint.timeLeft}s`;
          $('meterFill').style.width = `${(sprint.timeLeft / 60) * 100}%`;
          if (sprint.timeLeft <= 0) endSprint();
        }, 1000);
      } else {
        $('timerPill').textContent = 'Untimed (5 Qs)';
        $('meterFill').style.width = '100%';
      }

      nextQuestion();
    }

    function nextQuestion() {
      if (!sprint.active) return;
      if (state.selectedModeId === 'calm' && sprint.asked >= 5) {
        endSprint();
        return;
      }

      sprint.locked = false;
      const topic = CM.TOPICS.find(t => t.id === state.selectedTopicId);
      const lv = state.levels[topic.id] || 1;
      $('dialogMeta').textContent =
        `Adaptive Tier ${lv} • Score: ${sprint.score} • Keys 1–4 to answer`;
      $('liveFeedback').textContent = '';

      if (topic.id === 'matrix') renderMatrixQuestion(lv, topic);
      else if (topic.id === 'tactile') renderTactileQuestion(lv, topic);
      else if (topic.id === 'beepmath') renderBeepQuestion(lv, topic);
      else renderStandardQuestion(topic, lv);
    }

    /* --- Standard 4-Option Generator (Rapid Maths, Patterns, Logic, Emotion) --- */
    function renderStandardQuestion(topic, lv) {
      const stage = $('questionStage');
      let q = null;

      if (topic.id === 'rapid') {
        const a = Math.floor(Math.random() * (lv * 6)) + 2;
        const b = Math.floor(Math.random() * (lv * 5)) + 2;
        const ans = a + b;
        const opts = [ans, ans + 1, Math.max(1, ans - 2), ans + 10].sort(() => Math.random() - 0.5);
        q = {
          p: `What is ${a} + ${b}?`,
          a: opts.map(String),
          c: opts.indexOf(ans),
          e: `Add the tens and ones: ${a} + ${b} = ${ans}.`,
          tag: topic.tag
        };
      } else if (topic.id === 'pattern') {
        const sets = [['🔴', '🔵'], ['🔺', '🟨', '🟢'], ['⭐', '🌙', '☀️']];
        const s = sets[(lv - 1) % sets.length];
        const seq = [s[0], s[1 % s.length], s[2 % s.length], s[3 % s.length], s[4 % s.length]];
        const correct = s[5 % s.length];
        const opts = ['🔴', '🔵', '🔺', '⭐'];
        if (!opts.includes(correct)) opts[0] = correct;
        q = {
          p: `Complete the sequence: ${seq.join(' ')} ?`,
          a: opts,
          c: opts.indexOf(correct),
          e: `The pattern repeats every ${s.length} symbols, so ${correct} comes next.`,
          tag: topic.tag
        };
      } else if (topic.id === 'logic') {
        const row = ['🍎', '🍌', '🍇'];
        const opts = ['🍌', '🍎', '🍇', '🍊'];
        q = {
          p: `Each row needs 🍎, 🍌, and 🍇. Row 3 has: 🍇, 🍎, [ ? ]`,
          a: opts,
          c: 0,
          e: `Since 🍇 and 🍎 are already in the row, 🍌 is the missing symbol.`,
          tag: topic.tag
        };
      } else {
        q = {
          p: `Scenario: Finishing a practice puzzle you worked carefully on.`,
          a: ['😊 Proud and calm', '😟 Startled', '😴 Sleepy', '😠 Frustrated'],
          c: 0,
          e: `Completing a structured goal typically brings a sense of calm pride.`,
          tag: topic.tag
        };
      }

      sprint.currentQ = q;
      stage.innerHTML = `
        <h3 style="font-size: 1.5rem; margin-bottom: 12px;">${q.p}</h3>
        <div class="opt-grid" id="au-optGrid"></div>
      `;

      const grid = $('optGrid');
      q.a.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt';
        btn.innerHTML = `<span>${optText}</span> <span class="key-hint">${idx + 1}</span>`;
        btn.onclick = () => submitChoice(idx, btn);
        grid.appendChild(btn);
      });
    }

    /* --- Rhythm & Beep Maths Generator --- */
    function renderBeepQuestion(lv, topic) {
      const a = Math.floor(Math.random() * (lv + 2)) + 1;
      const b = Math.floor(Math.random() * (lv + 2)) + 1;
      const ans = a + b;
      const opts = [ans, ans + 1, Math.max(1, ans - 1), ans + 2].sort(() => Math.random() - 0.5);

      sprint.currentQ = {
        p: `Beep sequence: ${a} beeps + ${b} beeps`,
        a: opts.map(String),
        c: opts.indexOf(ans),
        e: `The first burst played ${a} beeps and the second played ${b} beeps (${a} + ${b} = ${ans}).`,
        tag: topic.tag
      };

      const stage = $('questionStage');
      stage.innerHTML = `
        <h3 style="font-size: 1.4rem; margin-bottom: 10px;">Listen to both beep groups and add them together</h3>
        <button type="button" class="cta" id="au-replayBeepsBtn">🔊 Play beep sequence</button>
        <div class="opt-grid" id="au-optGrid"></div>
      `;

      function playSequence() {
        let d = 0;
        for (let i = 0; i < a; i++) { setTimeout(() => playBeep(440, 0.14), d); d += 340; }
        d += 550;
        for (let j = 0; j < b; j++) { setTimeout(() => playBeep(587.33, 0.14), d); d += 340; }
      }

      $('replayBeepsBtn').onclick = playSequence;
      setTimeout(playSequence, 200);

      const grid = $('optGrid');
      sprint.currentQ.a.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt';
        btn.innerHTML = `<span>${optText}</span> <span class="key-hint">${idx + 1}</span>`;
        btn.onclick = () => submitChoice(idx, btn);
        grid.appendChild(btn);
      });
    }

    /* --- Matrix Memory Tiles Generator --- */
    function renderMatrixQuestion(lv, topic) {
      const size = lv >= 3 ? 4 : 3;
      const count = lv + 2;
      const targets = new Set();
      while (targets.size < count) targets.add(Math.floor(Math.random() * (size * size)));
      const picked = new Set();
      let ready = false;

      sprint.currentQ = {
        p: `Matrix ${size}x${size} pattern (${count} tiles)`,
        a: ['Completed pattern', 'Missed tile'],
        c: 0,
        e: `Try grouping glowing tiles into pairs or corners right as they light up.`,
        tag: topic.tag
      };

      const stage = $('questionStage');
      stage.innerHTML = `
        <h3 id="au-matrixPrompt" style="font-size: 1.35rem;">Watch the highlighted tiles...</h3>
        <div class="matrix-board" id="au-matrixBoard" style="grid-template-columns: repeat(${size}, 68px);"></div>
      `;

      const board = $('matrixBoard');
      const cells = [];
      for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'matrix-cell';
        cell.setAttribute('aria-label', `Grid tile ${i + 1}`);
        if (targets.has(i)) cell.classList.add('lit');
        cell.onclick = () => {
          if (!ready || sprint.locked) return;
          if (targets.has(i)) {
            cell.classList.add('picked');
            cell.textContent = '✓';
            picked.add(i);
            playBeep(520, 0.1);
            if (picked.size === targets.size) {
              recordOutcome(true, 'All tiles recalled');
            }
          } else {
            cell.style.background = 'var(--coral)';
            cell.textContent = '✗';
            recordOutcome(false, 'Tapped an unlit tile');
          }
        };
        cells.push(cell);
        board.appendChild(cell);
      }

      setTimeout(() => {
        cells.forEach(c => c.classList.remove('lit'));
        const pr = $('matrixPrompt');
        if (pr) pr.textContent = `Tap the ${targets.size} tiles that were highlighted`;
        ready = true;
      }, 1300);
    }

    /* --- Tactile Number Line Generator --- */
    function renderTactileQuestion(lv, topic) {
      const max = lv * 10;
      const a = Math.floor(Math.random() * (max - 4)) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      const target = a + b;

      sprint.currentQ = {
        p: `Slide to ${a} + ${b} on the number line`,
        a: [String(target)],
        c: 0,
        e: `Starting at ${a} and moving ${b} steps right lands on ${target}.`,
        tag: topic.tag
      };

      const stage = $('questionStage');
      stage.innerHTML = `
        <h3 style="font-size: 1.4rem;">Slide the marker to solve: ${a} + ${b} = <span id="au-tactileVal">${a}</span></h3>
        <div class="tactile-track">
          <input type="range" min="0" max="${max}" value="${a}" class="tactile-slider" id="au-tactileSlider" aria-label="Number line slider" />
          <div style="display:flex; justify-content:space-between; font-weight:700; margin-top:8px;">
            <span>0</span><span>${Math.floor(max / 2)}</span><span>${max}</span>
          </div>
        </div>
        <button type="button" class="cta" id="au-checkTactileBtn">Lock answer</button>
      `;

      const slider = $('tactileSlider');
      const valSpan = $('tactileVal');
      slider.oninput = () => {
        valSpan.textContent = slider.value;
        playBeep(300 + Number(slider.value) * 8, 0.05);
      };
      $('checkTactileBtn').onclick = () => {
        const chosen = Number(slider.value);
        recordOutcome(chosen === target, String(chosen));
      };
    }

    /********************************************************************
     * 6. ANSWER LOCKING & NON-PUNITIVE ADAPTIVE SCALING (Section 4 & 9)
     ********************************************************************/
    function submitChoice(index, btnElement) {
      if (sprint.locked) return;
      const q = sprint.currentQ;
      const isOk = index === q.c;
      if (btnElement) {
        btnElement.classList.add(isOk ? 'ok' : 'no');
        btnElement.innerHTML = `<span>${q.a[index]} ${isOk ? '✓' : '✗'}</span>`;
      }
      recordOutcome(isOk, q.a[index]);
    }

    function recordOutcome(isOk, chosenLabel) {
      sprint.locked = true;
      const topic = CM.TOPICS.find(t => t.id === state.selectedTopicId);
      const q = sprint.currentQ;

      sprint.asked += 1;
      state.totalAsked += 1;
      sprint.tags[q.tag].n += 1;

      if (isOk) {
        sprint.score += 1;
        sprint.correctCount += 1;
        sprint.streakInRound += 1;
        state.totalCorrect += 1;
        state.streak += 1; // Eternal streak increases
        state.points += 10;
        playBeep(587.33, 0.15);

        // Adaptive AI scaling: 3 correct in a row levels up the topic
        if (sprint.streakInRound >= 3 && state.levels[topic.id] < 5) {
          state.levels[topic.id] += 1;
          sprint.streakInRound = 0;
        }
        $('liveFeedback').textContent = '✓ Spot on! +10 points';
      } else {
        sprint.streakInRound = 0;
        sprint.tags[q.tag].m += 1;
        sprint.misses.push({
          p: q.p,
          chosen: chosenLabel,
          correct: q.a[q.c],
          e: q.e
        });
        playBeep(261.63, 0.2);
        // Non-punitive: streak never resets!
        $('liveFeedback').textContent =
          `✗ Worth a refresher in the review. Your streak (${state.streak}) is safe!`;
      }

      saveStorage(q.p);
      setTimeout(nextQuestion, isOk ? 500 : 900);
    }

    /********************************************************************
     * 7. END-OF-SPRINT REVIEW & EXPRESS API SYNC (Section 9 & 10)
     ********************************************************************/
    function endSprint() {
      sprint.active = false;
      if (sprint.timerId) clearInterval(sprint.timerId);
      state.plays += 1;
      saveStorage();
      renderPage();

      const topic = CM.TOPICS.find(t => t.id === state.selectedTopicId);
      $('activeSprintView').style.display = 'none';
      $('reviewView').style.display = 'block';

      const acc = sprint.asked > 0 ? Math.round((sprint.correctCount / sprint.asked) * 100) : 100;
      $('revScore').textContent = sprint.score;
      $('revGhost').textContent = topic.ghost;
      $('revAcc').textContent = `${acc}%`;
      $('revLevel').textContent = `Lv ${state.levels[topic.id]}`;

      // Focus skills card (.focus)
      const focusBox = $('focusSkillsBox');
      focusBox.innerHTML = `<h3 style="margin: 16px 0 10px;">Skill tip for ${topic.tag}</h3>
        <div class="focus">
          <b>${topic.tag}</b>
          <p style="margin-top:4px;">${CM.TIPS[topic.tag]}</p>
        </div>`;

      // Missed questions explanations (.miss)
      const missBox = $('missedQuestionsBox');
      if (sprint.misses.length === 0) {
        missBox.innerHTML = `<p style="margin-top: 12px; font-weight: 700;">Clean run! Every question answered accurately.</p>`;
      } else {
        missBox.innerHTML = `<h3 style="margin: 16px 0 10px;">Questions to review</h3>` +
          sprint.misses.map(m => `
            <div class="miss">
              <b>${m.p}</b>
              <small style="color: var(--bad); margin-top: 4px;">You chose: ${m.chosen} • Correct: ${m.correct}</small>
              <p style="margin-top: 6px; font-size: 0.95rem;">${m.e}</p>
            </div>
          `).join('');
      }

      // POST to /api/sprints per Section 2 & 10 (with .catch(() => {}) so UI never breaks)
      saveSprint({
        topic: topic.id,
        mode: state.selectedModeId,
        score: sprint.score,
        ghost: topic.ghost,
        n: sprint.asked,
        ok: sprint.correctCount,
        tags: sprint.tags,
        section: 'autism'
      });
    }

    /********************************************************************
     * 8. KEYBOARD SHORTCUTS (Keys 1-4 & Esc) & SHOP UPGRADES
     ********************************************************************/
    window.addEventListener('keydown', (e) => {
      if (!sprint.active || sprint.locked) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        const buttons = document.querySelectorAll('#au-optGrid .opt');
        if (buttons[idx]) buttons[idx].click();
      }
    });

    const shopAvatars = [
      { icon: '🦊', name: 'Calm Fox', cost: 0 },
      { icon: '🦉', name: 'Wise Owl', cost: 30 },
      { icon: '🐢', name: 'Steady Turtle', cost: 40 },
      { icon: '🐬', name: 'Wave Dolphin', cost: 60 },
      { icon: '🤖', name: 'Logic Bot', cost: 80 }
    ];

    const shopBadges = [
      { icon: '✨', name: 'Spark', cost: 0 },
      { icon: '👑', name: 'Crown', cost: 40 },
      { icon: '🚀', name: 'Rocket', cost: 50 }
    ];

    function renderShop() {
      const aGrid = $('avatarShopGrid');
      aGrid.innerHTML = '';
      shopAvatars.forEach(item => {
        const unlocked = state.unlockedAvatars.includes(item.icon);
        const active = state.avatar === item.icon;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tile';
        btn.style.setProperty('--c', active ? 'var(--yellow)' : 'var(--card)');
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.innerHTML = `
          <span class="ico">${item.icon}</span>
          <b>${item.name}</b>
          <small>${active ? 'Equipped' : (unlocked ? 'Click to equip' : `${item.cost} points`)}</small>
        `;
        btn.onclick = () => {
          if (unlocked) {
            state.avatar = item.icon;
            state.avatarName = item.name;
          } else if (state.points >= item.cost) {
            state.points -= item.cost;
            state.unlockedAvatars.push(item.icon);
            state.avatar = item.icon;
            state.avatarName = item.name;
            playBeep(659.25, 0.16);
          }
          saveStorage();
          renderPage();
          renderShop();
        };
        aGrid.appendChild(btn);
      });

      const bGrid = $('badgeShopGrid');
      bGrid.innerHTML = '';
      shopBadges.forEach(item => {
        const unlocked = state.unlockedBadges.includes(item.icon);
        const active = state.badge === item.icon;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tile';
        btn.style.setProperty('--c', active ? 'var(--mint)' : 'var(--card)');
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.innerHTML = `
          <span class="ico">${item.icon}</span>
          <b>${item.name}</b>
          <small>${active ? 'Equipped' : (unlocked ? 'Click to equip' : `${item.cost} points`)}</small>
        `;
        btn.onclick = () => {
          if (unlocked) {
            state.badge = item.icon;
          } else if (state.points >= item.cost) {
            state.points -= item.cost;
            state.unlockedBadges.push(item.icon);
            state.badge = item.icon;
            playBeep(659.25, 0.16);
          }
          saveStorage();
          renderPage();
          renderShop();
        };
        bGrid.appendChild(btn);
      });
    }

    // Wire up UI buttons
    $('startSprintBtn').onclick = startSprint;
    $('finishEarlyBtn').onclick = endSprint;
    $('playAgainBtn').onclick = startSprint;
    $('closeDialogBtn').onclick = () => $('gameDialog').close();

    $('openShopBtn').onclick = () => {
      renderShop();
      $('shopDialog').showModal();
    };
    $('closeShopBtn').onclick = () => $('shopDialog').close();

    $('sensoryToggleBtn').onclick = (e) => {
      state.sensoryLow = !state.sensoryLow;
      ROOT().classList.toggle('low-stim', state.sensoryLow);
      e.currentTarget.setAttribute('aria-pressed', state.sensoryLow ? 'true' : 'false');
      e.currentTarget.textContent = state.sensoryLow ? '🌿 Low stimulant' : '⚡ High stimulant';
      saveStorage();
    };

    // Boot
    loadStorage();
    // Restore the saved stimulation mode (the original page forgot it after a reload).
    ROOT().classList.toggle('low-stim', state.sensoryLow);
    $('sensoryToggleBtn').setAttribute('aria-pressed', state.sensoryLow ? 'true' : 'false');
    $('sensoryToggleBtn').textContent = state.sensoryLow ? '🌿 Low stimulant' : '⚡ High stimulant';
    renderPage();
  
/* Esc closes the dialog without pressing a button: stop the timer so the sprint does not keep running unseen. */
$('gameDialog').addEventListener('close', () => {
  if (sprint.timerId) clearInterval(sprint.timerId);
  sprint.active = false;
});

function deactivate() {
  if (sprint.active) { sprint.active = false; if (sprint.timerId) clearInterval(sprint.timerId); }
  if ($('gameDialog').open) $('gameDialog').close();
  if ($('shopDialog').open) $('shopDialog').close();
}
return { activate() {}, deactivate };
}
