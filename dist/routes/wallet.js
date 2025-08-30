"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const walletService_1 = require("../services/walletService");
const withdrawalService_1 = require("../services/withdrawalService");
const router = (0, express_1.Router)();
// Obtenir le solde du wallet
router.get('/balance', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const balance = await walletService_1.WalletService.getWalletBalance(userId);
        res.json({
            success: true,
            data: { balance: parseFloat(balance || 0) }
        });
    }
    catch (error) {
        console.error('Erreur récupération solde:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});
// Obtenir l'historique des transactions
router.get('/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await walletService_1.WalletService.getWalletHistory(userId);
        res.json({
            success: true,
            data: { transactions: history }
        });
    }
    catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});
// Demander un retrait
router.post('/withdraw', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, bankDetails } = req.body;
        if (!amount || !bankDetails) {
            return res.status(400).json({
                success: false,
                error: 'Montant et coordonnées bancaires requis'
            });
        }
        const withdrawal = await withdrawalService_1.WithdrawalService.requestWithdrawal(userId, amount, bankDetails);
        res.json({
            success: true,
            message: 'Demande de retrait créée avec succès',
            data: { withdrawal }
        });
    }
    catch (error) {
        console.error('Erreur demande retrait:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Erreur lors de la demande de retrait'
        });
    }
});
// Historique des retraits
router.get('/withdrawals', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const withdrawals = await withdrawalService_1.WithdrawalService.getWithdrawalHistory(userId);
        res.json({
            success: true,
            data: { withdrawals }
        });
    }
    catch (error) {
        console.error('Erreur historique retraits:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});
exports.default = router;
