import { query } from '../config/db.js';

//  Citizen request creation
export async function createRequest({ citizen_id, service_id, form_data }) {
  const { rows } = await query(
    `INSERT INTO requests (citizen_id, service_id, form_data)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [citizen_id, service_id, form_data]
  );
  return rows[0];
}

// Citizen requests list
export async function listCitizenRequests(citizen_id) {
  const { rows } = await query(
    `SELECT r.*, s.name AS service_name
     FROM requests r
     JOIN services s ON s.id = r.service_id
     WHERE r.citizen_id = $1
     ORDER BY r.created_at DESC`,
    [citizen_id]
  );
  return rows;
}

//Officer queue
export async function listOfficerQueuePaged(user, limit = 20, offset = 0) {
  const params = [limit, offset];
  const { rows } = await query(
    `SELECT
        r.*,
        s.name AS service_name,
        u.full_name AS citizen_name
     FROM requests r
     JOIN services s ON s.id = r.service_id
     JOIN users u ON u.id = r.citizen_id
     ORDER BY u.full_name ASC
     LIMIT $1 OFFSET $2`,
    params
  );
  return rows;
}

//Count total for pagination
export async function countOfficerRequests() {
  const { rows } = await query(`SELECT COUNT(*)::int AS total FROM requests`);
  return rows[0].total;
}

// Request detail
export async function getRequestDetail(id) {
  const { rows } = await query(
    `SELECT
        r.*,
        s.name AS service_name,
        s.fee_cents,
        u.full_name AS citizen_name
     FROM requests r
     JOIN services s ON s.id = r.service_id
     JOIN users u ON u.id = r.citizen_id
     WHERE r.id = $1`,
    [id]
  );
  return rows[0] || null;
}

// Update request status
export async function updateStatus(id, status, assigned_officer_id = null) {
  const { rows } = await query(
    `UPDATE requests
     SET status = $2,
         assigned_officer_id = COALESCE($3, assigned_officer_id),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, assigned_officer_id]
  );
  return rows[0];
}
