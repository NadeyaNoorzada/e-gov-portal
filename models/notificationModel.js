import { query } from '../config/db.js';

export async function notify(user_id, message) {
  await query('INSERT INTO notifications (user_id, message) VALUES ($1,$2)', [user_id, message]);
}

export async function listNotifications(user_id) {
  const { rows } = await query(
    'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
    [user_id]
  );
  return rows;
}