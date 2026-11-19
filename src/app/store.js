import { configureStore } from '@reduxjs/toolkit';
import queue, { initialState } from '../features/queue/queueSlice';
import ui from '../features/ui/uiSlice';
export const KEY = 'rq_state';
// Returns persisted queue state, or undefined if missing/corrupted.
export const load = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s || !Array.isArray(s.items) || !s.items.every((i) => i && typeof i.name === 'string' && typeof i.reason === 'string')) return undefined;
    return { queue: { ...initialState, items: s.items, counter: Number(s.counter) || 0 } };
  } catch { return undefined; }
};
export const makeStore = (preloadedState) => configureStore({ reducer: { queue, ui }, preloadedState });
export const persist = (store) => store.subscribe(() => {
  try { const { items, counter } = store.getState().queue; localStorage.setItem(KEY, JSON.stringify({ items, counter })); } catch { /* storage unavailable */ }
});
