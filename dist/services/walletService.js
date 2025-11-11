"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const Wallet_1 = require("../models/Wallet");
const User_1 = require("../models/User");
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
});
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
        const transaction = await database_1.sequelize.transaction();
        try {
            await database_1.sequelize.query('UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2', {
                bind: [amount, userId],
                transaction
            });
            await database_1.sequelize.query(`INSERT INTO wallet_transactions (wallet_id, transaction_id, type, amount, description, created_at)
         VALUES ($1, $2, 'credit', $3, $4, NOW())`, {
                bind: [wallet.id, transactionId, amount, description],
                transaction
            });
            await transaction.commit();
            return await this.getWalletBalance(userId);
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    // Fonction originale - retourne juste le solde total
    static async getWalletBalance(userId) {
        const detailed = await this.getDetailedWalletBalance(userId);
        return detailed.totalBalance;
    }
    // Nouvelle fonction détaillée
    static async getDetailedWalletBalance(userId) {
        try {
            const user = await User_1.User.findByPk(userId);
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
                }
                catch (stripeError) {
                    console.error('Erreur récupération solde Connect:', stripeError);
                    return this.getVirtualWalletBalance(userId);
                }
            }
            else {
                return this.getVirtualWalletBalance(userId);
            }
        }
        catch (error) {
            console.error('Erreur getDetailedWalletBalance:', error);
            return { totalBalance: 0, availableBalance: 0, pendingBalance: 0, currency: 'EUR' };
        }
    }
    // Fonction pour wallet virtuel en format détaillé
    static async getVirtualWalletBalance(userId) {
        const result = await database_1.sequelize.query('SELECT balance FROM wallets WHERE user_id = $1', {
            bind: [userId],
            type: sequelize_1.QueryTypes.SELECT
        });
        const balance = result[0]?.balance || 0;
        console.log(`💰 Solde wallet virtuel pour user ${userId}: ${balance}`);
        return {
            totalBalance: balance,
            availableBalance: balance,
            pendingBalance: 0,
            currency: 'EUR'
        };
    }
    static async getWalletHistory(userId) {
        const result = await database_1.sequelize.query(`SELECT wt.*, t.id as transaction_number
       FROM wallet_transactions wt
       JOIN wallets w ON wt.wallet_id = w.id
       LEFT JOIN transactions t ON wt.transaction_id = t.id
       WHERE w.user_id = $1
       ORDER BY wt.created_at DESC`, {
            bind: [userId],
            type: sequelize_1.QueryTypes.SELECT
        });
        return result;
    }
}
exports.WalletService = WalletService;
