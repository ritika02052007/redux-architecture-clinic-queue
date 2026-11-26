import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPatient, callNext, completePatient, removePatient, retryFailed, clearError } from '../features/queue/queueSlice';
import { selectVisible, selectStats } from '../features/queue/queueSelectors';
import { setSearch, setPriority, setStatus } from '../features/ui/uiSlice';
import { validate } from '../utils/validate';

const useNow = (ms) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
};
export const useOnline = () => {
  const [on, setOn] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true); const down = () => setOn(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return on;
};

export const Header = () => {
  const now = new Date(useNow(1000));
  return (
    <header className="hero">
      <h1>Redux Architecture | Clinic Queue</h1>
      <p className="clock">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}, {now.toLocaleTimeString()}</p>
    </header>
  );
};

export const Spinner = () => <div className="spinner-wrap" role="status"><span className="spinner" aria-hidden="true" />Saving changes…</div>;
export const EmptyState = ({ hint }) => <div className="empty"><strong>No data found</strong><p>{hint}</p></div>;

export const StatsBar = () => {
  const s = useSelector(selectStats);
  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
  return (
    <section className="card" aria-label="Queue statistics">
      <dl className="stats">
        <div><dt>Waiting</dt><dd>{s.waiting}</dd></div>
        <div><dt>In consultation</dt><dd>{s.consulting}</dd></div>
        <div><dt>Completed today</dt><dd>{s.done}</dd></div>
        <div><dt>Average wait</dt><dd>{s.avg === null ? '—' : `${s.avg} min`}</dd></div>
      </dl>
      <div className="bar" role="progressbar" aria-label="Share of patients completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
    </section>
  );
};

export const PatientForm = () => {
  const dispatch = useDispatch();
  const [f, setF] = useState({ name: '', reason: '', priority: 'Routine' });
  const [errors, setErrors] = useState({});
  const refs = { name: useRef(null), reason: useRef(null) };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    const first = ['name', 'reason'].find((k) => errs[k]);
    if (first) return refs[first].current.focus();
    dispatch(addPatient(f));
    setF({ name: '', reason: '', priority: 'Routine' });
  };
  const field = (k, label) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} ref={refs[k]} value={f[k]} onChange={set(k)} aria-invalid={errors[k] ? 'true' : 'false'} aria-describedby={errors[k] ? `${k}-err` : undefined} className={errors[k] ? 'invalid' : ''} />
      {errors[k] && <span id={`${k}-err`} className="err">{errors[k]}</span>}
    </div>
  );
  return (
    <form className="card" onSubmit={submit} noValidate aria-label="Add patient">
      <h2>Add patient</h2>
      {field('name', 'Full name')}
      {field('reason', 'Reason for visit')}
      <div className="field">
        <label htmlFor="priority">Priority</label>
        <select id="priority" value={f.priority} onChange={set('priority')}><option>Routine</option><option>Urgent</option><option>Emergency</option></select>
      </div>
      <button type="submit" className="btn primary">Add to queue</button>
    </form>
  );
};

export const SearchFilterBar = () => {
  const dispatch = useDispatch();
  const ui = useSelector((s) => s.ui);
  return (
    <div className="filters" role="search">
      <div className="field"><label htmlFor="search">Search patients</label><input id="search" value={ui.search} onChange={(e) => dispatch(setSearch(e.target.value))} /></div>
      <div className="field"><label htmlFor="fp">Filter by priority</label>
        <select id="fp" value={ui.priority} onChange={(e) => dispatch(setPriority(e.target.value))}><option value="all">All</option><option>Routine</option><option>Urgent</option><option>Emergency</option></select></div>
      <div className="field"><label htmlFor="fs">Filter by status</label>
        <select id="fs" value={ui.status} onChange={(e) => dispatch(setStatus(e.target.value))}><option value="all">All</option><option value="waiting">Waiting</option><option value="in-consultation">In consultation</option><option value="completed">Completed</option></select></div>
    </div>
  );
};

const LABEL = { waiting: 'Waiting', 'in-consultation': 'In consultation', completed: 'Completed' };
export const QueueCard = ({ p, index, now }) => {
  const dispatch = useDispatch();
  const mins = Math.max(0, Math.round(((p.calledAt || now) - p.createdAt) / 60000));
  return (
    <li className="qcard" style={{ '--i': index }}>
      <span className="qnum" aria-label={`Queue number ${p.queueNumber}`}>#{p.queueNumber}</span>
      <div className="qbody"><strong>{p.name}</strong><span>{p.reason}</span><small>{LABEL[p.status]} · {mins} min wait</small></div>
      <span className={`pill ${p.priority.toLowerCase()}`}>{p.priority}</span>
      <div className="qactions">
        {p.status === 'in-consultation' && <button className="btn" onClick={() => dispatch(completePatient(p.id))} aria-label={`Complete ${p.name}`}>Complete</button>}
        <button className="btn ghost" onClick={() => dispatch(removePatient(p.id))} aria-label={`Remove ${p.name}`}>Remove</button>
      </div>
    </li>
  );
};

export const QueueList = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectVisible);
  const total = useSelector((s) => s.queue.items.length);
  const loading = useSelector((s) => s.queue.status === 'loading');
  const now = useNow(30000);
  return (
    <section aria-label="Patient queue">
      <div className="qhead"><h2>Queue</h2><button className="btn primary" disabled={loading} onClick={() => dispatch(callNext())}>Call next patient</button></div>
      <SearchFilterBar />
      {loading && <Spinner />}
      {items.length === 0
        ? <EmptyState hint={total ? 'Try a different search or filter.' : 'Add the first patient using the form.'} />
        : <ul className="qlist">{items.map((p, i) => <QueueCard key={p.id} p={p} index={i} now={now} />)}</ul>}
    </section>
  );
};

export const Toast = () => {
  const dispatch = useDispatch();
  const error = useSelector((s) => s.queue.error);
  return (
    <div className="toasts" aria-live="polite">
      {error && (
        <div className="toast"><span>{error}. Your queue is unchanged.</span>
          <button className="btn" onClick={() => dispatch(retryFailed())}>Retry</button>
          <button className="btn ghost" onClick={() => dispatch(clearError())} aria-label="Dismiss message">Dismiss</button></div>
      )}
    </div>
  );
};
