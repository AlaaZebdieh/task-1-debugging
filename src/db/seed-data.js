export const roomTypes = [
  { id: 'STD', name: 'Standard Twin', capacity: 2, rooms: 6 },
  { id: 'DLX', name: 'Deluxe King', capacity: 3, rooms: 4 },
  { id: 'SUI', name: 'Riverside Suite', capacity: 4, rooms: 2 }
];

// Seasons for 2026. end_date is exclusive.
const seasons = [
  { season: 'LOW',      start_date: '2026-01-01', end_date: '2026-06-01', rates: { STD: 9000,  DLX: 14000, SUI: 24000 } },
  { season: 'HIGH',     start_date: '2026-06-01', end_date: '2026-09-01', rates: { STD: 14500, DLX: 21000, SUI: 36000 } },
  { season: 'FESTIVAL', start_date: '2026-09-01', end_date: '2026-09-08', rates: { STD: 19000, DLX: 28500, SUI: 47000 } },
  { season: 'SHOULDER', start_date: '2026-09-08', end_date: '2026-12-20', rates: { STD: 11000, DLX: 16500, SUI: 28000 } },
  // 2026-12-20 .. 2026-12-27 is not covered by any season.
  { season: 'HOLIDAY',  start_date: '2026-12-27', end_date: '2027-01-03', rates: { STD: 21000, DLX: 31000, SUI: 52000 } }
];

export const rateCalendar = seasons.flatMap((s) =>
  Object.entries(s.rates).map(([roomTypeId, nightly_rate_cents]) => ({
    room_type_id: roomTypeId,
    season: s.season,
    start_date: s.start_date,
    end_date: s.end_date,
    nightly_rate_cents
  }))
);

export const policies = [
  { id: 'FLEX',  name: 'Free cancellation up to 7 days before arrival', free_until_days: 7, penalty: 'first_night' },
  { id: 'SAVER', name: 'Non-refundable', free_until_days: null, penalty: 'full_stay' }
];

export const reservations = [
  { id: 'RES-10842', guest_name: 'M. Achterberg', room_type_id: 'DLX', check_in: '2026-08-28', check_out: '2026-09-03', guests: 2, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-10855', guest_name: 'P. Nkemelu',    room_type_id: 'DLX', check_in: '2026-07-10', check_out: '2026-07-15', guests: 2, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-10861', guest_name: 'S. Vasquez',    room_type_id: 'STD', check_in: '2026-03-02', check_out: '2026-03-06', guests: 2, status: 'confirmed', policy_id: 'SAVER' },
  { id: 'RES-10877', guest_name: 'D. Okonjo',     room_type_id: 'SUI', check_in: '2026-06-20', check_out: '2026-06-24', guests: 4, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-10902', guest_name: 'L. Brandt',     room_type_id: 'STD', check_in: '2026-05-28', check_out: '2026-09-12', guests: 1, status: 'confirmed', policy_id: 'SAVER' },
  { id: 'RES-10914', guest_name: 'A. Ferreira',   room_type_id: 'DLX', check_in: '2026-09-01', check_out: '2026-09-05', guests: 3, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-10930', guest_name: 'T. Halvorsen',  room_type_id: 'SUI', check_in: '2026-12-28', check_out: '2027-01-02', guests: 4, status: 'confirmed', policy_id: 'SAVER' },

  // --- November: Standard Twin has 6 rooms ---
  { id: 'RES-10999', guest_name: 'R. Castellanos', room_type_id: 'STD', check_in: '2026-11-08', check_out: '2026-11-10', guests: 2, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-11001', guest_name: 'K. Umeh',        room_type_id: 'STD', check_in: '2026-11-10', check_out: '2026-11-13', guests: 2, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-11002', guest_name: 'J. Lindqvist',   room_type_id: 'STD', check_in: '2026-11-09', check_out: '2026-11-14', guests: 1, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-11003', guest_name: 'H. Moreau',      room_type_id: 'STD', check_in: '2026-11-10', check_out: '2026-11-12', guests: 2, status: 'confirmed', policy_id: 'SAVER' },
  { id: 'RES-11004', guest_name: 'B. Achebe',      room_type_id: 'STD', check_in: '2026-11-11', check_out: '2026-11-15', guests: 2, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-11005', guest_name: 'C. Iwasaki',     room_type_id: 'STD', check_in: '2026-11-10', check_out: '2026-11-11', guests: 1, status: 'confirmed', policy_id: 'FLEX' },

  // --- October: cancelled stays ---
  { id: 'RES-11080', guest_name: 'G. Petrov',   room_type_id: 'SUI', check_in: '2026-10-05', check_out: '2026-10-09', guests: 3, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-11081', guest_name: 'N. Abiodun',  room_type_id: 'SUI', check_in: '2026-10-06', check_out: '2026-10-08', guests: 2, status: 'cancelled', policy_id: 'FLEX' },
  { id: 'RES-11082', guest_name: 'V. Rossi',    room_type_id: 'DLX', check_in: '2026-10-14', check_out: '2026-10-18', guests: 2, status: 'cancelled', policy_id: 'FLEX' },
  { id: 'RES-11083', guest_name: 'W. Dlamini',  room_type_id: 'DLX', check_in: '2026-10-14', check_out: '2026-10-18', guests: 2, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-11084', guest_name: 'E. Sørensen', room_type_id: 'DLX', check_in: '2026-10-15', check_out: '2026-10-17', guests: 3, status: 'confirmed', policy_id: 'SAVER' },
  { id: 'RES-11085', guest_name: 'F. Adeyemi',  room_type_id: 'DLX', check_in: '2026-10-13', check_out: '2026-10-19', guests: 2, status: 'confirmed', policy_id: 'FLEX' },

  // --- December: suite extension case ---
  { id: 'RES-11150', guest_name: 'O. Kaminski', room_type_id: 'SUI', check_in: '2026-12-02', check_out: '2026-12-05', guests: 4, status: 'confirmed', policy_id: 'FLEX' },
  { id: 'RES-11151', guest_name: 'I. Trevisan', room_type_id: 'SUI', check_in: '2026-12-01', check_out: '2026-12-09', guests: 2, status: 'confirmed', policy_id: 'SAVER' }
];
