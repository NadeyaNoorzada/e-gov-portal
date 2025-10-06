import express from 'express';
import { ensureAuth, ensureRole } from '../utils/authMiddleware.js';
import { dashboard, users, deleteUser } from '../controllers/adminController.js';

const router = express.Router();

router.use(ensureAuth, ensureRole('ADMIN'));
router.get('/dashboard', dashboard);
router.get('/users', users);
router.delete('/users/:id', deleteUser);

export default router;