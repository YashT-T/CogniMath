import { useEffect, useReducer } from 'react';
import { EVT, status } from './rewards.js';

/* Re-renders when rewards change (any component, any tab) or when the tab becomes visible again,
   so "today's chest" appears after midnight without a reload. */
export default function useRewards() {
  const [, bump] = useReducer(x => x + 1, 0);
  useEffect(() => {
    const vis = () => { if (!document.hidden) bump(); };
    addEventListener(EVT, bump);
    document.addEventListener('visibilitychange', vis);
    return () => { removeEventListener(EVT, bump); document.removeEventListener('visibilitychange', vis); };
  }, []);
  return status();
}
export const openRewards = tab => dispatchEvent(new CustomEvent('cm:open-rewards', { detail: tab || 'streak' }));
