import { recordAnswer } from '../../lib/history.js';
import { freshPick } from '../../lib/questionMemory.js';
/* Dyslexia section (WordSpark): reading and sound games with voice, big text and calm mode.
   Wrapped in mount() so it only touches the DOM once the section has rendered.
   Every element id is prefixed "dy-" so it cannot clash with the other sections. */
export default function mountDyslexia() {
const $ = id => document.getElementById('dy-' + id);
const ROOT = () => $('root');

/* ==========================================================================
   1. HELPERS
   ========================================================================== */

const rnd = n => Math.floor(Math.random() * n);
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const pickN = (arr, n) => freshPick(arr, n, x => 'dx:' + (Array.isArray(x) ? x.join('|') : typeof x === 'object' ? JSON.stringify(x) : x));
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const mkBtn = (label, cls) => { const b = el('button', cls, label); b.type = 'button'; return b; };
const NUM = ['zero', 'one', 'two', 'three', 'four'];

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

/* ==========================================================================
   2. SETTINGS AND PROGRESS (saved in this browser only)
   ========================================================================== */
const SIZES = [{ label: 'Normal', v: 1 }, { label: 'Large', v: 1.2 }, { label: 'Extra large', v: 1.4 }];
const SPEEDS = [{ label: 'Slow', v: 0.7 }, { label: 'Normal', v: 0.95 }, { label: 'Quick', v: 1.15 }];
const settings = Object.assign({ size: 0, speed: 1, autoSpeak: true, calm: false }, loadJSON('ws.settings', {}));
let progress = Object.assign({ rounds: 0, asked: 0, right: 0, stars: 0, games: {} }, loadJSON('ws.progress', {}));
let selectedId = 'sounds';
let active = false;
let session = null;
let activePick = null;
let lastGame = null;

function saveSettings() { saveJSON('ws.settings', settings); applySettings(); }

function applySettings() {
  if (active) document.documentElement.style.fontSize = `calc(16px * ${SIZES[settings.size].v})`;
  ROOT().classList.toggle('calm', settings.calm);
  $('sizeBtn').textContent = `Text size: ${SIZES[settings.size].label}`;
  $('speedBtn').textContent = `Voice speed: ${SPEEDS[settings.speed].label}`;
  $('speakBtn').textContent = `Read questions aloud: ${settings.autoSpeak ? 'On' : 'Off'}`;
  $('speakBtn').setAttribute('aria-pressed', String(settings.autoSpeak));
  $('calmBtn').textContent = `Reduce motion: ${settings.calm ? 'On' : 'Off'}`;
  $('calmBtn').setAttribute('aria-pressed', String(settings.calm));
}

$('sizeBtn').onclick = () => { settings.size = (settings.size + 1) % SIZES.length; saveSettings(); };
$('speedBtn').onclick = () => { settings.speed = (settings.speed + 1) % SPEEDS.length; saveSettings(); };
$('speakBtn').onclick = () => { settings.autoSpeak = !settings.autoSpeak; saveSettings(); };
$('calmBtn').onclick = () => { settings.calm = !settings.calm; saveSettings(); };

function updateHeader() {
  $('statRounds').textContent = progress.rounds;
  $('statAcc').textContent = progress.asked ? `${Math.round((progress.right / progress.asked) * 100)}%` : '100%';
  $('statStars').textContent = progress.stars;
}

/* ==========================================================================
   3. SPEECH (text to speech and speech recognition)
   Both use built-in browser features. No audio is sent to our server.
   ========================================================================== */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeech = 'speechSynthesis' in window;
let recognizer = null;

function speak(text) {
  if (!hasSpeech || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = SPEEDS[settings.speed].v;
    speechSynthesis.speak(u);
  } catch (e) {}
}

function listen(onResult, onError) {
  if (!SR) { onError('unsupported'); return; }
  try {
    recognizer = new SR();
    recognizer.lang = 'en-US';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 3;
    recognizer.onresult = e => {
      const alts = [];
      const res = e.results[0];
      for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
      onResult(alts);
    };
    recognizer.onerror = e => onError(e.error || 'error');
    recognizer.start();
  } catch (e) { onError('error'); }
}

const clean = s => String(s).toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

function editDistance(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b[i - 1] === a[j - 1]
        ? m[i - 1][j - 1]
        : 1 + Math.min(m[i - 1][j - 1], m[i - 1][j], m[i][j - 1]);
    }
  }
  return m[b.length][a.length];
}

