"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = __importDefault(require("express"));
const AdminController_1 = require("../controllers/AdminController");
const AdminAuthController_1 = require("../controllers/AdminAuthController");
const adminAuth_1 = require("../middleware/adminAuth");
const router = express_1.default.Router();
exports.adminRouter = router;
// Routes publiques (AVANT adminAuth)
router.post('/login', AdminAuthController_1.AdminAuthController.login);
// Routes protégées (nécessitent adminAuth)
router.use(adminAuth_1.adminAuth);
router.get('/profile', AdminAuthController_1.AdminAuthController.getProfile);
router.get('/dashboard', AdminController_1.AdminController.getDashboard);
router.get('/users', AdminController_1.AdminController.getUsers);
router.patch('/users/:id/status', AdminController_1.AdminController.updateUserStatus);
router.get('/trips', AdminController_1.AdminController.getTrips);
router.patch('/trips/:id/status', AdminController_1.AdminController.updateTripStatus);
router.get('/transactions', AdminController_1.AdminController.getTransactions);
router.patch('/transactions/:id/resolve', AdminController_1.AdminController.resolveTransaction);
router.get('/support/messages', AdminController_1.AdminController.getSupportMessages);
router.post('/support/messages/:id/reply', AdminController_1.AdminController.replySupportMessage);
router.get('/users/:userId', AdminController_1.AdminController.getUserDetails);
// Routes publiques (AVANT adminAuth)
router.post('/login', AdminAuthController_1.AdminAuthController.login);
router.post('/create-admin', AdminAuthController_1.AdminAuthController.createAdmin); // NOUVELLE ROUTE
// Wallet management
router.get('/wallet/stats', AdminController_1.AdminController.getWalletStats);
router.get('/wallet/dzd', AdminController_1.AdminController.getDZDWallets);
router.get('/wallet/user/:userId/history', AdminController_1.AdminController.getUserWalletHistory);
router.get('/users/:userId/withdrawals', AdminController_1.AdminController.getUserWithdrawalRequests);
router.get('/wallet/withdrawal/:withdrawalId', AdminController_1.AdminController.getWithdrawalDetails);
router.post('/wallet/withdrawal/:withdrawalId/approve', AdminController_1.AdminController.approveWithdrawal);
router.post('/wallet/withdrawal/:withdrawalId/reject', AdminController_1.AdminController.rejectWithdrawal);
//Delete management
router.delete('/users/:id', AdminController_1.AdminController.deleteUserAccount);
