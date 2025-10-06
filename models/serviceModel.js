import { query } from '../config/db.js';

export async function allActiveServices() {
  const { rows } = await query(
    `SELECT s.*, d.name AS department_name 
    FROM services s JOIN departments d ON d.id=s.department_id 
    WHERE s.is_active=TRUE 
    ORDER BY d.name, s.name`
  );
  return rows;
}

export async function findService(id) {
  const { rows } = await query('SELECT * FROM services WHERE id=$1', [id]);
  return rows[0] || null;
}

