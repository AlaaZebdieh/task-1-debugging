# Open incidents

[بالعربية](TICKETS.en.md)

Two tickets are waiting on engineering. Both were raised by hotel staff, not by developers.

---

## Incident 2291 - "Six-night stay billed as seven"

**Raised by:** S. Okoro, Front Office Manager
**Priority:** High - guest-facing, we are refunding the difference by hand

> Reservation **RES-10842** (M. Achterberg, Deluxe King, arriving 28 August, departing 3 September)
> is a six-night stay. The confirmation the guest received lists **seven** room charges and the
> balance is one night too high.
>
> The same thing happened to two guests who checked out at the start of June. Finance
> spotted it both times and we credited the extra night back.
>
> I pulled ten other bookings from the same fortnight and they are all correct, so it is not
> everything. Log excerpt attached.

**Attached:** `logs/incident-2291.log`

---

## Incident 2304 - "Room shows as unavailable on a turnover day"

**Raised by:** D. Ferrand, Reservations Supervisor
**Priority:** High - we are turning away business

> The Standard Twin shows **0 available** for an arrival on 10 November. That cannot be right:
> **RES-10999** departs on the 10th, so the room is empty from 11:00 that morning.
>
> It seems to happen when the previous stay ends on the same day the new one starts. If I move
> the arrival to the 11th, availability looks normal again.
>
> While I was testing I also could not extend **RES-11150** (O. Kaminski, Riverside Suite,
> 2-5 December) to the 7th. The system says the suite is sold out for those dates, but it is
> that guest's own booking I am trying to extend.

**Attached:** `logs/incident-2304.log`
