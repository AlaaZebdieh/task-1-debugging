import { getDb } from '../db/index.js';

/** Seasons whose range touches [from, to). */
export function findSeasons(roomTypeId, from, to) {
  return getDb()
    .prepare(
      `SELECT season, start_date, end_date, nightly_rate_cents
         FROM rate_calendar
        WHERE room_type_id = ?
          AND start_date < ?
          AND end_date   > ?
        ORDER BY start_date`
    )
    .all(roomTypeId, to, from);
}