// Accepts one word if it is exact, or one letter off for longer words (speech recognition is not perfect).
function heardWord(alts, target) {
  return alts.some(a => clean(a).split(' ').some(t =>
    t === target || (target.length >= 4 && editDistance(t, target) <= 1)));
}

// Checks whether a spoken alternative contains one of the option's spoken forms.
function heardForm(alts, option) {
  const forms = [option.say || option.label].map(clean);
  return alts.some(a => {
    const t = ` ${clean(a)} `;
    return forms.some(f => t.includes(` ${f} `));
  });
}

function hearButton(body, text, label) {
  if (!hasSpeech) return null;
  const b = mkBtn(label || '🔊 Hear it again', 'cta card-bg');
  b.onclick = () => speak(text);
  body.appendChild(b);
  return b;
}

function voiceButton(body, label, onAlts) {
  const wrap = el('div', 'voice-wrap');
  const b = mkBtn(`🎤 ${label}`, 'cta violet');
  const msg = el('p', 'voice-msg');
  msg.setAttribute('aria-live', 'polite');
  b.onclick = () => {
    b.disabled = true;
    b.textContent = 'Listening…';
    msg.textContent = 'Say your answer now.';
    listen(alts => {
      b.disabled = false;
      b.textContent = `🎤 ${label}`;
      const matched = onAlts(alts);
      msg.textContent = matched ? '' : `I heard "${alts[0]}". Try again, or tap a choice.`;
    }, err => {
      b.disabled = false;
      b.textContent = `🎤 ${label}`;
      msg.textContent = err === 'not-allowed'
        ? 'Microphone access is blocked. You can still tap your answer.'
        : err === 'no-speech'
          ? 'I did not hear anything. Try again when you are ready.'
          : 'Voice did not work this time. You can still tap your answer.';
    });
  };
  wrap.append(b, msg);
  body.appendChild(wrap);
  return wrap;
}

/* ==========================================================================
   4. SHARED ANSWER UI (tap or press 1 to 4, or say the answer)
   Options: [{ label, say?, big? }]. `say` is what the microphone should expect.
   ========================================================================== */
function choices(body, opts, correctIdx, done) {
  const grid = el('div', 'opt-grid');
  let locked = false;

  const btns = opts.map((o, i) => {
    const b = mkBtn('', 'opt' + (o.big ? ' big' : ''));
    b.append(el('span', '', o.label), el('span', 'key-hint', String(i + 1)));
    b.onclick = () => pick(i);
    grid.appendChild(b);
    return b;
  });

  function pick(i) {
    if (locked || i < 0 || i >= opts.length) return;
    locked = true;
    activePick = null;
    const ok = i === correctIdx;
    btns.forEach(b => { b.disabled = true; });
    btns[i].firstElementChild.textContent = `${ok ? '✓' : '✗'} ${opts[i].label}`;
    btns[i].classList.add(ok ? 'ok' : 'no');
    if (!ok) {
      btns[correctIdx].firstElementChild.textContent = `✓ ${opts[correctIdx].label}`;
      btns[correctIdx].classList.add('ok');
    }
    done(ok, opts[i].label);
  }

  activePick = pick;
  body.appendChild(grid);

  if (SR) {
    voiceButton(body, 'Say your answer', alts => {
      const idx = opts.findIndex(o => heardForm(alts, o));
      if (idx >= 0) { pick(idx); return true; }
      return false;
    });
  }
}

/* ==========================================================================
   5. GAME DATA
   ========================================================================== */
