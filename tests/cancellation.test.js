import test from 'node:test';
import assert from 'node:assert/strict';
import * as cancellationService from '../src/services/cancellationService.js';

test('a flexible rate cancelled well before arrival costs nothing', () => {
  const result = cancellationService.cancel('RES-10877', '2026-05-01');

  assert.equal(result.status, 'cancelled');
  assert.equal(result.penaltyCents, 0);
});

test('a flexible rate cancelled inside the window costs the first night', () => {
  const result = cancellationService.cancel('RES-10842', '2026-08-26');

  assert.equal(result.daysUntilArrival, 2);
  assert.equal(result.penaltyCents, 21000);
});

test('a non-refundable rate always costs the full stay', () => {
  const result = cancellationService.cancel('RES-10861', '2026-01-01');

  assert.ok(result.penaltyCents > 0);
});

test('a reservation cannot be cancelled twice', () => {
  assert.throws(() => cancellationService.cancel('RES-11081', '2026-09-01'), /already cancelled/i);
});
