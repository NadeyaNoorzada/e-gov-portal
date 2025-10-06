import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureAuth, ensureRole } from '../utils/authMiddleware.js';
import { dashboard, showApply, submitApply, requestDetail, uploadDoc } from '../controllers/citizenController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });
const router = express.Router();

router.use(ensureAuth, ensureRole('CITIZEN','ADMIN'));
router.get('/dashboard', dashboard);
router.get('/apply', showApply);
router.post('/apply', submitApply);
router.get('/requests/:id', requestDetail);
router.post('/requests/:id/upload', upload.single('document'), uploadDoc);

export default router;