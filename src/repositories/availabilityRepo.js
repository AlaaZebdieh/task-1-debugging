import { getDb } from '../db/index.js';

/** Number of reservations of this room type that overlap the requested dates. */
export function countOverlapping(roomTypeId, checkIn, checkOut) {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS booked
         FROM reservations r
        WHERE r.room_type_id = ?
          AND r.check_in  <= ?
          AND r.check_out >= ?`
    )
    .get(roomTypeId, checkOut, checkIn);
  return row.booked;
}
