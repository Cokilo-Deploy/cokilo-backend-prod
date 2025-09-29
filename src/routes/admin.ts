// src/routes/admin.ts
import express from 'express';
import { AdminController } from '../controllers/AdminController';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Toutes les routes admin nécessitent une authentification admin
router.use(adminAuth);

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// Gestion utilisateurs
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);

// Gestion voyages
router.get('/trips', AdminController.getTrips);
router.patch('/trips/:id/status', AdminController.updateTripStatus);

// Gestion transactions
router.get('/transactions', AdminController.getTransactions);
router.patch('/transactions/:id/resolve', AdminController.resolveTransaction);

// Support
router.get('/support/messages', AdminController.getSupportMessages);
router.post('/support/messages/:id/reply', AdminController.replySupportMessage);

export { router as adminRouter };