import express from 'express';
import { AdminController } from '../controllers/AdminController';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Routes publiques (pas de auth)
router.post('/login', AdminAuthController.login);

// Routes protégées (nécessitent adminAuth)
router.use(adminAuth);

router.get('/profile', AdminAuthController.getProfile);
router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.get('/trips', AdminController.getTrips);
router.patch('/trips/:id/status', AdminController.updateTripStatus);
router.get('/transactions', AdminController.getTransactions);
router.patch('/transactions/:id/resolve', AdminController.resolveTransaction);
router.get('/support/messages', AdminController.getSupportMessages);
router.post('/support/messages/:id/reply', AdminController.replySupportMessage);

export { router as adminRouter };