const SOUND_SETS = [
  { say: 'ship', opts: ['sheep', 'chip', 'shop', 'ship'] },
  { say: 'boat', opts: ['goat', 'coat', 'bolt', 'boat'] },
  { say: 'thin', opts: ['tin', 'then', 'fin', 'thin'] },
  { say: 'cap', opts: ['cup', 'cape', 'cab', 'cap'] },
  { say: 'tree', opts: ['free', 'tray', 'trip', 'tree'] },
  { say: 'pen', opts: ['pan', 'pin', 'ten', 'pen'] },
  { say: 'rain', opts: ['run', 'ran', 'rang', 'rain'] },
  { say: 'bell', opts: ['ball', 'bill', 'bowl', 'bell'] },
  { say: 'cat', opts: ['bat', 'cap', 'cot', 'cat'] },
  { say: 'dog', opts: ['dig', 'dug', 'fog', 'dog'] },
  { say: 'king', opts: ['ring', 'sing', 'kind', 'king'] },
  { say: 'star', opts: ['stir', 'scar', 'start', 'star'] },
  { say: 'frog', opts: ['flag', 'drag', 'drop', 'frog'] },
  { say: 'milk', opts: ['silk', 'mild', 'melt', 'milk'] },
  { say: 'nest', opts: ['best', 'next', 'rest', 'nest'] },
  { say: 'duck', opts: ['dock', 'deck', 'dusk', 'duck'] },
  { say: 'green', opts: ['grin', 'grain', 'groan', 'green'] },
  { say: 'snake', opts: ['snack', 'stake', 'shake', 'snake'] },
  { say: 'clock', opts: ['click', 'block', 'crock', 'clock'] },
  { say: 'spoon', opts: ['spin', 'soon', 'swoon', 'spoon'] }
];

const SPEAK_WORDS = ['cat', 'dog', 'sun', 'fish', 'frog', 'cake', 'moon', 'book', 'tree', 'house',
  'water', 'apple', 'bread', 'green', 'happy', 'jump', 'school', 'friend', 'bird', 'shoe',
  'star', 'chair', 'spoon', 'flower', 'rabbit', 'garden', 'pencil', 'orange', 'yellow', 'candle'];

const MIRROR = [
  { t: 'b', set: ['b', 'd', 'p', 'q'], tip: 'b has its bump on the right side. d has its bump on the left side.' },
  { t: 'd', set: ['d', 'b', 'q', 'p'], tip: 'd has its bump on the left side. b has its bump on the right side.' },
  { t: 'p', set: ['p', 'q', 'b', 'd'], tip: 'p has its tail dropping down on the left, and its bump on the right.' },
  { t: 'q', set: ['q', 'p', 'd', 'b'], tip: 'q has its tail dropping down on the right, and its bump on the left.' },
  { t: 'm', set: ['m', 'w', 'n', 'u'], tip: 'm has two humps on top, like two small hills.' },
  { t: 'w', set: ['w', 'm', 'u', 'v'], tip: 'w is an upside-down m, with its points at the bottom.' },
  { t: 'n', set: ['n', 'u', 'm', 'h'], tip: 'n has one hump, and its stem is on the left.' },
  { t: 'u', set: ['u', 'n', 'v', 'w'], tip: 'u is a cup shape. n is the same hump turned upside down.' },
  { t: '6', set: ['6', '9', '8', '0'], tip: '6 has its loop at the bottom. 9 has its loop at the top.' },
  { t: '9', set: ['9', '6', '3', '8'], tip: '9 has its loop at the top. 6 has its loop at the bottom.' },
  { t: '2', set: ['2', '5', '3', '7'], tip: '2 curves at the top and has a flat base. 5 has a flat top instead.' },
  { t: '5', set: ['5', '2', '3', '9'], tip: '5 has a flat top and curves at the bottom. 2 curves at the top instead.' },
  { t: 's', set: ['s', 'z', 'c', 'e'], tip: 's curves gently like a snake. z is made of straight lines with sharp corners.' },
  { t: 'z', set: ['z', 's', 'n', 'w'], tip: 'z is made of straight lines with sharp corners, not a curve like s.' },
  { t: 'g', set: ['g', 'q', 'y', 'j'], tip: 'g has a closed loop on top and a curled tail. q has a straight tail and no curl.' },
  { t: 'y', set: ['y', 'v', 'g', 'j'], tip: 'y has a tail that drops straight down. v comes to a point and stops.' }
];

const SYL = [
  ['banana', 3], ['cat', 1], ['elephant', 3], ['butterfly', 3], ['computer', 3],
  ['sun', 1], ['tomato', 3], ['rainbow', 2], ['pencil', 2], ['window', 2],
  ['hospital', 3], ['dinosaur', 3], ['sandwich', 2], ['alligator', 4], ['helicopter', 4],
  ['umbrella', 3], ['bicycle', 3], ['dog', 1], ['paper', 2], ['tiger', 2],
  ['balloon', 2], ['octopus', 3], ['strawberry', 3], ['kangaroo', 3], ['television', 4],
  ['crocodile', 3], ['watermelon', 4], ['caterpillar', 4], ['guitar', 2], ['penguin', 2]
];

