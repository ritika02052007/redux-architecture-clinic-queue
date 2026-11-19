import { sanitize } from './sanitize';
const check = (value, label) => {
  const t = sanitize(value);
  if (!t) return `${label} is required`;
  if (t.length < 2) return `${label} is too short`;
  if (t.length > 80) return `${label} is too long`;
  if (!/[\p{L}\p{N}]/u.test(t)) return `${label} must contain letters or numbers`;
  return '';
};
export const validate = ({ name, reason }) => {
  const errors = {};
  const n = check(name, 'Full name');
  const r = check(reason, 'Reason for visit');
  if (n) errors.name = n;
  if (r) errors.reason = r;
  return errors;
};
