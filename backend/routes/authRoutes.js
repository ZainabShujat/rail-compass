import express from 'express';
import { googleLogin, updatePreferences, getMe, protect, register, login, updateProfile } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/google', googleLogin);
router.post('/register', register);
router.post('/login', login);

// Protected routes (require valid JWT)
router.get('/me', protect, getMe);
router.post('/onboarding', protect, updatePreferences);
router.put('/profile', protect, updateProfile);

export default router;
