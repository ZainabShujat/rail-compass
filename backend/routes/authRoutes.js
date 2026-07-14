import express from 'express';
import { googleLogin, updatePreferences, getMe, protect } from '../controllers/authController.js';

const router = express.Router();

// Public route for Google authentication
router.post('/google', googleLogin);

// Protected routes (require valid JWT)
router.get('/me', protect, getMe);
router.post('/onboarding', protect, updatePreferences);

export default router;
