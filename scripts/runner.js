/**
 * Executes one fixture case against a running server and reduces the response
 * to a single comparable string. Used by `npm run verify`.
 */
const json = async (base, path, init) => {
  const res = await fetch(base + path, init);
  let body = null;
  try { body = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body };
};

const post = (base, path, payload) =>
  json(base, path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });

const patch = (base, path, payload) =>
  json(base, path, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });

const statusClass = (status) => `status=${Math.floor(status / 100)}xx`;

const sumMoney = (values) =>
  (values.reduce((total, value) => total + Math.round(Number(value) * 100), 0) / 100).toFixed(2);

export const KIND_ORDER = ['QUOTE', 'PREVIEW', 'AVAIL', 'FORECAST', 'EXTEND', 'CREATE', 'CREATE_GUESTS', 'CREATE_LONG'];

export async function runCase(base, testCase) {
  const { kind, roomTypeId, a, b } = testCase;

  if (kind === 'QUOTE') {
    const { status, body } = await post(base, '/quotes', { roomTypeId, checkIn: a, checkOut: b });
    if (status !== 200) return statusClass(status);
    return `nights=${body.nights.length};total=${body.total}`;
  }

  if (kind === 'PREVIEW') {
    const { status, body } = await json(base, `/rates/preview?roomTypeId=${roomTypeId}&from=${a}&to=${b}`);
    if (status !== 200) return statusClass(status);
    return `nights=${body.nights.length};sum=${sumMoney(body.nights.map((n) => n.rate))}`;
  }

  if (kind === 'AVAIL') {
    const { status, body } = await json(base, `/availability?roomTypeId=${roomTypeId}&checkIn=${a}&checkOut=${b}`);
    if (status !== 200) return statusClass(status);
    const entry = body.roomTypes[0];
    return `available=${entry.available};total=${entry.quotedTotal}`;
  }

  if (kind === 'FORECAST') {
    const { status, body } = await json(base, `/housekeeping/forecast?from=${a}&to=${b}`);
    if (status !== 200) return statusClass(status);
    const counts = Object.values(body.occupancy);
    return `nights=${counts.length};peak=${Math.max(...counts)};sum=${counts.reduce((x, y) => x + y, 0)}`;
  }

  if (kind === 'EXTEND') {
    const { status } = await patch(base, `/reservations/${roomTypeId}`, { checkIn: a, checkOut: b });
    return statusClass(status);
  }

  if (kind === 'CREATE') {
    const before = await json(base, `/availability?roomTypeId=${roomTypeId}&checkIn=${a}&checkOut=${b}`);
    const available = before.status === 200 ? before.body.roomTypes[0].available : 'error';
    const created = await post(base, '/reservations', {
      guestName: 'Fixture Guest',
      roomTypeId,
      checkIn: a,
      checkOut: b,
      guests: 1
    });
    return `available=${available};create=${statusClass(created.status)}`;
  }

  if (kind === 'CREATE_GUESTS') {
    const { status } = await post(base, '/reservations', {
      guestName: 'Fixture Guest',
      roomTypeId,
      checkIn: a,
      checkOut: b,
      guests: 9
    });
    return statusClass(status);
  }

  if (kind === 'CREATE_LONG') {
    const { status } = await post(base, '/reservations', {
      guestName: 'Fixture Guest',
      roomTypeId,
      checkIn: a,
      checkOut: b,
      guests: 1
    });
    return statusClass(status);
  }

  throw new Error(`Unknown fixture kind ${kind}`);
}

export function sortCases(cases) {
  return [...cases].sort((x, y) => KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind));
}
