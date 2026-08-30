import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

const api = startServer();
test.after(() => api.close());

test('reports every room as free for a quiet week', async () => {
  const { status, body } = await api.get('/availability?roomTypeId=SUI&checkIn=2026-04-02&checkOut=2026-04-05');

  assert.equal(status, 200);
  assert.equal(body.roomTypes[0].available, 2);
  assert.equal(body.roomTypes[0].nights, 3);
});

test('subtracts a stay that covers the whole search range', async () => {
  const { body } = await api.get('/availability?roomTypeId=SUI&checkIn=2026-06-21&checkOut=2026-06-23');

  assert.equal(body.roomTypes[0].available, 1);
});

test('quotes a total alongside the availability count', async () => {
  const { body } = await api.get('/availability?roomTypeId=STD&checkIn=2026-02-02&checkOut=2026-02-05');

  assert.equal(body.roomTypes[0].quotedTotal, '317.40');
});

test('returns every room type when none is specified', async () => {
  const { body } = await api.get('/availability?checkIn=2026-04-02&checkOut=2026-04-05');

  assert.deepEqual(
    body.roomTypes.map((r) => r.roomTypeId),
    ['DLX', 'STD', 'SUI']
  );
});

test('filters room types that cannot hold the party', async () => {
  const { body } = await api.get('/availability?checkIn=2026-04-02&checkOut=2026-04-05&guests=4');

  assert.deepEqual(
    body.roomTypes.map((r) => r.roomTypeId),
    ['SUI']
  );
});
