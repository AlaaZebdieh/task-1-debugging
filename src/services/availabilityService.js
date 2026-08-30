import * as roomTypeRepo from '../repositories/roomTypeRepo.js';
import * as availabilityRepo from '../repositories/availabilityRepo.js';
import { quote } from './pricingService.js';
import { diffDays } from '../lib/dates.js';
import { notFound } from '../lib/errors.js';

export function search({ checkIn, checkOut, roomTypeId, guests }) {
  if (roomTypeId && !roomTypeRepo.findById(roomTypeId)) {
    throw notFound('ROOM_TYPE_NOT_FOUND', `Unknown room type ${roomTypeId}`);
  }

  const types = roomTypeId ? [roomTypeRepo.findById(roomTypeId)] : roomTypeRepo.findAll();

  return types
    .filter((t) => (guests ? t.capacity >= guests : true))
    .map((t) => {
      const booked = availabilityRepo.countOverlapping(t.id, checkIn, checkOut);
      const quoted = quote(t.id, checkIn, checkOut);
      return {
        roomTypeId: t.id,
        name: t.name,
        capacity: t.capacity,
        nights: diffDays(checkIn, checkOut),
        available: Math.max(0, t.total_rooms - booked),
        quotedTotalCents: quoted.totalCents
      };
    });
}
