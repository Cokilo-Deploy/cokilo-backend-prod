"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const Wallet_1 = require("../models/Wallet");
const database_1 = require("../config/database");
class WalletService {
    static async getOrCreateWallet(userId) {
        let wallet = await Wallet_1.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            wallet = await Wallet_1.Wallet.create({ userId, balance: 0.00 });
        }
        return wallet;
    }
    static async creditWallet(userId, amount, transactionId, description) {
        const wallet = await this.getOrCreateWallet(userId);
        // Transaction atomique
        await database_1.db.query('BEGIN');
        try {
            // Créditer le wallet
            await database_1.db.query('UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2', [amount, userId]);
            // Enregistrer le mouvement
            await database_1.db.query(`INSERT INTO wallet_transactions (wallet_id, transaction_id, type, amount, description, status)
         VALUES ($1, $2, 'credit', $3, $4, 'completed')`, [wallet.id, transactionId, amount, description]);
            await database_1.db.query('COMMIT');
            return await this.getWalletBalance(userId);
        }
        catch (error) {
            await database_1.db.query('ROLLBACK');
            throw error;
        }
    }
    static async getWalletBalance(userId) {
        const result = await database_1.db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
        return result.rows[0]?.balance || 0;
    }
    static async getWalletHistory(userId) {
        const result = await database_1.db.query(`SELECT wt.*, t.id as transaction_number
       FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       LEFT JOIN transactions t ON wt.transaction_id = t.id
       WHERE w.user_id = $1
       ORDER BY wt.created_at DESC`, [userId]);
        return result.rows;
    }
}
exports.WalletService = WalletService;
