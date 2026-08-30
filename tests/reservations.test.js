import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

const api = startServer();
test.after(() => api.close());

test('books a room and opens a folio for it', async () => {
  const created = await api.post('/reservations', {
    guestName: 'Test Guest',
    roomTypeId: 'SUI',
    checkIn: '2026-04-02',
    checkOut: '2026-04-05',
    guests: 2
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'confirmed');

  const folio = await api.get(`/reservations/${created.body.id}/folio`);
  assert.equal(folio.body.lines.length, 5); // three nights + city tax + resort fee
  assert.equal(folio.body.balanceDue, '821.40');
});

test('records a payment against the folio', async () => {
  const created = await api.post('/reservations', {
    guestName: 'Test Guest',
    roomTypeId: 'STD',
    checkIn: '2026-04-10',
    checkOut: '2026-04-12',
    guests: 1
  });

  await api.post(`/reservations/${created.body.id}/payments`, { amount: 100, method: 'card' });

  const folio = await api.get(`/reservations/${created.body.id}/folio`);
  assert.equal(folio.body.payments.length, 1);
  assert.equal(folio.body.balanceDue, '116.60');
});

test('refuses to book a sold out room type', async () => {
  const { status, body } = await api.post('/reservations', {
    guestName: 'Test Guest',
    roomTypeId: 'SUI',
    checkIn: '2026-12-03',
    checkOut: '2026-12-04',
    guests: 2
  });

  assert.equal(status, 409);
  assert.equal(body.error.code, 'NO_ROOMS_AVAILABLE');
});

test('returns 404 for an unknown reservation', async () => {
  const { status, body } = await api.get('/reservations/RES-00000');

  assert.equal(status, 404);
  assert.equal(body.error.code, 'RESERVATION_NOT_FOUND');
});

test('does not leak internals on a bad request body', async () => {
  const { status, body } = await api.post('/reservations', { guestName: '', roomTypeId: 'STD' });

  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_INPUT');
  assert.equal(body.error.stack, undefined);
});
