# Riverside PMS - engineering exercise

[بالعربية](README.en.md)

A small property-management service for a 12-room hotel: availability, quotes, reservations,
folios and cancellations. It has been in production for a year.

Two incidents are open against it. They are in [`TICKETS.en.md`](TICKETS.en.md), with log excerpts
in [`logs/`](logs/). The business rules the property expects are in [`SPEC.en.md`](SPEC.en.md);
where the code and the spec disagree, the spec wins.

## Running it

Requires Node 22.5 or newer. No database to install - the schema and seed data are loaded
into an in-memory SQLite database at start-up, so every restart is a clean, identical system.

```bash
docker compose up                          # http://localhost:3000
docker compose run --rm pms npm run verify # the reference fixture, in the container
```

Or without Docker — Node 22.5 or newer:

```bash
npm install
npm start          # http://localhost:3000
npm test           # the existing test suite
npm run verify     # replay the reference fixture (see below)
```

## The reference fixture

Finance keeps a export of 596 quotes, availability searches and rate previews taken from the
previous system, in `fixtures/expected.csv`. `npm run verify` replays all of them against this
service and reports every row where the two systems disagree. You can narrow it to one kind
of row:

```bash
npm run verify -- QUOTE
```

## What we would like back

1. **`FINDINGS.md`** - the write-up. For each incident:
   - how you reproduced it, and the smallest input that triggers it;
   - the root cause: the mechanism, not a restatement of the symptom;
   - why the obvious one-line fix is not the right one - name it;
   - everything else affected by the same cause;
   - what you hardened around the fix, and why;
   - anything you decided to leave alone, and why.
2. **The fix**, as you would put it into production.
3. **Regression tests** that fail before your change and pass after it.
4. In `FINDINGS.md`, please also answer: **which fixture rows were failing before your fix?**
   Row ids and a count are enough.


## If you used AI

Using AI tools is **entirely allowed** and costs you nothing.

If you used one for any part of this, include **`AI-CONVERSATION.md`** holding the
**complete transcript exactly as it happened**: every prompt you wrote and every reply you
got, in order, nothing deleted, summarised or tidied. If you used more than one tool or more
than one session, include them all under clear headings.

If you did not use AI at all, say so in one line in the same file.

We read it to understand how you think — when you take a suggestion and when you push back,
and why — not to penalise you for using the tool. Concealing that you used one, or handing in
an edited transcript, ends the assessment.

---

Budget **one hour**. If you run out of time, say what you would have done next -
we would rather read a clear account of an unfinished investigation than a rushed patch.