const PICS = [
  ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['bed', '🛏️'], ['fish', '🐟'],
  ['frog', '🐸'], ['ship', '🚢'], ['moon', '🌙'], ['tree', '🌳'], ['apple', '🍎'],
  ['house', '🏠'], ['water', '💧'], ['lamp', '💡'], ['book', '📖'], ['cake', '🎂'],
  ['star', '⭐'], ['leaf', '🍃'], ['milk', '🥛'], ['shoe', '👟'], ['kite', '🪁'],
  ['ring', '💍'], ['duck', '🦆'], ['bell', '🔔'], ['lion', '🦁']
];

const RHYMES = [
  { w: 'bake', right: 'cake', wrong: ['dog', 'pen', 'sun'] },
  { w: 'hat', right: 'mat', wrong: ['cup', 'bike', 'tree'] },
  { w: 'sun', right: 'run', wrong: ['cat', 'book', 'lamp'] },
  { w: 'frog', right: 'log', wrong: ['bed', 'ship', 'tree'] },
  { w: 'star', right: 'car', wrong: ['cup', 'moon', 'fish'] },
  { w: 'bee', right: 'tree', wrong: ['cup', 'dog', 'hat'] },
  { w: 'pen', right: 'ten', wrong: ['sun', 'bed', 'house'] },
  { w: 'light', right: 'kite', wrong: ['bat', 'cup', 'fish'] },
  { w: 'cat', right: 'hat', wrong: ['dog', 'sun', 'cup'] },
  { w: 'king', right: 'ring', wrong: ['cat', 'book', 'tree'] },
  { w: 'box', right: 'fox', wrong: ['sun', 'pen', 'cup'] },
  { w: 'duck', right: 'truck', wrong: ['frog', 'cake', 'bed'] },
  { w: 'snail', right: 'tail', wrong: ['moon', 'book', 'shoe'] },
  { w: 'clock', right: 'sock', wrong: ['tree', 'bird', 'cup'] },
  { w: 'bug', right: 'rug', wrong: ['moon', 'bell', 'fish'] },
  { w: 'goat', right: 'boat', wrong: ['pen', 'cat', 'star'] },
  { w: 'wall', right: 'ball', wrong: ['moon', 'book', 'fish'] },
  { w: 'moon', right: 'spoon', wrong: ['cat', 'pen', 'bed'] },
  { w: 'hen', right: 'den', wrong: ['cup', 'dog', 'tree'] },
  { w: 'nose', right: 'rose', wrong: ['sun', 'bat', 'frog'] }
];

/* ==========================================================================
   6. THE SIX GAMES
   Each make() returns 5 questions:
   { prompt, speak, answer, tip, build(body, done) }
   done(ok, chosenText) must be called once per question.
   ========================================================================== */
function makeSounds() {
  return pickN(SOUND_SETS, 5).map(s => ({
    prompt: 'Listen, then find the word you heard.',
    speak: s.say,
    answer: s.say,
    tip: `Say "${s.say}" slowly in your head and notice its first sound.`,
    build(body, done) {
      hearButton(body, s.say);
      const order = shuffle(s.opts).map(w => ({ label: w }));
      choices(body, order, order.findIndex(o => o.label === s.say), done);
    }
  }));
}

function makeSpeak() {
  return pickN(SPEAK_WORDS, 5).map(w => ({
    prompt: 'Say this word out loud.',
    speak: null,
    answer: w,
    tip: `Say "${w}" in small pieces first, then all together.`,
    build(body, done) {
      body.appendChild(el('div', 'word-card', w));
      hearButton(body, w, '🔊 Hear the word first');
      let tries = 0;
      if (SR) {
        voiceButton(body, 'Say the word', alts => {
          tries++;
          if (heardWord(alts, w)) { done(true, alts[0]); return true; }
          if (tries >= 2) { done(false, alts[0]); return true; }
          return false;
        });
      }
      const self = mkBtn('I said it', 'cta card-bg');
      self.onclick = () => done(true, 'Said aloud');
      const skip = mkBtn('Skip for now', 'cta card-bg');
      skip.onclick = () => done(false, 'Skipped');
      body.append(self, skip);
    }
  }));
}

