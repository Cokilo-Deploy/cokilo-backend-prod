import { Wallet } from '../models/Wallet';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

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
      // CORRECTION : Utiliser user_id au lieu de wallet_id pour la table wallets
      await sequelize.query(
        'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
        {
          bind: [amount, userId],
          transaction
        }
      );
      
      // CORRECTION : Supprimer status et corriger la syntaxe
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

  static async getWalletBalance(userId: number): Promise<number> {
    // CORRECTION : Utiliser user_id au lieu de wallet_id
    const result = await sequelize.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];
    
    return result[0]?.balance || 0;
  }

  static async getWalletHistory(userId: number) {
    // CORRECTION : Utiliser user_id dans la condition WHERE
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