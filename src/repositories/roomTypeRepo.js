import { getDb } from '../db/index.js';

export function findAll() {
  return getDb()
    .prepare(
      `SELECT rt.id, rt.name, rt.capacity,
              (SELECT COUNT(*) FROM rooms rm WHERE rm.room_type_id = rt.id) AS total_rooms
         FROM room_types rt
        ORDER BY rt.id`
    )
    .all();
}

export function findById(id) {
  return getDb()
    .prepare(
      `SELECT rt.id, rt.name, rt.capacity,
              (SELECT COUNT(*) FROM rooms rm WHERE rm.room_type_id = rt.id) AS total_rooms
         FROM room_types rt
        WHERE rt.id = ?`
    )
    .get(id);
}
