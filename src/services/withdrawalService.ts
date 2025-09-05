import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

export class WithdrawalService {
  static async requestWithdrawal(userId: number, amount: number, bankDetails: any) {
    // Vérifier le solde disponible
    const walletResult = await sequelize.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1',
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];
    
    if (walletResult.length === 0) {
      throw new Error('Wallet non trouvé');
    }
    
    const wallet = walletResult[0];
    
    if (parseFloat(wallet.balance) < amount) {
      throw new Error('Solde insuffisant');
    }
    
    if (amount < 1) {
      throw new Error('Montant minimum de retrait: 1€');
    }
    
    // Transaction atomique avec Sequelize
    const transaction = await sequelize.transaction();
    
    try {
      // Débiter le wallet
      await sequelize.query(
        'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
        {
          bind: [amount, wallet.id],
          transaction
        }
      );
      
      // Créer la demande de retrait
      const withdrawalResult = await sequelize.query(
        `INSERT INTO withdrawal_requests 
         (wallet_id, amount, bank_account_name, bank_account_number, bank_name, bank_code, status, requested_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
         RETURNING *`,
        {
          bind: [
            wallet.id,
            amount,
            bankDetails.accountName,
            bankDetails.accountNumber,
            bankDetails.bankName,
            bankDetails.bankCode
          ],
          type: QueryTypes.INSERT,
          transaction
        }
      ) as any;
      
      // Enregistrer le mouvement dans wallet_transactions
      await sequelize.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, description, status, requested_at)
         VALUES ($1, 'debit', $2, $3, 'completed', NOW(), NOW())`,
        {
          bind: [wallet.id, amount, `Demande de retrait #${withdrawalResult[0][0].id}`],
          transaction
        }
      );
      
      await transaction.commit();
      
      return withdrawalResult[0][0];
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  static async getWithdrawalHistory(userId: number) {
    const result = await sequelize.query(
      `SELECT wr.* FROM withdrawal_requests wr
       JOIN wallets w ON wr.wallet_id = w.id
       WHERE w.user_id = $1
       ORDER BY wr.requested_at DESC`,
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    );
    
    return result;
  }
  
  static async updateWithdrawalStatus(withdrawalId: number, status: string, notes?: string) {
  const updateQuery = notes 
    ? 'UPDATE withdrawal_requests SET status = $1, notes = $2, processed_at = NOW() WHERE id = $3 RETURNING *'
    : 'UPDATE withdrawal_requests SET status = $1, processed_at = NOW() WHERE id = $2 RETURNING *';
  
  const params = notes ? [status, notes, withdrawalId] : [status, withdrawalId];
  
  const result = await sequelize.query(updateQuery, {
    bind: params,
    type: QueryTypes.SELECT  // Changez UPDATE en SELECT
  }) as any[];
  
  return result[0];  // Supprimez [0] supplémentaire
}
}