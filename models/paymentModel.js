import { query } from '../config/db.js';

export async function createPayment({ request_id, amount_cents, reference }) {
  const { rows } = await query(
    `INSERT INTO payments (request_id, amount_cents, status, reference) VALUES ($1,$2,'SUCCESS',$3) RETURNING *`,
    [request_id, amount_cents, reference]
  );
  return rows[0];
}

export async function sumCollected() {
  const { rows } = await query(`SELECT COALESCE(SUM(amount_cents),0)::INT AS total FROM payments WHERE status='SUCCESS'`);
  return rows[0].total;
}