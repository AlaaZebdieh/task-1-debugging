# Riverside Hotel PMS - business rules

[بالعربية](SPEC.en.md)

This document is the source of truth for how the property expects the system to behave.
Where the code and this document disagree, this document wins.

## 1. Rooms

Three room types, each with a fixed number of physical rooms and a maximum party size.

| Type | Name | Rooms | Capacity |
|---|---|---|---|
| `STD` | Standard Twin | 6 | 2 |
| `DLX` | Deluxe King | 4 | 3 |
| `SUI` | Riverside Suite | 2 | 4 |

Rooms are not assigned individually at booking time. A room type is bookable as long as
fewer confirmed reservations overlap the requested dates than there are physical rooms.

## 2. Stays

A stay is described by a check-in date and a check-out date.

- The guest sleeps on every date from the check-in date up to, **but not including**, the check-out date.
  A stay from the 10th to the 13th is three nights: the 10th, the 11th and the 12th.
- The check-out date is not charged.
- A departing guest vacates the room in the morning and an arriving guest takes it the same
  afternoon. **The check-out date of one stay and the check-in date of the next may be the same day.**
- A stay must be at least one night and no more than 180 nights.
- The party size may not exceed the capacity of the room type.

## 3. Rates

Nightly rates come from the rate calendar, which stores one row per room type per season.

- `start_date` is **inclusive**. `end_date` is **exclusive**.
  A season of `2026-06-01` to `2026-09-01` covers the nights of 1 June through 31 August.
  The night of 1 September belongs to the following season.
- Every night of a stay is charged at the rate of the season that night falls in. A stay that
  runs from one season into the next is charged partly at each rate.
- The rate calendar is maintained by hand and is not guaranteed to be complete. **The system
  must never invent a price for a night that has no rate configured**, and must never quote or
  bill such a stay. Revenue management would rather have the booking refused than priced wrongly.

## 4. Charges

For every stay:

- one room charge per night, at that night's rate;
- city tax at 12% of the room total, rounded to the nearest cent;
- a flat resort fee of 15.00 per stay.

The folio total is the sum of the three. Payments are recorded against the folio and reduce
the balance due. A payment may not exceed the outstanding balance.

## 5. Cancellation

Every reservation carries a cancellation policy.

| Policy | Rule | Penalty if cancelled late |
|---|---|---|
| `FLEX` | Free if cancelled 7 or more days before arrival | the first night's rate |
| `SAVER` | Non-refundable | the full stay total |

A cancelled reservation frees the room immediately and no longer counts towards occupancy.
A reservation may only be cancelled once.

## 6. Money

All monetary values are exact to the cent. Amounts appear on the wire as decimal strings
(`"1594.20"`). Rounding, where needed, is half-up.

## 7. Errors

Every failed request returns

```json
{ "error": { "code": "SOME_CODE", "message": "human readable", "details": { } } }
```

Client mistakes and business-rule refusals must be distinguishable from faults in the system.
Internal details - stack traces, SQL, file paths - must never reach a client.
