import * as reservationRepo from '../repositories/reservationRepo.js';
import { quote, toFolioLines } from '../services/pricingService.js';

/** Folios for the reservations that were already in the system at go-live. */
export function seedFolios(reservations) {
  for (const reservation of reservations) {
    if (reservation.status !== 'confirmed') continue;
    const quoted = quote(reservation.room_type_id, reservation.check_in, reservation.check_out);
    reservationRepo.replaceFolio(reservation.id, toFolioLines(quoted));
  }
}
