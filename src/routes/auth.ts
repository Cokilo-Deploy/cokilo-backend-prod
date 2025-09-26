import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { validateExtendedRegistration } from '../middleware/validation';


const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.getProfile);
router.post('/register', validateExtendedRegistration, AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);
router.post('/reset-password', AuthController.resetPassword);
router.post('/confirm-reset-password', AuthController.confirmResetPassword);
export { router as authRouter };