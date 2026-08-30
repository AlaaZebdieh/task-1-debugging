import { getDb } from '../db/index.js';

/** Number of confirmed reservations of this room type that overlap [checkIn, checkOut). */
export function countOverlapping(roomTypeId, checkIn, checkOut, excludeReservationId = null) {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS booked
         FROM reservations r
        WHERE r.room_type_id = ?
          AND r.status = 'confirmed'
          AND r.check_in  < ?
          AND r.check_out > ?
          AND (? IS NULL OR r.id != ?)`
    )
    .get(roomTypeId, checkOut, checkIn, excludeReservationId, excludeReservationId);
  return row.booked;
}
