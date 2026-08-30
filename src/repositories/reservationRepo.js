import { getDb } from '../db/index.js';

export function findById(id) {
  return getDb().prepare('SELECT * FROM reservations WHERE id = ?').get(id);
}

export function findByRoomType(roomTypeId) {
  return getDb()
    .prepare('SELECT * FROM reservations WHERE room_type_id = ? ORDER BY check_in')
    .all(roomTypeId);
}

export function insert(reservation) {
  getDb()
    .prepare(
      `INSERT INTO reservations (id, guest_name, room_type_id, check_in, check_out, guests, status, policy_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      reservation.id,
      reservation.guest_name,
      reservation.room_type_id,
      reservation.check_in,
      reservation.check_out,
      reservation.guests,
      reservation.status,
      reservation.policy_id,
      reservation.created_at
    );
  return findById(reservation.id);
}

export function updateDates(id, checkIn, checkOut) {
  getDb().prepare('UPDATE reservations SET check_in = ?, check_out = ? WHERE id = ?').run(checkIn, checkOut, id);
  return findById(id);
}

export function updateStatus(id, status) {
  getDb().prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, id);
  return findById(id);
}

export function nextId() {
  const row = getDb()
    .prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) AS n FROM reservations WHERE id LIKE 'RES-%'")
    .get();
  return `RES-${(row.n ?? 10000) + 1}`;
}

export function replaceFolio(reservationId, lines) {
  const db = getDb();
  db.prepare('DELETE FROM folio_lines WHERE reservation_id = ?').run(reservationId);
  const insertLine = db.prepare(
    'INSERT INTO folio_lines (reservation_id, line_date, kind, description, amount_cents) VALUES (?, ?, ?, ?, ?)'
  );
  for (const line of lines) {
    insertLine.run(reservationId, line.date ?? null, line.kind, line.description, line.amountCents);
  }
}

export function findFolio(reservationId) {
  return getDb()
    .prepare('SELECT line_date, kind, description, amount_cents FROM folio_lines WHERE reservation_id = ? ORDER BY id')
    .all(reservationId);
}

export function findPayments(reservationId) {
  return getDb()
    .prepare('SELECT amount_cents, method, created_at FROM payments WHERE reservation_id = ? ORDER BY id')
    .all(reservationId);
}

export function insertPayment(reservationId, amountCents, method) {
  getDb()
    .prepare('INSERT INTO payments (reservation_id, amount_cents, method, created_at) VALUES (?, ?, ?, ?)')
    .run(reservationId, amountCents, method, new Date().toISOString());
}
