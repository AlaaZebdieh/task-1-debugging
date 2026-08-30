import { getDb } from '../db/index.js';
import * as reservationRepo from '../repositories/reservationRepo.js';
import { quote } from './pricingService.js';
import { conflict, notFound } from '../lib/errors.js';
import { diffDays } from '../lib/dates.js';

function policyFor(id) {
  return getDb().prepare('SELECT * FROM cancellation_policies WHERE id = ?').get(id);
}

export function cancel(id, today = new Date().toISOString().slice(0, 10)) {
  const reservation = reservationRepo.findById(id);
  if (!reservation) throw notFound('RESERVATION_NOT_FOUND', `Unknown reservation ${id}`);
  if (reservation.status === 'cancelled') {
    throw conflict('ALREADY_CANCELLED', `Reservation ${id} is already cancelled`);
  }

  const policy = policyFor(reservation.policy_id);
  const daysUntilArrival = diffDays(today, reservation.check_in);
  const quoted = quote(reservation.room_type_id, reservation.check_in, reservation.check_out);

  const cancelledInTime = policy.free_until_days !== null && daysUntilArrival >= policy.free_until_days;

  let penaltyCents = 0;
  if (!cancelledInTime) {
    penaltyCents = policy.penalty === 'full_stay' ? quoted.totalCents : quoted.nights[0].rateCents;
  }

  reservationRepo.updateStatus(id, 'cancelled');
  reservationRepo.replaceFolio(id, [
    { date: null, kind: 'fee', description: `Cancellation penalty (${policy.id})`, amountCents: penaltyCents }
  ]);

  return { reservationId: id, status: 'cancelled', daysUntilArrival, penaltyCents };
}
