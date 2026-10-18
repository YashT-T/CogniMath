# CogniMath

A playful one-minute practice game. Pick a topic and a format, race a saved "ghost" run, then get every missed question explained and a short plan for what to practise next.

This is a prototype. It is **not** an IQ test and does not diagnose anything.

## Run it

```bash
npm install
npm run dev        # API on :3001, app on http://localhost:5173
```

Production: `npm run build && npm start` (Express serves the built app on :3001).

## One page, four practice spaces

The page opens on a chooser. Pick a space and only that space is shown; the others stay loaded but hidden, so each keeps its own progress and settings. The choice is saved in the URL (`#dyslexia`) and in the browser.

| Space | What it is | Where progress lives |
|---|---|---|
| Everyone | The original CogniMath one-minute sprints and Progress view | Server (`server/data.json`) |
| Dyslexia-friendly | WordSpark: six word and sound games, read-aloud, voice answers, text size, reduce motion | Browser (`ws.*` keys) |
| Dyscalculia-friendly | NeuroFlow: six number-sense games, warm-up quest, blocks / pictures / numbers, comfort settings | Browser (`neuroflow_dyscalculia_v1`) |
| Autism-friendly | Seven calm topics, untimed format, low or high stimulation, avatar shop | Browser (`cm.neuroflow_state`); finished rounds are also sent to `/api/sprints` with `section: "autism"` |

## Project structure

```
server/index.js                      Express API + static hosting
src/main.jsx, App.jsx                Entry point, intro, section chooser, the four spaces, footer
src/shell.css                        Shared design tokens, header and chooser styles
src/intro.css                        Splash animation (every selector starts with .intro)
src/components/Intro.jsx             Stick-figure splash (once per tab session)
src/lib/                             Question bank, review builder and formats for the Everyone space
src/sections/everyone/               Everyone.jsx (Play / Progress switch), Play, Progress, Game, WelcomeBack, everyone.css
src/sections/dyslexia/               Dyslexia.jsx (markup), mountDyslexia.js (games), dyslexia.css
src/sections/dyscalculia/            Dyscalculia.jsx (markup), engine.js (games), dyscalculia.css
src/sections/autism/                 Autism.jsx (markup), mountAutism.js (games), autism.css
```

### How the spaces stay apart

- **CSS:** each space's stylesheet is nested under its own class (`.sec-everyone`, `.sec-dyslexia`, `.sec-dyscalculia`, `.sec-autism`), so `.tile`, `.opt`, `.bar` and friends can mean different things in each space without clashing. Page-wide tokens live in `src/shell.css`.
- **Ids:** every element id is prefixed (`dy-`, `dc-`, `au-`) because the game code finds its elements by id.
- **Mode classes:** low stimulation, high stimulation, palettes and reduce motion are applied to the space's own root, not to `<body>`.
- **Leaving a space:** its timers, speech, audio and dialogs are stopped. Text size (dyslexia) is only applied while that space is open.
- **Server data:** `/api/progress` returns the Everyone space by default; pass `?section=autism` for the other.

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/sprints` | Save a finished sprint: `topic, mode, score, ghost, n, ok, tags` and optional `section` (default `everyone`) |
| GET | `/api/progress?section=everyone` | Totals, per-topic accuracy, per-skill misses, last 8 sprints for one space |

## How it plays

1. Pick a topic (or "Surprise me") and a format.
2. **Find my opponent** simulates checking for a live player, then falls back to a saved ghost.
3. **Score Rush:** answer as many as you can in 60 seconds, one point each.
4. **Quickdraw:** each question is a race; be correct before the ghost to take the point.
5. Answers lock instantly (click or keys 1-4). Explanations are held back until the sprint ends.
6. The review shows pace feedback, the skills to work on with a specific tip each, and every miss with the correct answer and why.

### Topics

| Topic | Content |
|---|---|
| Differentials | Power, chain and product rules, standard derivatives (generated) |
| Critical thinking | Causation, sampling, source reliability, false dilemmas (10 fixed questions) |
| Logical reasoning | Ordering, letter codes, deduction, growing gaps (generated) |
| Everyday maths | Discounts, speed, rates, ratios, percentage change (generated) |
| Grammar | Agreement, confused words, apostrophes, punctuation (12 fixed questions) |
| Pattern puzzles | Arithmetic, geometric, square, Fibonacci-style, interleaved, symbol cycles (generated) |

**No repeats:** a question never appears twice in one sprint. The last 80 questions are remembered in the browser and avoided where possible. Fixed pools are small, so add more questions to avoid cross-sprint repeats there.

## Design

- **Tone:** friendly, lively, encouraging. No shaming for wrong answers.
- **Look:** bold colour tiles with thick ink outlines and hard offset shadows; selected items "press in".
- **Palette:** ink `#20213b`, paper `#f7f6f1`, violet `#5b4ae1`, yellow `#ffdc72`, coral `#ff927c`, mint `#baf3d5`, blue `#a9d8ff`.
- **Type:** Bricolage Grotesque for headings, system sans-serif for body.
- **Layout:** two pages (Play, Progress). Play is two columns on desktop and one on mobile. The game is a modal dialog.
- **Accessibility:** visible focus, native dialog focus handling and Esc, keyboard answers (1-4), colour never the only signal (tick and cross icons), reduced-motion respected.

## Limitations

- Opponents, ratings and ghost runs are sample data. There is no live matchmaking.
- No accounts: progress is one shared file on the server (`server/data.json`).
- Question content should be reviewed for correctness and difficulty before real use.
- Wrong-answer feedback is authored, not AI-evaluated.

## Wording

Prefer: "practice progress", "matched with a saved ghost run", "try a smaller step".
Avoid: "IQ score", "detects ADHD/autism/dyscalculia", "real player matched" (unless one really was).

## Next steps

- **P0** Click through every topic in both formats; test at mobile width.
- **P1** More fixed questions for Grammar and Critical thinking.
- **P2** Per-user accounts; transparent difficulty adaptation; review scheduling for weak skills.
- **P3** Real ratings, saved ghost event streams replayed deterministically, live matching.
- **P4** Untimed mode, larger text, high contrast, sound toggle, screen-reader announcements for timer and feedback.
- **P5** Convert to TypeScript (`.tsx`) once the structure settles.

## Intro animation and welcome-back reminder

- `src/components/Intro.jsx` plays a stick figure holding a "CM" sign. Maths symbols (+ − × ÷) float out, then the sign zooms open into the app. It plays once per tab session, has a Skip button, and is skipped when the device asks for reduced motion.
- `src/components/WelcomeBack.jsx` stores the last visit in the browser (`cm.last`). If you return after 3 or more days (`AWAY_DAYS`), an in-app banner shows your sprints, accuracy, best score and the skill most worth revisiting.
- Test it: in the browser console run `localStorage.setItem('cm.last', Date.now() - 4*864e5)`, then reload.
- Limit: this appears when the user opens the app. Sending a system notification while the app is closed needs Web Push (a service worker, VAPID keys and a scheduled server job). Not built yet.
