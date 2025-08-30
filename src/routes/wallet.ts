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
    
    res.json({
      success: true,
      data: { balance: parseFloat(balance || 0) }
    });
  } catch (error) {
    console.error('Erreur récupération solde:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Obtenir l'historique des transactions
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const history = await WalletService.getWalletHistory(userId);
    
    res.json({
      success: true,
      data: { transactions: history }
    });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Demander un retrait
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { amount, bankDetails } = req.body;
    
    if (!amount || !bankDetails) {
      return res.status(400).json({
        success: false,
        error: 'Montant et coordonnées bancaires requis'
      });
    }
    
    const withdrawal = await WithdrawalService.requestWithdrawal(userId, amount, bankDetails);
    
    res.json({
      success: true,
      message: 'Demande de retrait créée avec succès',
      data: { withdrawal }
    });
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
    const withdrawals = await WithdrawalService.getWithdrawalHistory(userId);
    
    res.json({
      success: true,
      data: { withdrawals }
    });
  } catch (error) {
    console.error('Erreur historique retraits:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;