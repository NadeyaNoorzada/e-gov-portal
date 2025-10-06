import express from 'express';
import { showLogin, showRegister, register, login, logout } from '../controllers/authController.js';

const router = express.Router();

router.get('/login', showLogin);
router.post('/login', login);
router.get('/register', showRegister);
router.post('/register', register);
router.post('/logout', logout);

export default router;