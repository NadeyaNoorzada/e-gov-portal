import { allDepartments } from '../models/departmentModel.js';
import { allActiveServices } from '../models/serviceModel.js';
import { query } from '../config/db.js';
import { sumCollected } from '../models/paymentModel.js';

export async function dashboard(req, res, next) {
  try {
    const [deps, services, stats, money] = await Promise.all([
      allDepartments(),
      allActiveServices(),
      query(`SELECT d.name AS department, COUNT(r.id)::INT AS total, 
                    SUM(CASE WHEN r.status='APPROVED' THEN 1 ELSE 0 END)::INT AS approved, 
                    SUM(CASE WHEN r.status='REJECTED' THEN 1 ELSE 0 END)::INT AS rejected 
             FROM departments d 
             LEFT JOIN services s ON s.department_id=d.id 
             LEFT JOIN requests r ON r.service_id=s.id 
             GROUP BY d.name ORDER BY d.name`),
      sumCollected()
    ]);

    // Calculate totals for dashboard KPIs
    const totals = {
      requests: stats.rows.reduce((sum, r) => sum + (r.total || 0), 0),
      approval_rate: stats.rows.length ? (stats.rows.reduce((sum, r) => sum + (r.approved || 0), 0) / Math.max(1, stats.rows.reduce((sum, r) => sum + (r.total || 0), 0))) * 100 : 0,
      open_requests: 0,
      pending_review: 0,
      today_processed: 0,
      today_rate: 0
    };

    res.render('admin/dashboard', { deps, services, reports: stats.rows, money, totals, q: req.query.q || '', activity: [] });
  } catch (e) { next(e); }
}

export async function users(req, res, next) {
  try {
    console.log('Query params:', req.query); 
    const { q, role } = req.query;
    const values = [];
    const where = [];
    if (q && q.trim()) {
      values.push(`%${q.trim()}%`);
      where.push(`(full_name ILIKE $${values.length} OR email ILIKE $${values.length})`);
    }
    if (role && role.trim()) {
      values.push(role.trim().toUpperCase()); 
      where.push(`UPPER(role) = $${values.length}`);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `SELECT id, email, full_name, role FROM users ${whereClause} ORDER BY created_at DESC LIMIT 200`;
    console.log('User filter SQL:', sql, 'Params:', values);
    const { rows } = await query(sql, values);
    res.render('admin/users', {
      users: rows,
      q: q || '',
      role: role || '',
      csrfToken: req.csrfToken()
    });
  } catch (e) { next(e); }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.redirect('/admin/users');
  } catch (e) { next(e); }
}