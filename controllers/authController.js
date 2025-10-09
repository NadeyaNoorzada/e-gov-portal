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

  
    req.session.regenerate(err => {
      if (err) return next(err);

      req.session.user = { id: user.id, role: user.role, full_name: user.full_name };
      req.session.success = 'Welcome!';

      req.session.save(err2 => {
        if (err2) return next(err2);
        return res.redirect('/citizen/dashboard'); 
      });
    });
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

  
    req.session.regenerate(err => {
      if (err) return next(err);

      req.session.user = {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
        department_id: user.department_id
      };
      req.session.success = 'Logged in';

      const target =
        user.role === 'CITIZEN' ? '/citizen/dashboard' :
        user.role === 'ADMIN'   ? '/admin/dashboard'   :
                                  '/officer/dashboard';

      req.session.save(err2 => {
        if (err2) return next(err2);
        return res.redirect(target);
      });
    });
  } catch (e) { next(e); }
}

export function logout(req, res, next) {

  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
}
