import { createSlice, createAsyncThunk, isPending, isFulfilled } from '@reduxjs/toolkit';
import { request } from './queueApi';
import { sortQueue } from './queueSelectors';
import { sanitize } from '../../utils/sanitize';
import { track } from '../../utils/analytics';

const PRIORITIES = ['Routine', 'Urgent', 'Emergency'];
export const addPatient = createAsyncThunk('queue/add', async (p) => {
  await request();
  track('add patient');
  const now = Date.now();
  // Sanitized here, before anything reaches the store.
  return { id: `p-${now}-${Math.random().toString(36).slice(2, 7)}`, name: sanitize(p.name), reason: sanitize(p.reason),
    priority: PRIORITIES.includes(p.priority) ? p.priority : 'Routine', createdAt: now };
});
export const callNext = createAsyncThunk('queue/callNext', async () => { await request(); track('call next'); return Date.now(); });
export const completePatient = createAsyncThunk('queue/complete', async (id) => { await request(); track('complete'); return id; });
export const removePatient = createAsyncThunk('queue/remove', async (id) => { await request(); track('remove'); return id; });
const thunks = { add: addPatient, next: callNext, complete: completePatient, remove: removePatient };

export const initialState = { items: [], counter: 0, status: 'idle', error: null, failed: null };
const slice = createSlice({
  name: 'queue', initialState,
  reducers: { clearError: (s) => { s.error = null; s.failed = null; } },
  extraReducers: (b) => {
    b.addCase(addPatient.fulfilled, (s, a) => { s.counter += 1; s.items.push({ ...a.payload, queueNumber: s.counter, status: 'waiting' }); })
      .addCase(callNext.fulfilled, (s, a) => {
        const next = sortQueue(s.items.filter((i) => i.status === 'waiting'))[0];
        if (next) { next.status = 'in-consultation'; next.calledAt = a.payload; }
      })
      .addCase(completePatient.fulfilled, (s, a) => { const p = s.items.find((i) => i.id === a.payload); if (p) p.status = 'completed'; })
      .addCase(removePatient.fulfilled, (s, a) => { s.items = s.items.filter((i) => i.id !== a.payload); });
    Object.entries(thunks).forEach(([kind, t]) =>
      b.addCase(t.rejected, (s, a) => { s.status = 'idle'; s.error = a.error.message; s.failed = { kind, arg: a.meta.arg }; }));
    b.addMatcher(isPending(...Object.values(thunks)), (s) => { s.status = 'loading'; s.error = null; })
      .addMatcher(isFulfilled(...Object.values(thunks)), (s) => { s.status = 'idle'; });
  },
});
export const { clearError } = slice.actions;
export const retryFailed = () => (dispatch, getState) => {
  const f = getState().queue.failed;
  if (!f) return undefined;
  dispatch(clearError());
  return dispatch(thunks[f.kind](f.arg));
};
export default slice.reducer;
