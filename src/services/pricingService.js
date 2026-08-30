import { addDays, maxDate, minDate } from '../lib/dates.js';
import { percentOf } from '../lib/money.js';
import * as rateRepo from '../repositories/rateRepo.js';

export const CITY_TAX_PERCENT = 12;
export const RESORT_FEE_CENTS = 1500;

/**
 * Walks the rate calendar and returns one priced night per night of the stay.
 * The stay is split into a segment per season so that a stay running from one
 * season into the next is billed at each season's own rate.
 */
export function resolveNightlyRates(roomTypeId, checkIn, checkOut) {
  const seasons = rateRepo.findSeasons(roomTypeId, checkIn, checkOut);
  const lastNight = addDays(checkOut, -1);
  const nights = [];

  for (const season of seasons) {
    const segmentStart = maxDate(checkIn, season.start_date);
    const segmentEnd = minDate(lastNight, season.end_date);
    if (segmentStart > segmentEnd) continue;

    for (let date = segmentStart; date <= segmentEnd; date = addDays(date, 1)) {
      nights.push({ date, season: season.season, rateCents: season.nightly_rate_cents });
    }
  }

  return nights;
}

export function quote(roomTypeId, checkIn, checkOut) {
  const nights = resolveNightlyRates(roomTypeId, checkIn, checkOut);
  const roomCents = nights.reduce((sum, n) => sum + n.rateCents, 0);
  const taxCents = percentOf(roomCents, CITY_TAX_PERCENT);
  const feeCents = RESORT_FEE_CENTS;
  return { nights, roomCents, taxCents, feeCents, totalCents: roomCents + taxCents + feeCents };
}

export function toFolioLines(quoted) {
  return [
    ...quoted.nights.map((n) => ({
      date: n.date,
      kind: 'room',
      description: `Room charge (${n.season})`,
      amountCents: n.rateCents
    })),
    { date: null, kind: 'tax', description: `City tax ${CITY_TAX_PERCENT}%`, amountCents: quoted.taxCents },
    { date: null, kind: 'fee', description: 'Resort fee', amountCents: quoted.feeCents }
  ];
}
