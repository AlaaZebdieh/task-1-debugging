CREATE TABLE room_types (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  capacity      INTEGER NOT NULL
);

CREATE TABLE rooms (
  id            TEXT PRIMARY KEY,
  room_type_id  TEXT NOT NULL REFERENCES room_types(id),
  number        TEXT NOT NULL
);

-- start_date is inclusive, end_date is EXCLUSIVE (see SPEC.md section 3)
CREATE TABLE rate_calendar (
  id                 INTEGER PRIMARY KEY,
  room_type_id       TEXT NOT NULL REFERENCES room_types(id),
  season             TEXT NOT NULL,
  start_date         TEXT NOT NULL,
  end_date           TEXT NOT NULL,
  nightly_rate_cents INTEGER NOT NULL
);

CREATE TABLE cancellation_policies (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  free_until_days  INTEGER,
  penalty          TEXT NOT NULL
);

CREATE TABLE reservations (
  id            TEXT PRIMARY KEY,
  guest_name    TEXT NOT NULL,
  room_type_id  TEXT NOT NULL REFERENCES room_types(id),
  check_in      TEXT NOT NULL,
  check_out     TEXT NOT NULL,
  guests        INTEGER NOT NULL,
  status        TEXT NOT NULL,
  policy_id     TEXT NOT NULL REFERENCES cancellation_policies(id),
  created_at    TEXT NOT NULL
);

CREATE TABLE folio_lines (
  id              INTEGER PRIMARY KEY,
  reservation_id  TEXT NOT NULL REFERENCES reservations(id),
  line_date       TEXT,
  kind            TEXT NOT NULL,
  description     TEXT NOT NULL,
  amount_cents    INTEGER NOT NULL
);

CREATE TABLE payments (
  id              INTEGER PRIMARY KEY,
  reservation_id  TEXT NOT NULL REFERENCES reservations(id),
  amount_cents    INTEGER NOT NULL,
  method          TEXT NOT NULL,
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_res_type_dates ON reservations(room_type_id, check_in, check_out);
CREATE INDEX idx_rate_type_dates ON rate_calendar(room_type_id, start_date, end_date);
