import { Wallet } from '../models/Wallet';
import { User } from '../models/User';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export class WalletService {
  static async getOrCreateWallet(userId: number) {
    let wallet = await Wallet.findOne({ where: { userId } });
    
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0.00 });
    }
    
    return wallet;
  }

  static async creditWallet(userId: number, amount: number, transactionId: number, description: string) {
    const wallet = await this.getOrCreateWallet(userId);
    
    const transaction = await sequelize.transaction();
    
    try {
      await sequelize.query(
        'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
        {
          bind: [amount, userId],
          transaction
        }
      );
      
      await sequelize.query(
        `INSERT INTO wallet_transactions (wallet_id, transaction_id, type, amount, description, created_at)
         VALUES ($1, $2, 'credit', $3, $4, NOW())`,
        {
          bind: [wallet.id, transactionId, amount, description],
          transaction
        }
      );
      
      await transaction.commit();
      
      return await this.getWalletBalance(userId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Fonction originale - retourne juste le solde total
  static async getWalletBalance(userId: number): Promise<number> {
    const detailed = await this.getDetailedWalletBalance(userId);
    return detailed.totalBalance;
  }

  // Nouvelle fonction détaillée
  static async getDetailedWalletBalance(userId: number): Promise<{
    totalBalance: number;
    availableBalance: number;
    pendingBalance: number;
    currency: string;
  }> {
    try {
      const user = await User.findByPk(userId);
      
      if (user?.paymentMethod === 'stripe_connect' && user.stripeConnectedAccountId) {
        try {
          const balance = await stripe.balance.retrieve({
            stripeAccount: user.stripeConnectedAccountId
          });
          
          const availableBalance = balance.available.find(b => b.currency === 'eur') || 
                                 balance.available.find(b => b.currency === 'usd') ||
                                 balance.available[0];
          
          const pendingBalance = balance.pending.find(b => b.currency === (availableBalance?.currency || 'eur')) ||
                               balance.pending[0];
          
          const available = availableBalance ? (availableBalance.amount / 100) : 0;
          const pending = pendingBalance ? (pendingBalance.amount / 100) : 0;
          const total = available + pending;
          
          console.log(`💳 Solde Connect détaillé user ${userId}:`, {
            total,
            available,
            pending,
            currency: availableBalance?.currency || 'EUR'
          });
          
          return {
            totalBalance: total,
            availableBalance: available,
            pendingBalance: pending,
            currency: availableBalance?.currency?.toUpperCase() || 'EUR'
          };
          
        } catch (stripeError) {
          console.error('Erreur récupération solde Connect:', stripeError);
          return this.getVirtualWalletBalance(userId);
        }
      } else {
        return this.getVirtualWalletBalance(userId);
      }
    } catch (error) {
      console.error('Erreur getDetailedWalletBalance:', error);
      return { totalBalance: 0, availableBalance: 0, pendingBalance: 0, currency: 'EUR' };
    }
  }

  // Fonction pour wallet virtuel en format détaillé
  static async getVirtualWalletBalance(userId: number): Promise<{
    totalBalance: number;
    availableBalance: number;
    pendingBalance: number;
    currency: string;
  }> {
    const result = await sequelize.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];
    
    const balance = result[0]?.balance || 0;
    console.log(`💰 Solde wallet virtuel pour user ${userId}: ${balance}`);
    
    return {
      totalBalance: balance,
      availableBalance: balance,
      pendingBalance: 0,
      currency: 'EUR'
    };
  }

  static async getWalletHistory(userId: number) {
    const result = await sequelize.query(
      `SELECT wt.*, t.id as transaction_number
       FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       LEFT JOIN transactions t ON wt.transaction_id = t.id
       WHERE w.user_id = $1
       ORDER BY wt.created_at DESC`,
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    );
    
    return result;
  }
}