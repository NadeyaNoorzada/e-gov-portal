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

// ===== Proxy / HTTPS (Render) =====
app.set('trust proxy', 1);

// ===== Security & utils =====
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true })); // باید قبل از CSRF باشد
app.use(express.json());
app.use(methodOverride('_method'));

// ===== Session (PG store) =====
const PgSession = pgSession(session);
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true, // اگر جدول session نبود، خودش میسازه
    }),
    secret: process.env.SESSION_SECRET || 'change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // روی Render => true
      sameSite: 'lax', // چون SSR و همدامنهای
      maxAge: 1000 * 60 * 60 * 2, // 2h
    },
  })
);

// ===== View engine & static =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ===== CSRF (session-based) =====
const csrfProtection = csrf();

// اگر لازم داری بعضی مسیرها CSRF نخورند، اینجا تعریف کن
app.use((req, res, next) => {
  const skip = [
    /^\/citizen\/requests\/[^/]+\/upload$/i,
    /^\/logout$/i,
  ];
  if (skip.some((rx) => rx.test(req.path))) return next();
  return csrfProtection(req, res, next);
});

// پاسدادن دادهها به ویوها (از جمله csrfToken)
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  try {
    res.locals.csrfToken = req.csrfToken();
  } catch {
    res.locals.csrfToken = null;
  }
  next();
});

// ===== دیباگ موقتی (کمک برای فهم وضعیت واقعی) =====
// ببینیم توکن و سشن داریم یا نه
app.get('/csrf-dbg', csrfProtection, (req, res) => {
  res.json({
    csrfToken: req.csrfToken(),
    sessionID: req.sessionID,
    hasUser: !!req.session.user,
  });
});
// ببینیم کوکی اصلاً به سرور میرسه یا نه
app.get('/whoami', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    cookieReceived: !!req.headers.cookie,
  });
});
// لاگ موقتی روی مسیر لاگین (قبل از authRoutes اعمال بشه)
app.use((req, res, next) => {
  if (req.path === '/login') {
    console.log(
      `${req.method} /login sid=${req.sessionID} cookie?=${!!req.headers.cookie} _csrf-in-body?=${!!req.body?._csrf}`
    );
  }
  next();
});

// ===== Routes =====
app.use('/', authRoutes);
app.use('/citizen', citizenRoutes);
app.use('/officer', officerRoutes);
app.use('/admin', adminRoutes);

// ===== Home =====
app.get('/', (req, res) => res.render('home'));

// ===== CSRF error handler (403) =====
app.use((err, req, res, next) => {
  if (err && err.code === 'EBADCSRFTOKEN') {
    console.error('❌ EBADCSRFTOKEN', {
      path: req.path,
      method: req.method,
      sid: req.sessionID,
      hasCookie: !!req.headers.cookie,
    });
    return res.status(403).send('Invalid CSRF token');
  }
  return next(err);
});

// ===== Error handler =====
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).send(err?.message || 'Something went wrong');
});

// ===== Start =====
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
