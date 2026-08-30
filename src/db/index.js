import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { seed } from './seed.js';
import { seedFolios } from './seed-folios.js';
import { reservations } from './seed-data.js';

const here = dirname(fileURLToPath(import.meta.url));

let db;

export function getDb() {
  if (!db) {
    db = new DatabaseSync(':memory:');
    db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));
    seed(db);
    seedFolios(reservations);
  }
  return db;
}
