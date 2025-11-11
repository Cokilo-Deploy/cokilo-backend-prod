"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalService = void 0;
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
class WithdrawalService {
    static async requestWithdrawal(userId, amount, bankDetails) {
        // Vérifier le solde disponible
        const walletResult = await database_1.sequelize.query('SELECT id, balance FROM wallets WHERE user_id = $1', {
            bind: [userId],
            type: sequelize_1.QueryTypes.SELECT
        });
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
        const transaction = await database_1.sequelize.transaction();
        try {
            // Débiter le wallet
            await database_1.sequelize.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', {
                bind: [amount, wallet.id],
                transaction
            });
            // Créer la demande de retrait
            const withdrawalResult = await database_1.sequelize.query(`INSERT INTO withdrawal_requests 
         (wallet_id, amount, bank_account_name, bank_account_number, bank_name, bank_code, status, requested_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
         RETURNING *`, {
                bind: [
                    wallet.id,
                    amount,
                    bankDetails.accountName,
                    bankDetails.accountNumber,
                    bankDetails.bankName,
                    bankDetails.bankCode
                ],
                type: sequelize_1.QueryTypes.INSERT,
                transaction
            });
            // Enregistrer le mouvement dans wallet_transactions
            await database_1.sequelize.query(`INSERT INTO wallet_transactions (wallet_id, type, amount, description, transaction_id, created_at)
         VALUES ($1, 'debit', $2, $3, NULL, NOW())`, {
                bind: [wallet.id, amount, `Demande de retrait #${withdrawalResult[0][0].id}`],
                transaction
            });
            await transaction.commit();
            return withdrawalResult[0][0];
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    static async getWithdrawalHistory(userId) {
        const result = await database_1.sequelize.query(`SELECT wr.* FROM withdrawal_requests wr
       JOIN wallets w ON wr.wallet_id = w.id
       WHERE w.user_id = $1
       ORDER BY wr.requested_at DESC`, {
            bind: [userId],
            type: sequelize_1.QueryTypes.SELECT
        });
        return result;
    }
    static async updateWithdrawalStatus(withdrawalId, status, notes) {
        const updateQuery = notes
            ? 'UPDATE withdrawal_requests SET status = $1, notes = $2, processed_at = NOW() WHERE id = $3 RETURNING *'
            : 'UPDATE withdrawal_requests SET status = $1, processed_at = NOW() WHERE id = $2 RETURNING *';
        const params = notes ? [status, notes, withdrawalId] : [status, withdrawalId];
        const result = await database_1.sequelize.query(updateQuery, {
            bind: params,
            type: sequelize_1.QueryTypes.SELECT // Changez UPDATE en SELECT
        });
        return result[0]; // Supprimez [0] supplémentaire
    }
}
exports.WithdrawalService = WithdrawalService;
