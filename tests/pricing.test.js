import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

const api = startServer();
test.after(() => api.close());

test('prices a stay that sits inside a single season', async () => {
  const { status, body } = await api.post('/quotes', {
    roomTypeId: 'DLX',
    checkIn: '2026-07-10',
    checkOut: '2026-07-15'
  });

  assert.equal(status, 200);
  assert.equal(body.nights.length, 5);
  assert.equal(body.roomTotal, '1050.00');
  assert.ok(body.nights.every((night) => night.season === 'HIGH'));
});

test('adds city tax and the resort fee to the room total', async () => {
  const { body } = await api.post('/quotes', {
    roomTypeId: 'DLX',
    checkIn: '2026-07-10',
    checkOut: '2026-07-15'
  });

  assert.equal(body.tax, '126.00');
  assert.equal(body.fee, '15.00');
  assert.equal(body.total, '1191.00');
});

test('the departure date is not charged as a night', async () => {
  const { body } = await api.post('/quotes', {
    roomTypeId: 'STD',
    checkIn: '2026-02-02',
    checkOut: '2026-02-03'
  });

  assert.equal(body.nights.length, 1);
  assert.equal(body.nights[0].date, '2026-02-02');
});

test('the rate preview returns one row per night', async () => {
  const { status, body } = await api.get('/rates/preview?roomTypeId=STD&from=2026-02-02&to=2026-02-07');

  assert.equal(status, 200);
  assert.equal(body.nights.length, 5);
});

test('rejects a date that is not a calendar date', async () => {
  const { status, body } = await api.post('/quotes', {
    roomTypeId: 'DLX',
    checkIn: 'yesterday',
    checkOut: '2026-07-15'
  });

  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_INPUT');
});