function makeMirror() {
  return pickN(MIRROR, 5).map(m => ({
    prompt: `Find the letter ${m.t}.`,
    speak: `The letter ${m.t}`,
    answer: m.t,
    tip: m.tip,
    build(body, done) {
      hearButton(body, `The letter ${m.t}`, '🔊 Say the letter again');
      const order = shuffle(m.set).map(l => ({ label: l, big: true }));
      choices(body, order, order.findIndex(o => o.label === m.t), done);
    }
  }));
}

function makeSyllable() {
  return pickN(SYL, 5).map(([w, n]) => {
    const beatWord = k => (k === 1 ? 'beat' : 'beats');
    const others = pickN([1, 2, 3, 4].filter(k => k !== n), 3);
    return {
      prompt: 'How many beats does this word have?',
      speak: w,
      answer: `"${w}" has ${NUM[n]} ${beatWord(n)}.`,
      tip: 'Say the word and tap under your chin for each beat. Each time your chin drops is one beat.',
      build(body, done) {
        hearButton(body, w);
        const opts = shuffle([n, ...others]).map(k => ({
          label: `${k} ${beatWord(k)}`,
          say: NUM[k]
        }));
        choices(body, opts, opts.findIndex(o => o.label === `${n} ${beatWord(n)}`), done);
      }
    };
  });
}

function scrambleWord(w) {
  for (let k = 0; k < 20; k++) {
    const s = shuffle(w.split('')).join('');
    if (s !== w) return s;
  }
  return w;
}

function makeUnscramble() {
  return pickN(PICS, 5).map(([w, pic]) => ({
    prompt: 'Put the letters in the right order to spell the picture.',
    speak: null,
    answer: w,
    tip: `Start with the first sound of "${w}", then find the letter that comes next.`,
    build(body, done) {
      body.appendChild(el('div', 'pic', pic));
      hearButton(body, w, '🔊 Hear the word');

      const letters = scrambleWord(w).split('');
      const typed = [];
      let finished = false;
      const row = el('div', 'answer-row');
      const tiles = el('div', 'letter-row');
      const clear = mkBtn('Clear and start again', 'cta card-bg');

      function draw() {
        row.innerHTML = '';
        tiles.innerHTML = '';
        for (let k = 0; k < w.length; k++) {
          const filled = typed[k] !== undefined;
          const slot = mkBtn(filled ? letters[typed[k]] : '', 'slot');
          slot.setAttribute('aria-label', filled
            ? `Letter ${k + 1}: ${letters[typed[k]]}. Tap to remove.`
            : `Empty space ${k + 1}`);
          slot.disabled = !filled || finished;
          slot.onclick = () => { if (!finished && filled) { typed.splice(k); draw(); } };
          row.appendChild(slot);
        }
        letters.forEach((ch, i) => {
          const t = mkBtn(ch, 'letter-tile');
          t.setAttribute('aria-label', `Letter ${ch}`);
          t.disabled = finished || typed.includes(i);
          t.onclick = () => {
            if (finished || typed.length >= w.length) return;
            typed.push(i);
            draw();
            if (typed.length === w.length) {
              finished = true;
              const word = typed.map(j => letters[j]).join('');
              draw();
              done(word === w, word);
            }
          };
          tiles.appendChild(t);
        });
      }

      clear.onclick = () => { if (!finished) { typed.length = 0; draw(); } };
      body.append(row, tiles, clear);
      draw();
    }
  }));
}

function makeRhyme() {
  return pickN(RHYMES, 5).map(r => ({
    prompt: `Which word rhymes with "${r.w}"?`,
    speak: `Which word rhymes with ${r.w}?`,
    answer: `"${r.right}" rhymes with "${r.w}".`,
    tip: 'Rhyming words end with the same sound. Say both words and listen to the very end.',
    build(body, done) {
      hearButton(body, r.w, '🔊 Hear the first word');
      const opts = shuffle([r.right, ...r.wrong]).map(x => ({ label: x }));
      choices(body, opts, opts.findIndex(o => o.label === r.right), done);
    }
  }));
}

