import { dateInRange, enumerateNights } from '../lib/dates.js';
import { notFound, unprocessable } from '../lib/errors.js';
import { assertStayDates } from '../lib/validate.js';
import { percentOf } from '../lib/money.js';
import * as rateRepo from '../repositories/rateRepo.js';
import * as roomTypeRepo from '../repositories/roomTypeRepo.js';

export const CITY_TAX_PERCENT = 12;
export const RESORT_FEE_CENTS = 1500;

function resolveNightlyRatesUnchecked(roomTypeId, checkIn, checkOut) {
  const seasons = rateRepo.findSeasons(roomTypeId, checkIn, checkOut);
  return enumerateNights(checkIn, checkOut).flatMap((date) => {
    const season = seasons.find((s) => dateInRange(date, s.start_date, s.end_date));
    if (!season) return [];
    return [{ date, season: season.season, rateCents: season.nightly_rate_cents }];
  });
}

function assertPricable(roomTypeId, checkIn, checkOut) {
  assertStayDates(checkIn, checkOut);
  if (!roomTypeRepo.findById(roomTypeId)) {
    throw notFound('ROOM_TYPE_NOT_FOUND', `Unknown room type ${roomTypeId}`);
  }
  const stayNights = enumerateNights(checkIn, checkOut);
  const priced = resolveNightlyRatesUnchecked(roomTypeId, checkIn, checkOut);
  if (priced.length !== stayNights.length) {
    const pricedDates = new Set(priced.map((n) => n.date));
    throw unprocessable('UNPRICED_NIGHTS', 'No rate is configured for every night of this stay', {
      checkIn,
      checkOut,
      roomTypeId,
      missingDates: stayNights.filter((date) => !pricedDates.has(date))
    });
  }
}

/**
 * Walks the rate calendar and returns one priced night per night of the stay.
 * Each night in [checkIn, checkOut) is priced from the season that contains it.
 */
export function resolveNightlyRates(roomTypeId, checkIn, checkOut) {
  assertPricable(roomTypeId, checkIn, checkOut);
  return resolveNightlyRatesUnchecked(roomTypeId, checkIn, checkOut);
}

export function quote(roomTypeId, checkIn, checkOut) {
  assertPricable(roomTypeId, checkIn, checkOut);
  const nights = resolveNightlyRatesUnchecked(roomTypeId, checkIn, checkOut);
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
