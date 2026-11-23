import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const config = fileURLToPath(new URL('../dist/server/wrangler.json', import.meta.url));
const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const deployment = JSON.parse(readFileSync(config, 'utf8'));
const binding = deployment.d1_databases?.find(item => item.binding === 'DB');
if (binding?.database_id !== '012d6c00-3382-4bdc-82cf-f475c2e5a193') {
  throw new Error('Refusing database preparation: the production DB binding does not match fdb-db.');
}
function execute(sql) {
  const result = spawnSync(process.execPath, [wrangler, 'd1', 'execute', 'DB', '--remote', '--config', config, '--command', sql, '--json'], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || 'D1 preparation failed.\n');
    throw new Error('Database preparation failed; deployment stopped.');
  }
  const responses = JSON.parse(result.stdout);
  if (!Array.isArray(responses) || responses.some(response => response.success !== true)) {
    throw new Error('D1 did not confirm database preparation; deployment stopped.');
  }
  return responses;
}
// Repair missing schema without deleting reservations or replaying ALTER TABLE.
execute(`CREATE TABLE IF NOT EXISTS reservations (
  id text PRIMARY KEY NOT NULL, first_name text NOT NULL,
  last_name text NOT NULL, experience text NOT NULL,
  created_at text NOT NULL, request_id text NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id text PRIMARY KEY NOT NULL, bucket integer NOT NULL, attempts integer NOT NULL
);`);
const columns = execute('PRAGMA table_info(reservations)')[0].results;
if (!Array.isArray(columns) || !columns.some(column => column.name === 'request_id')) {
  throw new Error('Unexpected reservations schema; deployment stopped.');
}
if (!columns.some(column => column.name === 'guest_key')) {
  execute('ALTER TABLE reservations ADD COLUMN guest_key text');
}
if (!columns.some(column => column.name === 'dietary_notes')) {
  execute('ALTER TABLE reservations ADD COLUMN dietary_notes text');
}
if (!columns.some(column => column.name === 'edit_token_hash')) {
  execute('ALTER TABLE reservations ADD COLUMN edit_token_hash text');
}
execute(`CREATE UNIQUE INDEX IF NOT EXISTS reservations_request_id_unique ON reservations (request_id);
CREATE UNIQUE INDEX IF NOT EXISTS reservations_guest_key_unique ON reservations (guest_key);`);
console.log('Production RSVP database schema verified.');
