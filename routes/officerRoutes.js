import express from 'express';
import { ensureAuth, ensureRole } from '../utils/authMiddleware.js';
import { dashboard, reviewDetail, decide } from '../controllers/officerController.js';

const router = express.Router();

router.use(ensureAuth, ensureRole('OFFICER','DEPT_HEAD','ADMIN'));
router.get('/dashboard', dashboard);
router.get('/requests/:id', reviewDetail);
router.post('/requests/:id/decision', decide);

export default router;