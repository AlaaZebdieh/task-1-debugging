import { Router } from 'express';
import * as availabilityService from '../services/availabilityService.js';
import * as pricingService from '../services/pricingService.js';
import * as reservationService from '../services/reservationService.js';
import * as cancellationService from '../services/cancellationService.js';
import * as reservationRepo from '../repositories/reservationRepo.js';
import * as roomTypeRepo from '../repositories/roomTypeRepo.js';
import { format } from '../lib/money.js';
import { enumerateNights } from '../lib/dates.js';
import { notFound, badRequest, unprocessable } from '../lib/errors.js';
import { requireDate, requireInt, requireString } from '../lib/validate.js';

export const router = Router();

function parseRoomTypeId(id) {
  return requireString(id, 'roomTypeId', { maxLength: 8 });
}

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.get('/availability', (req, res) => {
  const checkIn = requireDate(req.query.checkIn, 'checkIn');
  const checkOut = requireDate(req.query.checkOut, 'checkOut');
  const guests = req.query.guests === undefined ? undefined : requireInt(req.query.guests, 'guests', { min: 1, max: 8 });

  const results = availabilityService.search({ checkIn, checkOut, roomTypeId: req.query.roomTypeId, guests });
  res.json({
    checkIn,
    checkOut,
    roomTypes: results.map((r) => ({ ...r, quotedTotal: format(r.quotedTotalCents) }))
  });
});

router.post('/quotes', (req, res) => {
  const roomTypeId = parseRoomTypeId(req.body.roomTypeId);
  const checkIn = requireDate(req.body.checkIn, 'checkIn');
  const checkOut = requireDate(req.body.checkOut, 'checkOut');

  const quoted = pricingService.quote(roomTypeId, checkIn, checkOut);
  res.json({
    roomTypeId,
    checkIn,
    checkOut,
    nights: quoted.nights.map((n) => ({ date: n.date, season: n.season, rate: format(n.rateCents) })),
    roomTotal: format(quoted.roomCents),
    tax: format(quoted.taxCents),
    fee: format(quoted.feeCents),
    total: format(quoted.totalCents)
  });
});

router.get('/rates/preview', (req, res) => {
  const roomTypeId = parseRoomTypeId(req.query.roomTypeId);
  const from = requireDate(req.query.from, 'from');
  const to = requireDate(req.query.to, 'to');

  const nights = pricingService.resolveNightlyRates(roomTypeId, from, to);
  res.json({
    roomTypeId,
    from,
    to,
    nights: nights.map((n) => ({ date: n.date, season: n.season, rate: format(n.rateCents) }))
  });
});

router.post('/reservations', (req, res) => {
  const roomTypeId = parseRoomTypeId(req.body.roomTypeId);
  const checkIn = requireDate(req.body.checkIn, 'checkIn');
  const checkOut = requireDate(req.body.checkOut, 'checkOut');
  const guestName = requireString(req.body.guestName, 'guestName', { maxLength: 100 });
  const guests = requireInt(req.body.guests, 'guests', { min: 1, max: 8 });

  const reservation = reservationService.create({
    guestName,
    roomTypeId,
    checkIn,
    checkOut,
    guests,
    policyId: req.body.policyId
  });
  res.status(201).json(present(reservation));
});

router.get('/reservations/:id', (req, res) => {
  res.json(present(reservationService.get(req.params.id)));
});

router.patch('/reservations/:id', (req, res) => {
  const checkIn = requireDate(req.body.checkIn, 'checkIn');
  const checkOut = requireDate(req.body.checkOut, 'checkOut');
  res.json(present(reservationService.changeDates(req.params.id, checkIn, checkOut)));
});

router.post('/reservations/:id/cancel', (req, res) => {
  const result = cancellationService.cancel(req.params.id);
  res.json({ ...result, penalty: format(result.penaltyCents) });
});

router.get('/reservations/:id/folio', (req, res) => {
  const reservation = reservationService.get(req.params.id);
  const lines = reservationRepo.findFolio(reservation.id);
  const payments = reservationRepo.findPayments(reservation.id);
  const balance =
    lines.reduce((s, l) => s + l.amount_cents, 0) - payments.reduce((s, p) => s + p.amount_cents, 0);

  res.json({
    reservationId: reservation.id,
    guestName: reservation.guest_name,
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    lines: lines.map((l) => ({
      date: l.line_date,
      kind: l.kind,
      description: l.description,
      amount: format(l.amount_cents)
    })),
    payments: payments.map((p) => ({ amount: format(p.amount_cents), method: p.method })),
    balanceDue: format(balance)
  });
});

router.post('/reservations/:id/payments', (req, res) => {
  const reservation = reservationService.get(req.params.id);
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) {
    throw badRequest('INVALID_INPUT', 'amount must be a positive value with at most two decimal places', {
      field: 'amount'
    });
  }
  const cents = Math.round(amount * 100);
  const due =
    reservationRepo.findFolio(reservation.id).reduce((s, l) => s + l.amount_cents, 0) -
    reservationRepo.findPayments(reservation.id).reduce((s, p) => s + p.amount_cents, 0);
  if (cents > due) {
    throw unprocessable('OVERPAYMENT', 'Payment exceeds the outstanding balance', { balanceDue: format(due) });
  }

  reservationRepo.insertPayment(reservation.id, cents, requireString(req.body.method ?? 'card', 'method', { maxLength: 20 }));
  res.status(201).json({ reservationId: reservation.id, amount: format(cents) });
});

router.get('/housekeeping/forecast', (req, res) => {
  const from = requireDate(req.query.from, 'from');
  const to = requireDate(req.query.to, 'to');
  const occupancy = Object.fromEntries(enumerateNights(from, to).map((d) => [d, 0]));
  for (const type of roomTypeRepo.findAll()) {
    for (const r of reservationRepo.findByRoomType(type.id)) {
      if (r.status !== 'confirmed') continue;
      for (const night of enumerateNights(r.check_in, r.check_out)) {
        if (night in occupancy) occupancy[night] += 1;
      }
    }
  }
  res.json({ from, to, occupancy });
});

router.use((req, res, next) => next(notFound('NOT_FOUND', `No route for ${req.method} ${req.path}`)));

function present(r) {
  return {
    id: r.id,
    guestName: r.guest_name,
    roomTypeId: r.room_type_id,
    checkIn: r.check_in,
    checkOut: r.check_out,
    guests: r.guests,
    status: r.status,
    policyId: r.policy_id
  };
}
