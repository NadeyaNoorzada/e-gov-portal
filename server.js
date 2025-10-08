import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import methodOverride from 'method-override';
// import helmet from 'helmet';        // ❌ فعلاً غیرفعال
import morgan from 'morgan';
// import csrf from 'csurf';           // ❌ فعلاً غیرفعال
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

// ========= Proxy awareness (Render/Cloudflare) =========
app.set('trust proxy', 1);

// ========= Security & utils =========
// app.use(helmet());                 // ❌ موقتاً غیرفعال
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ========= Session (PG store) =========
const PgSession = pgSession(session);
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,      // اگر جدول نبود، بساز
    }),
    secret: process.env.SESSION_SECRET || 'change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // روی Render فعال میشود
      sameSite: 'lax',                                // چون SSR و همدامنهای
      maxAge: 1000 * 60 * 60 * 2,                    // 2h
    },
  })
);

// ========= View engine & static =========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ========= CSRF (غیرفعال) =========
// const csrfProtection = csrf();
// app.use((req, res, next) => {
//   const skip = [/^\/citizen\/requests\/[^/]+\/upload$/i, /^\/logout$/i];
//   if (skip.some(rx => rx.test(req.path))) return next();
//   return csrfProtection(req, res, next);
// });

// Locals برای ویوها (csrfToken را خالی بده تا EJS ارور نده)
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.csrfToken = ''; // چون CSRF خاموشه
  next();
});

// ========= Routes =========
app.use('/', authRoutes);
app.use('/citizen', citizenRoutes);
app.use('/officer', officerRoutes);
app.use('/admin', adminRoutes);

// ========= Home =========
app.get('/', (req, res) => res.render('home'));

// ========= Error handler =========
app.use((err, req, res, next) => {
  console.error(err);
  const msg = err?.message || 'Something went wrong';
  res.status(500).send(msg);
});

// ========= Start =========
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
