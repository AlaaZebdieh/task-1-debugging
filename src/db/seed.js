import { roomTypes, rateCalendar, policies, reservations } from './seed-data.js';

export function seed(db) {
  const insertType = db.prepare('INSERT INTO room_types (id, name, capacity) VALUES (?, ?, ?)');
  const insertRoom = db.prepare('INSERT INTO rooms (id, room_type_id, number) VALUES (?, ?, ?)');
  for (const t of roomTypes) {
    insertType.run(t.id, t.name, t.capacity);
    for (let i = 1; i <= t.rooms; i++) {
      insertRoom.run(`${t.id}-${String(i).padStart(2, '0')}`, t.id, `${t.id}${100 + i}`);
    }
  }

  const insertRate = db.prepare(
    'INSERT INTO rate_calendar (room_type_id, season, start_date, end_date, nightly_rate_cents) VALUES (?, ?, ?, ?, ?)'
  );
  for (const r of rateCalendar) {
    insertRate.run(r.room_type_id, r.season, r.start_date, r.end_date, r.nightly_rate_cents);
  }

  const insertPolicy = db.prepare(
    'INSERT INTO cancellation_policies (id, name, free_until_days, penalty) VALUES (?, ?, ?, ?)'
  );
  for (const p of policies) insertPolicy.run(p.id, p.name, p.free_until_days, p.penalty);

  const insertRes = db.prepare(
    `INSERT INTO reservations (id, guest_name, room_type_id, check_in, check_out, guests, status, policy_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const r of reservations) {
    insertRes.run(r.id, r.guest_name, r.room_type_id, r.check_in, r.check_out, r.guests, r.status, r.policy_id, '2026-01-15T09:00:00Z');
  }
}
