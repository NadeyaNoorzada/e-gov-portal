import { query } from '../config/db.js';

export async function allDepartments() {
  const { rows } = await query('SELECT * FROM departments ORDER BY name');
  return rows;
}