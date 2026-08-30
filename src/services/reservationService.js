import * as reservationRepo from '../repositories/reservationRepo.js';
import * as roomTypeRepo from '../repositories/roomTypeRepo.js';
import { quote, toFolioLines } from './pricingService.js';
import { conflict, notFound } from '../lib/errors.js';

/**
 * The house rule: a room type is sold out for a range when the number of confirmed
 * reservations overlapping that range has reached the number of physical rooms.
 */
function overlaps(reservation, checkIn, checkOut) {
  return reservation.check_in <= checkOut && reservation.check_out >= checkIn;
}

function assertRoomsLeft(roomTypeId, checkIn, checkOut) {
  const type = roomTypeRepo.findById(roomTypeId);
  if (!type) throw notFound('ROOM_TYPE_NOT_FOUND', `Unknown room type ${roomTypeId}`);

  const booked = reservationRepo
    .findByRoomType(roomTypeId)
    .filter((r) => r.status === 'confirmed' && overlaps(r, checkIn, checkOut));

  if (booked.length >= type.total_rooms) {
    throw conflict('NO_ROOMS_AVAILABLE', `${type.name} is sold out for the requested dates`, {
      roomTypeId,
      checkIn,
      checkOut
    });
  }
}

export function create({ guestName, roomTypeId, checkIn, checkOut, guests, policyId }) {
  assertRoomsLeft(roomTypeId, checkIn, checkOut);

  const quoted = quote(roomTypeId, checkIn, checkOut);
  const reservation = reservationRepo.insert({
    id: reservationRepo.nextId(),
    guest_name: guestName,
    room_type_id: roomTypeId,
    check_in: checkIn,
    check_out: checkOut,
    guests,
    status: 'confirmed',
    policy_id: policyId ?? 'FLEX',
    created_at: new Date().toISOString()
  });

  reservationRepo.replaceFolio(reservation.id, toFolioLines(quoted));
  return reservation;
}

export function changeDates(id, checkIn, checkOut) {
  const reservation = reservationRepo.findById(id);
  if (!reservation) throw notFound('RESERVATION_NOT_FOUND', `Unknown reservation ${id}`);
  if (reservation.status !== 'confirmed') {
    throw conflict('RESERVATION_NOT_CONFIRMED', `Reservation ${id} is ${reservation.status}`);
  }

  assertRoomsLeft(reservation.room_type_id, checkIn, checkOut);

  const quoted = quote(reservation.room_type_id, checkIn, checkOut);
  const updated = reservationRepo.updateDates(id, checkIn, checkOut);
  reservationRepo.replaceFolio(id, toFolioLines(quoted));
  return updated;
}

export function get(id) {
  const reservation = reservationRepo.findById(id);
  if (!reservation) throw notFound('RESERVATION_NOT_FOUND', `Unknown reservation ${id}`);
  return reservation;
}
