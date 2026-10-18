import { useEffect, useRef, useState } from 'react';

/* What each space practises, and how it is meant to help. The stick figure walks through the exercises. */
export const HOW = {
  everyone: {
    name: 'Everyone',
    helps: 'Short, timed rounds build quick recall, attention and calm decision-making. Every miss is explained, so mistakes turn into something you can learn from.',
    steps: [
      ['Read the question', 'Short questions train attention and working memory.'],
      ['Choose under a timer', 'Answering under a gentle time limit builds speed with accuracy.'],
      ['Learn from each miss', 'The review shows why an answer was wrong, so next time is easier.']
    ]
  },
  dyslexia: {
    name: 'Dyslexia-friendly',
    helps: 'Reading relies on linking sounds to letters. These games practise hearing, saying and matching sounds, with read-aloud and voice answers.',
    steps: [
      ['Hear the sound', 'Listen to a word, then find it written down.'],
      ['Say it out loud', 'Speaking a word links its sounds to its spelling.'],
      ['Spot look-alike letters', 'Tell apart b, d, p and q by which way the bump and tail face.'],
      ['Count the beats', 'Counting syllables builds the sound awareness reading needs.'],
      ['Rhyme and unscramble', 'Rhymes and spelling games strengthen word patterns.']
    ]
  },
  dyscalculia: {
    name: 'Dyscalculia-friendly',
    helps: 'Number sense is built step by step: seeing small quantities, placing numbers, and understanding tens and ones. There is no timer.',
    steps: [
      ['See a few dots', 'Count small groups quickly, then check what you saw.'],
      ['Place numbers on a line', 'A number line shows where each number belongs.'],
      ['Build with tens and ones', 'Blocks make place value visible.'],
      ['Compare and order', 'Deciding which number is bigger builds sense of size.'],
      ['Skip count in steps', 'Counting in steps prepares you for multiplication.']
    ]
  },
  autism: {
    name: 'Autism-friendly',
    helps: 'Predictable, untimed practice in a calm setting. Pattern puzzles, everyday situations and short maths tasks, with low or high stimulation to suit you.',
    steps: [
      ['Spot the pattern', 'Remember a grid of tiles, then find the same pattern.'],
      ['Work out the sum', 'Add up beats and numbers at your own pace.'],
      ['Read the situation', 'Match an everyday scene to how someone might feel.'],
      ['Finish at your pace', 'No clock. Stop, pause and come back whenever you like.']
    ]
  }
};

const POSES = [-60, -15, -100, 25, -80];   // right-arm angles, one per step

export default function HowItHelps({ section, open, onClose }) {
  const dlg = useRef(null);
  const [step, setStep] = useState(0);
  const info = HOW[section];

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); setStep(0); }
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open || !info) return;
    const t = setInterval(() => setStep(s => (s + 1) % info.steps.length), 3200);
    return () => clearInterval(t);
  }, [open, section]);

  if (!info) return null;
  const [title, text] = info.steps[step];
  const arm = POSES[step % POSES.length];

  return (
    <dialog ref={dlg} className="how" aria-labelledby="how-title" onClose={onClose} onCancel={onClose}>
      <div className="how-top">
        <div>
          <small>How {info.name} helps</small>
          <h2 id="how-title">{info.name} practice</h2>
        </div>
        <button type="button" className="how-x" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <p className="how-helps">{info.helps}</p>

      <div className="how-stage" aria-hidden="true">
        <svg viewBox="0 0 300 220" className="how-man">
          <line x1="70" y1="206" x2="230" y2="206" className="how-ground" />
          <circle cx="150" cy="58" r="18" className="how-s" />
          <line x1="150" y1="76" x2="150" y2="138" className="how-s" />
          <line x1="150" y1="138" x2="128" y2="200" className="how-s" />
          <line x1="150" y1="138" x2="172" y2="200" className="how-s" />
          <line x1="150" y1="96" x2="118" y2="122" className="how-s" />
          <g className="how-arm" style={{ '--ar': arm + 'deg' }}>
            <line x1="150" y1="96" x2="190" y2="110" className="how-s" />
            <line x1="190" y1="110" x2="182" y2="82" className="how-s" />
          </g>
          <g className="how-board" key={step}>
            <rect x="200" y="22" width="90" height="46" rx="10" className="how-b" />
            <text x="245" y="52" textAnchor="middle" className="how-bt">{step + 1}/{info.steps.length}</text>
          </g>
        </svg>
        <div className="how-bubble" key={'b' + step}>
          <b>{title}</b>
          <span>{text}</span>
        </div>
      </div>

      <div className="how-dots" role="group" aria-label="Choose a step">
        {info.steps.map((_, i) => (
          <button key={i} type="button" aria-label={`Step ${i + 1}`} aria-pressed={i === step}
            onClick={() => setStep(i)} />
        ))}
      </div>

      <p className="how-note">Practice builds skills. It does not treat or diagnose any condition. For support, speak to a teacher or specialist.</p>
    </dialog>
  );
}
