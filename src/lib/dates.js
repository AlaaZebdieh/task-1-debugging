const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function toUTC(value) {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

const DAY = 86400000;

export function addDays(value, n) {
  return new Date(toUTC(value) + n * DAY).toISOString().slice(0, 10);
}

export function diffDays(from, to) {
  return Math.round((toUTC(to) - toUTC(from)) / DAY);
}

/** Whether date d falls in [start, end). */
export function dateInRange(date, start, end) {
  return start <= date && date < end;
}

/** Whether [aStart, aEnd) and [bStart, bEnd) share at least one date. */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

/** Nights actually slept: [checkIn, checkOut). The departure date is not a night. */
export function enumerateNights(checkIn, checkOut) {
  const nights = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) nights.push(d);
  return nights;
}

export function maxDate(a, b) { return a > b ? a : b; }
export function minDate(a, b) { return a < b ? a : b; }
