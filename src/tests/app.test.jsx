import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import App from '../App';
import { makeStore, load, KEY } from '../app/store';
import { addPatient, callNext } from '../features/queue/queueSlice';
import { sortQueue } from '../features/queue/queueSelectors';
import { sanitize } from '../utils/sanitize';
import { validate } from '../utils/validate';
import * as api from '../features/queue/queueApi';

vi.mock('../features/queue/queueApi', () => ({ request: vi.fn(() => Promise.resolve()) }));
const setup = () => { const store = makeStore(); render(<Provider store={store}><App /></Provider>); return store; };
beforeEach(() => { vi.clearAllMocks(); vi.spyOn(console, 'log').mockImplementation(() => {}); });

describe('utils', () => {
  it('sanitizes scripts, handlers and javascript: urls', () => {
    expect(sanitize('<script>alert(1)</script>Ann')).toBe('Ann');
    expect(sanitize('<img src=x onerror=alert(1)>Bob')).toBe('Bob');
    expect(sanitize('javascript:alert(1)')).not.toMatch(/javascript:/i);
  });
  it('validates empty, short, symbols-only and valid input', () => {
    expect(validate({ name: '', reason: '' })).toHaveProperty('name');
    expect(validate({ name: 'A', reason: 'ok' })).toHaveProperty('name');
    expect(validate({ name: '!!!', reason: 'Cough' })).toHaveProperty('name');
    expect(validate({ name: 'Jane', reason: 'Cough' })).toEqual({});
  });
  it('falls back safely on corrupted storage', () => { localStorage.setItem(KEY, '{bad'); expect(load()).toBeUndefined(); });
});

describe('queue logic', () => {
  it('sorts emergency before urgent before routine, then by arrival', () => {
    const out = sortQueue([{ priority: 'Routine', createdAt: 1 }, { priority: 'Emergency', createdAt: 3 }, { priority: 'Urgent', createdAt: 2 }]);
    expect(out.map((p) => p.priority)).toEqual(['Emergency', 'Urgent', 'Routine']);
  });
  it('calls the highest-priority waiting patient', async () => {
    const store = makeStore();
    await store.dispatch(addPatient({ name: 'Routine Rae', reason: 'Checkup', priority: 'Routine' }));
    await store.dispatch(addPatient({ name: 'Emergency Em', reason: 'Chest pain', priority: 'Emergency' }));
    await store.dispatch(callNext());
    const byName = (n) => store.getState().queue.items.find((p) => p.name === n);
    expect(byName('Emergency Em').status).toBe('in-consultation');
    expect(byName('Routine Rae').status).toBe('waiting');
  });
  it('stores sanitized text only', async () => {
    const store = makeStore();
    await store.dispatch(addPatient({ name: '<b>Zed</b>', reason: '<script>x</script>Fever', priority: 'Urgent' }));
    expect(store.getState().queue.items[0]).toMatchObject({ name: 'Zed', reason: 'Fever' });
  });
});

describe('UI', () => {
  it('shows "No data found" for an empty queue', () => { setup(); expect(screen.getByText('No data found')).toBeInTheDocument(); });
  it('blocks invalid submit, marks fields invalid, adds nothing', async () => {
    const store = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add to queue' }));
    expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Reason for visit is required')).toBeInTheDocument();
    expect(store.getState().queue.items).toHaveLength(0);
  });
  it('adds a patient and logs analytics', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Full name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Reason for visit'), 'Fever');
    await userEvent.click(screen.getByRole('button', { name: 'Add to queue' }));
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[Analytics] User interacted with Redux Architecture'));
  });
  it('shows "No data found" when search has no match', async () => {
    const store = setup();
    await store.dispatch(addPatient({ name: 'Jane Doe', reason: 'Fever', priority: 'Routine' }));
    await userEvent.type(screen.getByLabelText('Search patients'), 'zzz');
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });
  it('shows a loading indicator while a request is pending', async () => {
    api.request.mockImplementationOnce(() => new Promise(() => {}));
    const store = setup();
    store.dispatch(callNext());
    expect(await screen.findByRole('status')).toHaveTextContent(/saving/i);
  });
  it('shows an error with Retry on failure and keeps data intact', async () => {
    api.request.mockRejectedValueOnce(new Error('Network error'));
    const store = setup();
    await store.dispatch(addPatient({ name: 'Jane Doe', reason: 'Fever', priority: 'Routine' }));
    expect(await screen.findByText(/Network error/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  });
  it('exposes labelled, keyboard-reachable controls', () => {
    setup();
    ['Full name', 'Reason for visit', 'Priority', 'Search patients'].forEach((l) => expect(screen.getByLabelText(l)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Call next patient' })).toBeInTheDocument();
  });
});
