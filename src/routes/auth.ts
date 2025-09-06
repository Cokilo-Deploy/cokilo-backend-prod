import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { validateExtendedRegistration } from '../middleware/validation';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.getProfile);
router.post('/register', validateExtendedRegistration, AuthController.register);

export { router as authRouter };