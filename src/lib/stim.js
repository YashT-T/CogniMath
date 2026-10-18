/* One low/high stimulant setting shared by the Autism and Dyscalculia spaces (and the stickman coach).
   Low = still, soft colours, no motion, quiet sounds. High = glow, bounce, shake and brighter sounds. Default is low. */
const K = 'cm.stim';
/* The mode is also written on <html data-stim="low|high"> so the CSS reacts no matter which section is mounted. */
const mark = low => { try { document.documentElement.dataset.stim = low ? 'low' : 'high'; } catch (e) {} };
export const isLow = () => { try { return localStorage.getItem(K) !== 'high'; } catch (e) { return true; } };
export function setLow(low) {
  try { localStorage.setItem(K, low ? 'low' : 'high'); } catch (e) {}
  mark(low);
  dispatchEvent(new CustomEvent('cm:stim', { detail: !!low }));
}
mark(isLow());
export const onStim = fn => { const h = e => fn(e.detail); addEventListener('cm:stim', h); return () => removeEventListener('cm:stim', h); };
export const stimLabel = low => (low ? '🌿 Low stimulant' : '⚡ High stimulant');
export const stimNote = low => (low
  ? 'Low stimulant: still shapes, softer colours, no motion, quieter sounds. Intro text is hidden to keep the screen calm.'
  : 'High stimulant: stronger contrast, bigger easier-to-read text, blocks that jump when you point at them, and brighter sounds.');
