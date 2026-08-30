import { isValidDate } from './dates.js';
import { badRequest } from './errors.js';

export function requireDate(value, field) {
  if (!isValidDate(value)) {
    throw badRequest('INVALID_INPUT', `${field} must be a calendar date in YYYY-MM-DD format`, { field, value });
  }
  return value;
}

export function requireInt(value, field, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest('INVALID_INPUT', `${field} must be an integer between ${min} and ${max}`, { field, value });
  }
  return n;
}

export function requireString(value, field, { maxLength = 200 } = {}) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > maxLength) {
    throw badRequest('INVALID_INPUT', `${field} must be a non-empty string of at most ${maxLength} characters`, { field });
  }
  return value.trim();
}
