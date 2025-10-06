import bcrypt from 'bcrypt';
import { findByEmail, createUser } from '../models/userModel.js';

export function showLogin(req, res) {
  res.render('auth/login');
}
export function showRegister(req, res) {
  res.render('auth/register');
}

export async function register(req, res, next) {
  try {
    const { email, full_name, password } = req.body;
    const exists = await findByEmail(email);
    if (exists) {
      req.session.error = 'Email already registered';
      return res.redirect('/register');
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, full_name, password_hash, role: 'CITIZEN' });
    req.session.user = { id: user.id, role: user.role, full_name: user.full_name };
    req.session.success = 'Welcome!';
    res.redirect('/citizen/dashboard');
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await findByEmail(email);
    if (!user) {
      req.session.error = 'Invalid credentials';
      return res.redirect('/login');
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      req.session.error = 'Invalid credentials';
      return res.redirect('/login');
    }
    req.session.user = { id: user.id, role: user.role, full_name: user.full_name, department_id: user.department_id };
    req.session.success = 'Logged in';
    if (user.role === 'CITIZEN') return res.redirect('/citizen/dashboard');
    if (user.role === 'ADMIN') return res.redirect('/admin/dashboard');
    return res.redirect('/officer/dashboard');
  } catch (e) { next(e); }
}

export function logout(req, res) {
  req.session.destroy(() => res.redirect('/login'));
}