const GAMES = [
  { id: 'sounds', name: 'Listen and match', blurb: 'Hear a word, then find it written down.', glyph: '👂', color: 'var(--blue)',
    tip: 'Say the word slowly in your head. Notice the first sound, then the middle, then the last sound. Then look at the choices.', make: makeSounds },
  { id: 'speak', name: 'Say it aloud', blurb: 'Read a word out loud and let your voice check it.', glyph: '🎤', color: 'var(--mint)',
    tip: 'Break the word into small chunks, say each one, then join them together. Slow speech is fine.', make: makeSpeak },
  { id: 'mirror', name: 'Mirror letters', blurb: 'Spot b, d, p, q and other letters that look alike.', glyph: '🔤', color: 'var(--coral)',
    tip: 'Many letters are mirror images. Look at which side the bump is on and which way the tail points.', make: makeMirror },
  { id: 'syllable', name: 'Count the beats', blurb: 'Listen to a word and count how many beats it has.', glyph: '🥁', color: 'var(--yellow)',
    tip: 'Put your hand under your chin and say the word. Each time your chin drops is one beat.', make: makeSyllable },
  { id: 'unscramble', name: 'Unscramble the word', blurb: 'Put the letters in order to spell the picture.', glyph: '🔠', color: 'var(--lilac)',
    tip: 'Start with the first sound of the picture, then find the letter that comes next, one at a time.', make: makeUnscramble },
  { id: 'rhyme', name: 'Rhyme time', blurb: 'Find the word that ends with the same sound.', glyph: '🎵', color: 'var(--pink)',
    tip: 'Rhyming words end with the same sound, like cat and hat. Say both words and listen to the end.', make: makeRhyme }
];

/* ==========================================================================
   7. ROUND FLOW
   ========================================================================== */
function startRound(game) {
  lastGame = game;
  session = { game, qs: game.make(), i: 0, right: 0, misses: [] };
  $('review').hidden = true;
  $('stage').hidden = false;
  $('stageTitle').textContent = game.name;
  renderQuestion();
  $('stage').scrollIntoView({ behavior: settings.calm ? 'auto' : 'smooth', block: 'start' });
  $('stageTitle').focus();
}

function renderQuestion() {
  activePick = null;
  const total = session.qs.length;
  const q = session.qs[session.i];
  $('stageMeta').textContent = `Question ${session.i + 1} of ${total}`;
  $('meterFill').style.width = `${(session.i / total) * 100}%`;
  $('stagePrompt').textContent = q.prompt;
  $('stageFeedback').textContent = '';
  $('stageFeedback').className = 'feedback';
  $('nextBtn').hidden = true;

  const body = $('stageBody');
  body.innerHTML = '';
  let answered = false;
  q.build(body, (ok, chosen) => {
    if (answered) return;
    answered = true;
    onAnswer(q, ok, chosen);
  });

  if (q.speak && settings.autoSpeak) setTimeout(() => speak(q.speak), 400);
}

function onAnswer(q, ok, chosen) {
  recordAnswer('dyslexia', ok);
  if (ok) session.right++;
  else session.misses.push({ prompt: q.prompt, chosen: chosen || 'No answer', answer: q.answer });

  if (!progress.games[session.game.id]) progress.games[session.game.id] = { asked: 0, right: 0, last: null };
  const gp = progress.games[session.game.id];
  gp.asked++;
  progress.asked++;
  if (ok) { gp.right++; progress.right++; progress.stars++; }
  saveJSON('ws.progress', progress);
  updateHeader();

  const fb = $('stageFeedback');
  if (ok) {
    fb.textContent = '✓ That is right. Well done.';
    fb.classList.add('good');
  } else {
    fb.textContent = `Not this time. The answer is: ${q.answer}`;
    fb.classList.add('soft');
    if (settings.autoSpeak) speak(q.answer);
  }

  const last = session.i + 1 >= session.qs.length;
  const next = $('nextBtn');
  next.textContent = last ? 'See my results' : 'Next question';
  next.hidden = false;
  next.focus();
}

$('nextBtn').onclick = () => {
  session.i++;
  if (session.i >= session.qs.length) finishRound();
  else renderQuestion();
};

