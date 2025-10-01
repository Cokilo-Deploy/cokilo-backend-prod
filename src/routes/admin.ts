import express from 'express';
import { AdminController } from '../controllers/AdminController';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Routes publiques (AVANT adminAuth)
router.post('/login', AdminAuthController.login);


// Routes protégées (nécessitent adminAuth)
router.use(adminAuth);

router.get('/profile', AdminAuthController.getProfile);
router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.get('/trips', AdminController.getTrips);
router.patch('/trips/:id/status', AdminController.updateTripStatus);
router.get('/transactions', AdminController.getTransactions);
router.patch('/transactions/:id/resolve', AdminController.resolveTransaction);
router.get('/support/messages', AdminController.getSupportMessages);
router.post('/support/messages/:id/reply', AdminController.replySupportMessage);
router.get('/users/:userId', AdminController.getUserDetails);
// Routes publiques (AVANT adminAuth)
router.post('/login', AdminAuthController.login);
router.post('/create-admin', AdminAuthController.createAdmin); // NOUVELLE ROUTE
// Wallet management
router.get('/wallet/stats', AdminController.getWalletStats);
router.get('/wallet/dzd', AdminController.getDZDWallets);
router.get('/wallet/user/:userId/history', AdminController.getUserWalletHistory);
router.get('/users/:userId/withdrawals', AdminController.getUserWithdrawalRequests);
router.get('/wallet/withdrawal/:withdrawalId', AdminController.getWithdrawalDetails);
router.post('/wallet/withdrawal/:withdrawalId/approve', AdminController.approveWithdrawal);
router.post('/wallet/withdrawal/:withdrawalId/reject', AdminController.rejectWithdrawal);
//Delete management
router.delete('/users/:id', AdminController.deleteUserAccount);


export { router as adminRouter };