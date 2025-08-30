"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalService = void 0;
const database_1 = require("../config/database");
class WithdrawalService {
    static async requestWithdrawal(userId, amount, bankDetails) {
        // Vérifier le solde disponible
        const walletResult = await database_1.db.query('SELECT id, balance FROM wallets WHERE user_id = $1', [userId]);
        if (walletResult.rows.length === 0) {
            throw new Error('Wallet non trouvé');
        }
        const wallet = walletResult.rows[0];
        if (parseFloat(wallet.balance) < amount) {
            throw new Error('Solde insuffisant');
        }
        if (amount < 50) {
            throw new Error('Montant minimum de retrait: 50€');
        }
        // Transaction atomique
        await database_1.db.query('BEGIN');
        try {
            // Débiter le wallet
            await database_1.db.query('UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2', [amount, wallet.id]);
            // Créer la demande de retrait
            const withdrawalResult = await database_1.db.query(`INSERT INTO withdrawal_requests 
         (wallet_id, amount, bank_account_name, bank_account_number, bank_name, bank_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`, [
                wallet.id,
                amount,
                bankDetails.accountName,
                bankDetails.accountNumber,
                bankDetails.bankName,
                bankDetails.bankCode
            ]);
            // Enregistrer le mouvement dans wallet_transactions
            await database_1.db.query(`INSERT INTO wallet_transactions (wallet_id, type, amount, description, status)
         VALUES ($1, 'debit', $2, $3, 'completed')`, [wallet.id, amount, `Demande de retrait #${withdrawalResult.rows[0].id}`]);
            await database_1.db.query('COMMIT');
            return withdrawalResult.rows[0];
        }
        catch (error) {
            await database_1.db.query('ROLLBACK');
            throw error;
        }
    }
    static async getWithdrawalHistory(userId) {
        const result = await database_1.db.query(`SELECT wr.* FROM withdrawal_requests wr
       JOIN wallets w ON wr.wallet_id = w.id
       WHERE w.user_id = $1
       ORDER BY wr.requested_at DESC`, [userId]);
        return result.rows;
    }
    static async updateWithdrawalStatus(withdrawalId, status, notes) {
        const updateQuery = notes
            ? 'UPDATE withdrawal_requests SET status = $1, notes = $2, processed_at = NOW() WHERE id = $3 RETURNING *'
            : 'UPDATE withdrawal_requests SET status = $1, processed_at = NOW() WHERE id = $2 RETURNING *';
        const params = notes ? [status, notes, withdrawalId] : [status, withdrawalId];
        const result = await database_1.db.query(updateQuery, params);
        return result.rows[0];
    }
}
exports.WithdrawalService = WithdrawalService;