function finishRound() {
  progress.rounds++;
  progress.games[session.game.id].last = session.right;
  saveJSON('ws.progress', progress);
  updateHeader();
  renderGames();
  renderPanel();
  renderSuggest();

  const total = session.qs.length;
  $('stage').hidden = true;
  $('review').hidden = false;
  $('reviewHead').textContent = session.right === total
    ? 'Brilliant round!'
    : session.right >= 3 ? 'Good practice. Keep going!' : 'Every try builds skill.';
  $('reviewCopy').textContent = `You got ${session.right} of ${total} right in ${session.game.name}. Answers you missed are listed below, so you can look at them again.`;
  $('revRight').textContent = session.right;
  $('revTotal').textContent = total;
  $('revStars').textContent = progress.stars;
  $('revTip').textContent = session.game.tip;

  const box = $('missBox');
  box.innerHTML = '';
  if (session.misses.length === 0) {
    box.appendChild(el('p', '', 'Clean run! Every answer was right.'));
  } else {
    box.appendChild(el('h3', '', 'Answers to look at again'));
    session.misses.forEach(m => {
      const card = el('div', 'miss');
      card.append(
        el('b', '', m.prompt),
        el('small', '', `You chose: ${m.chosen}`),
        el('p', '', `Correct answer: ${m.answer}`)
      );
      box.appendChild(card);
    });
  }
  $('reviewHead').focus();
}

$('stopBtn').onclick = () => {
  session = null;
  activePick = null;
  $('stage').hidden = true;
  if (hasSpeech) speechSynthesis.cancel();
};

$('againBtn').onclick = () => { if (lastGame) startRound(lastGame); };
$('otherBtn').onclick = () => {
  $('review').hidden = true;
  $('play').scrollIntoView({ behavior: 'smooth' });
};

// Keys 1 to 4 pick an answer while a question is open.
window.addEventListener('keydown', e => {
  if (!activePick || $('stage').hidden) return;
  if (['1', '2', '3', '4'].includes(e.key)) activePick(Number(e.key) - 1);
});

/* ==========================================================================
   8. PLAY PAGE RENDERING
   ========================================================================== */
function renderGames() {
  const grid = $('gamesGrid');
  grid.innerHTML = '';
  GAMES.forEach(g => {
    const gp = progress.games[g.id];
    const b = mkBtn('', 'tile');
    b.style.setProperty('--c', g.color);
    b.setAttribute('aria-pressed', String(g.id === selectedId));
    b.append(
      el('span', 'ico', g.glyph),
      el('b', '', g.name),
      el('small', '', g.blurb),
      el('small', 'status', gp && gp.last != null ? `Last round: ${gp.last} of 5 right` : 'Not played yet')
    );
    b.onclick = () => { selectedId = g.id; renderGames(); renderPanel(); };
    grid.appendChild(b);
  });
}

function renderPanel() {
  const g = GAMES.find(x => x.id === selectedId);
  const gp = progress.games[g.id];
  $('panelName').textContent = g.name;
  $('panelBlurb').textContent = g.blurb;
  $('panelLast').textContent = gp ? `You have answered ${gp.asked} questions in this game.` : 'You have not played this game yet.';
  $('voiceNote').textContent = SR
    ? 'Voice answers are on. Your browser will ask to use the microphone the first time.'
    : 'Voice answers are not supported in this browser. You can tap your answers instead.';
}

function renderSuggest() {
  const g = GAMES.slice().sort((a, b) =>
    ((progress.games[a.id] || {}).asked || 0) - ((progress.games[b.id] || {}).asked || 0))[0];
  $('suggestCopy').textContent = `Try ${g.name} next. It is the game you have practised least, so it is a good place to build up.`;
  $('suggestBtn').onclick = () => { selectedId = g.id; renderGames(); renderPanel(); startRound(g); };
}

$('startBtn').onclick = () => startRound(GAMES.find(x => x.id === selectedId));

/* ==========================================================================
   9. BOOT
   ========================================================================== */
applySettings();
updateHeader();
renderGames();
renderPanel();
renderSuggest();

/* Called by the page when this section is shown or hidden. */
function activate() {
  active = true;
  // Text size is a page-wide setting while this section is open.
  document.documentElement.style.fontSize = `calc(16px * ${SIZES[settings.size].v})`;
}
function deactivate() {
  active = false;
  document.documentElement.style.fontSize = '';
  if (hasSpeech) speechSynthesis.cancel();
  try { if (recognizer) recognizer.abort(); } catch (e) {}
  if (!$('stage').hidden) $('stopBtn').click();
}
return { activate, deactivate };
}
