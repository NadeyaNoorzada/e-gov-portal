import { query } from '../config/db.js';

export async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email=$1', [email]);
  return rows[0] || null;
}

export async function createUser({ email, password_hash, full_name, role = 'CITIZEN' }) {
  const { rows } = await query(
    'INSERT INTO users(email,password_hash,full_name,role) VALUES ($1,$2,$3,$4) RETURNING *',
    [email, password_hash, full_name, role]
  );
  return rows[0];
}

export async function getOfficersByDept(department_id) {
  const { rows } = await query(
    "SELECT id, full_name FROM users WHERE role IN ('OFFICER','DEPT_HEAD') AND department_id=$1",
    [department_id]
  );
  return rows;
}