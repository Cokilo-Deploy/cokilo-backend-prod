"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const walletService_1 = require("../services/walletService");
const withdrawalService_1 = require("../services/withdrawalService");
const responseHelpers_1 = require("../utils/responseHelpers");
const TranslationService_1 = require("../services/TranslationService");
const router = (0, express_1.Router)();
// Obtenir le solde du wallet
router.get('/balance', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const balance = await walletService_1.WalletService.getWalletBalance(userId);
        // CORRECTION : S'assurer que balance est un nombre avant toFixed
        const numericBalance = Number(balance) || 0;
        res.json({
            success: true,
            data: { balance: Number(numericBalance.toFixed(2)) }
        });
    }
    catch (error) {
        console.error('Erreur récupération solde:', error);
        return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
    }
});
// Dans routes/wallet.ts, modifiez la route /history
router.get('/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = req.user;
        if (user.paymentMethod === 'stripe_connect' && user.stripeConnectedAccountId) {
            // Pour les EU : séparer les gains (transfers reçus) des retraits (payouts)
            const { StripeConnectService } = require('../services/StripeConnectService');
            // Gains = transfers reçus sur le compte Connect
            const transfers = await StripeConnectService.getTransferHistory(userId);
            res.json({
                success: true,
                data: {
                    transactions: transfers, // Seulement les gains
                    type: 'stripe_connect'
                }
            });
        }
        else {
            // Pour les DZ : historique wallet classique
            const history = await walletService_1.WalletService.getWalletHistory(userId);
            res.json({
                success: true,
                data: {
                    transactions: history,
                    type: 'manual'
                }
            });
        }
    }
    catch (error) {
        console.error('Erreur récupération historique:', error);
        return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
    }
});
// Demander un retrait
router.post('/withdraw', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = req.user;
        const { amount, bankDetails } = req.body;
        if (!amount) {
            return res.status(400).json({
                success: false,
                error: 'Montant requis'
            });
        }
        // Vérifier le type d'utilisateur
        if (user.paymentMethod === 'stripe_connect' && user.stripeConnectedAccountId) {
            // UTILISATEUR EU - Payout Stripe instantané
            console.log(`🇪🇺 Retrait instantané EU pour user ${userId}: ${amount}€`);
            if (!bankDetails) {
                return res.status(400).json({
                    success: false,
                    error: 'Coordonnées bancaires requises pour le premier retrait'
                });
            }
            const { StripeConnectService } = require('../services/StripeConnectService');
            try {
                // Ajouter les coordonnées bancaires au compte Connect s'il n'en a pas
                await StripeConnectService.addExternalAccount(userId, bankDetails);
                // Effectuer le payout instantané
                const payoutId = await StripeConnectService.createPayout(userId, amount);
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.withdrawal_success_stripe', {
                    payoutId,
                    type: 'instant',
                    estimatedArrival: TranslationService_1.translationService.t('msg.estimated_arrival_1_2_days', user)
                }, 200, user);
            }
            catch (error) {
                console.error('❌ Erreur retrait Stripe:', error);
                const errorKey = error.message?.startsWith('msg.')
                    ? error.message
                    : 'msg.error_withdrawal';
                return (0, responseHelpers_1.sendLocalizedResponse)(res, errorKey, null, 500, user);
            }
        }
        else {
            // UTILISATEUR DZ - Système manuel existant
            console.log(`🇩🇿 Retrait manuel DZ pour user ${userId}: ${amount}€`);
            if (!bankDetails) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.bank_details_required', null, 400, user);
            }
            const withdrawal = await withdrawalService_1.WithdrawalService.requestWithdrawal(userId, amount, bankDetails);
            res.json({
                success: true,
                message: 'Demande de retrait créée avec succès. Vous recevrez votre argent dans 5-7 jours.',
                data: {
                    withdrawal,
                    type: 'manual',
                    estimatedArrival: '5-7 jours'
                }
            });
        }
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
        const user = req.user;
        if (user.paymentMethod === 'stripe_connect' && user.stripeConnectedAccountId) {
            // UTILISATEUR EU - Historique Stripe Connect
            console.log(`🇪🇺 Récupération historique Stripe Connect pour user ${userId}`);
            const { StripeConnectService } = require('../services/StripeConnectService');
            const stripeHistory = await StripeConnectService.getPayoutHistory(userId);
            res.json({
                success: true,
                data: {
                    withdrawals: stripeHistory,
                    type: 'stripe_connect'
                }
            });
        }
        else {
            // UTILISATEUR DZ - Historique manuel
            console.log(`🇩🇿 Récupération historique manuel pour user ${userId}`);
            const withdrawals = await withdrawalService_1.WithdrawalService.getWithdrawalHistory(userId);
            res.json({
                success: true,
                data: {
                    withdrawals,
                    type: 'manual'
                }
            });
        }
    }
    catch (error) {
        console.error('Erreur historique retraits:', error);
        return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user);
    }
});
exports.default = router;
