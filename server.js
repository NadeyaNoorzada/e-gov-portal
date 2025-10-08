import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import methodOverride from 'method-override';
import helmet from 'helmet';
import morgan from 'morgan';
import csrf from 'csurf';
import dotenv from 'dotenv';

import { pool } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import citizenRoutes from './routes/citizenRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ================= Proxy / HTTPS =================
app.set('trust proxy', 1); // NEW: روی Render لازم است تا کوکی secure درست کار کند

// ================= Security & utils =================
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ================= Session =================
const PgSession = pgSession(session);
app.use(
  session({
    store: new PgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // در Render معمولاً true میشود
      sameSite: 'lax', // NEW: چون SSR و همدامنهای هستی
      maxAge: 1000 * 60 * 60 * 2 // 2 hours
    }
  })
);

// ================= View engine & static =================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve /public directly from root
app.use(express.static(path.join(__dirname, 'public')));

// ================= CSRF =================
const csrfProtection = csrf();

app.use((req, res, next) => {
  const skip = [
    /^\/citizen\/requests\/[^/]+\/upload$/i,
    /^\/logout$/i,
  ];
  if (skip.some(rx => rx.test(req.path))) return next();
  return csrfProtection(req, res, next);
});

// Pass locals to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  try {
    res.locals.csrfToken = req.csrfToken();
  } catch {
    res.locals.csrfToken = null;
  }
  next();
});

// ================= Routes =================
app.use('/', authRoutes);
app.use('/citizen', citizenRoutes);
app.use('/officer', officerRoutes);
app.use('/admin', adminRoutes);

// ================= Home =================
app.get('/', (req, res) => res.render('home'));

// ============ CSRF error handler (403) ============
app.use((err, req, res, next) => { // NEW
  if (err && err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF error:', err.message);
    return res.status(403).send('Invalid CSRF token');
  }
  return next(err);
});

// ================= Error handler =================
app.use((err, req, res, next) => {
  console.error(err);
  const msg = err?.message || 'Something went wrong';
  res.status(500).send(msg);
});

// ================= Server start =================
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`✅ Server running on http://localhost:${port}`)
);
