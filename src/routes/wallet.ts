import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { WalletService } from '../services/walletService';
import { WithdrawalService } from '../services/withdrawalService';

const router = Router();

// Obtenir le solde du wallet
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const balance = await WalletService.getWalletBalance(userId);
    
    // CORRECTION : S'assurer que balance est un nombre avant toFixed
    const numericBalance = Number(balance) || 0;
    
    res.json({
      success: true,
      data: { balance: Number(numericBalance.toFixed(2)) }
    });
  } catch (error) {
    console.error('Erreur récupération solde:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Dans routes/wallet.ts, modifiez la route /history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = (req as any).user;
    
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
    } else {
      // Pour les DZ : historique wallet classique
      const history = await WalletService.getWalletHistory(userId);
      
      res.json({
        success: true,
        data: { 
          transactions: history,
          type: 'manual'
        }
      });
    }
    
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Demander un retrait
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = (req as any).user;
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
      
      // Ajouter les coordonnées bancaires au compte Connect s'il n'en a pas
      await StripeConnectService.addExternalAccount(userId, bankDetails);
      
      // Effectuer le payout instantané
      const payoutId = await StripeConnectService.createPayout(userId, amount);
      
      res.json({
        success: true,
        message: 'Retrait effectué avec succès. L\'argent arrivera dans 1-2 jours ouvrés.',
        data: { 
          payoutId,
          type: 'instant',
          estimatedArrival: '1-2 jours ouvrés'
        }
      });

    } else {
      // UTILISATEUR DZ - Système manuel existant
      console.log(`🇩🇿 Retrait manuel DZ pour user ${userId}: ${amount}€`);
      
      if (!bankDetails) {
        return res.status(400).json({
          success: false,
          error: 'Coordonnées bancaires requises'
        });
      }
      
      const withdrawal = await WithdrawalService.requestWithdrawal(userId, amount, bankDetails);
      
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
    
  } catch (error: any) {
    console.error('Erreur demande retrait:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la demande de retrait' 
    });
  }
});

// Historique des retraits
router.get('/withdrawals', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = (req as any).user;
    
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
      
    } else {
      // UTILISATEUR DZ - Historique manuel
      console.log(`🇩🇿 Récupération historique manuel pour user ${userId}`);
      
      const withdrawals = await WithdrawalService.getWithdrawalHistory(userId);
      
      res.json({
        success: true,
        data: { 
          withdrawals,
          type: 'manual'
        }
      });
    }
    
  } catch (error) {
    console.error('Erreur historique retraits:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;