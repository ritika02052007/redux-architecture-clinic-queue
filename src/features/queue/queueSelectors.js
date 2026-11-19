import { createSelector } from '@reduxjs/toolkit';
const rank = { Emergency: 0, Urgent: 1, Routine: 2 };
export const sortQueue = (items) => [...items].sort((a, b) => rank[a.priority] - rank[b.priority] || a.createdAt - b.createdAt);
export const selectVisible = createSelector([(s) => s.queue.items, (s) => s.ui], (items, { search, priority, status }) => {
  const q = search.toLowerCase();
  return sortQueue(items).filter((p) =>
    (!q || p.name.toLowerCase().includes(q) || p.reason.toLowerCase().includes(q)) &&
    (priority === 'all' || p.priority === priority) && (status === 'all' || p.status === status));
});
export const selectStats = createSelector([(s) => s.queue.items], (items) => {
  const waiting = items.filter((p) => p.status === 'waiting').length;
  const consulting = items.filter((p) => p.status === 'in-consultation').length;
  const done = items.filter((p) => p.status === 'completed').length;
  const called = items.filter((p) => p.calledAt);
  const avg = called.length ? Math.round(called.reduce((n, p) => n + (p.calledAt - p.createdAt), 0) / called.length / 60000) : null;
  return { waiting, consulting, done, avg, total: items.length };
});
