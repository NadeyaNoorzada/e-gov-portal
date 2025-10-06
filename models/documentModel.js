import { query } from '../config/db.js';

export async function addDocument({ request_id, original_name, mime_type, path }) {
  const { rows } = await query(
    `INSERT INTO documents (request_id, original_name, mime_type, path) VALUES ($1,$2,$3,$4) RETURNING *`,
    [request_id, original_name, mime_type, path]
  );
  return rows[0];
}

export async function listDocs(request_id) {
  const { rows } = await query(
    'SELECT * FROM documents WHERE request_id=$1 ORDER BY uploaded_at DESC',
    [request_id]
  );
  return rows;
}