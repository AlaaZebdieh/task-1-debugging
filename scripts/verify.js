/**
 * Replays the reference fixture (fixtures/expected.csv) against this service and
 * reports every row whose result differs from the reference system.
 *
 *   npm run verify            all rows
 *   npm run verify -- QUOTE   only rows of that kind
 */
import { readFileSync } from 'node:fs';
import { createApp } from '../src/app.js';
import { runCase } from './runner.js';

const filter = process.argv[2];

const rows = readFileSync(new URL('../fixtures/expected.csv', import.meta.url), 'utf8')
  .trim()
  .split('\n')
  .slice(1)
  .map((line) => {
    const [id, kind, target, arg1, arg2, expected] = line.split(',');
    return { id, kind, roomTypeId: target, a: arg1, b: arg2, expected };
  })
  .filter((row) => !filter || row.kind === filter);

const server = createApp().listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const failures = [];
for (const row of rows) {
  let actual;
  try {
    actual = await runCase(base, row);
  } catch (error) {
    actual = `threw: ${error.message}`;
  }
  if (actual !== row.expected) failures.push({ ...row, actual });
}
server.close();

const byKind = {};
for (const failure of failures) (byKind[failure.kind] ??= []).push(failure);

console.log(`\n  ${rows.length - failures.length}/${rows.length} rows match the reference system\n`);

for (const [kind, list] of Object.entries(byKind)) {
  console.log(`  ${kind}: ${list.length} mismatched`);
  for (const f of list.slice(0, 8)) {
    console.log(`    ${f.id}  ${f.roomTypeId} ${f.a}..${f.b}`);
    console.log(`        expected ${f.expected}`);
    console.log(`        actual   ${f.actual}`);
  }
  if (list.length > 8) console.log(`    ... and ${list.length - 8} more (ids: ${list.slice(8).map((f) => f.id).join(' ')})`);
  console.log('');
}

process.exit(failures.length ? 1 : 0);
