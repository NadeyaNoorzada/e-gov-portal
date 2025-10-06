import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function run() {
  const schema = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  await pool.query(schema);
  const seed = fs.readFileSync(path.join(__dirname, '../sql/seed.sql'), 'utf8');
  await pool.query(seed);
  console.log('Database setup complete.');
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});