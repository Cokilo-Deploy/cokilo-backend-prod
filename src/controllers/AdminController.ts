// src/controllers/AdminController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { Transaction } from '../models/Transaction';
import { Op, QueryTypes } from 'sequelize';
import { TransactionStatus } from '../types/transaction';
import { sequelize } from '../config/database';
import { WalletService } from '../services/walletService';

export class AdminController {
  static async getDashboard(req: Request, res: Response) {
    try {
      // Statistiques de base
      const totalUsers = await User.count();
      const activeUsers = await User.count({
        where: { 
          lastLoginAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });
      
      const totalTrips = await Trip.count();
      const activeTrips = await Trip.count({
        where: { status: 'published' }
      });
      
      const totalTransactions = await Transaction.count();
      const pendingTransactions = await Transaction.count({
        where: { status: TransactionStatus.PAYMENT_PENDING }
      });

      // Revenus du mois
      const monthlyRevenue = await Transaction.sum('amount', {
        where: {
          status: TransactionStatus.PAYMENT_RELEASED,
          createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      });

      res.json({
        success: true,
        data: {
          users: { total: totalUsers, active: activeUsers },
          trips: { total: totalTrips, active: activeTrips },
          transactions: { total: totalTransactions, pending: pendingTransactions },
          revenue: { monthly: monthlyRevenue || 0 }
        }
      });
    } catch (error) {
      console.error('Erreur dashboard admin:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};
      
      if (search) {
        whereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status) {
        whereClause.verificationStatus = status;
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        attributes: { exclude: ['password'] }
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            total: users.count,
            page: Number(page),
            pages: Math.ceil(users.count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Erreur getUsers:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async updateUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'block', 'unblock', 'verify'

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      }

      switch (action) {
        case 'block':
          await user.update({ isActive: false });
          break;
        case 'unblock':
          await user.update({ isActive: true });
          break;
        case 'verify':
          await user.update({ verificationStatus: 'verified' as any });
          break;
        default:
          return res.status(400).json({ success: false, error: 'Action invalide' });
      }

      res.json({ success: true, message: 'Statut utilisateur mis à jour' });
    } catch (error) {
      console.error('Erreur updateUserStatus:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
  // Dans AdminController.ts, ajoutez ces méthodes :

static async getTrips(req: Request, res: Response) {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const trips = await Trip.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'traveler',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    res.json({
      success: true,
      data: {
        trips: trips.rows,
        pagination: {
          total: trips.count,
          page: Number(page),
          pages: Math.ceil(trips.count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Erreur getTrips:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

static async updateTripStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const trip = await Trip.findByPk(id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Voyage non trouvé' });
    }

    await trip.update({ status });
    res.json({ success: true, message: 'Statut voyage mis à jour' });
  } catch (error) {
    console.error('Erreur updateTripStatus:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

static async getTransactions(req: Request, res: Response) {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows,
        pagination: {
          total: transactions.count,
          page: Number(page),
          pages: Math.ceil(transactions.count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Erreur getTransactions:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

static async resolveTransaction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'refund', 'release', 'cancel'

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
    }

    // Logique de résolution selon l'action
    switch (action) {
      case 'cancel':
        await transaction.update({ status: TransactionStatus.CANCELLED });
        break;
      case 'release':
        await transaction.update({ status: TransactionStatus.PAYMENT_RELEASED });
        break;
      default:
        return res.status(400).json({ success: false, error: 'Action invalide' });
    }

    res.json({ success: true, message: 'Transaction résolue' });
  } catch (error) {
    console.error('Erreur resolveTransaction:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

static async getSupportMessages(req: Request, res: Response) {
  try {
    // Cette méthode dépendra de votre modèle de support
    // Pour l'instant, retour vide
    res.json({
      success: true,
      data: { messages: [] }
    });
  } catch (error) {
    console.error('Erreur getSupportMessages:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

static async replySupportMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    // Logique de réponse au support
    res.json({ success: true, message: 'Réponse envoyée' });
  } catch (error) {
    console.error('Erreur replySupportMessage:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

static async getUserDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Trip,
          as: 'trips',
          limit: 5
        },
        {
          model: Transaction,
          as: 'sentTransactions',
          limit: 5
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Erreur getUserDetails:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}
// Statistiques wallet globales
static async getWalletStats(req: Request, res: Response) {
  try {
    // Total des wallets
    const totalWallets = await sequelize.query(
      'SELECT COUNT(*) as count FROM wallets',
      { type: QueryTypes.SELECT }
    ) as any[];

    // Solde total tous wallets
    const totalBalance = await sequelize.query(
      'SELECT SUM(balance) as total FROM wallets',
      { type: QueryTypes.SELECT }
    ) as any[];

    // Demandes de retrait en attente (à implémenter si vous avez une table)
    const pendingWithdrawals = 0; // Placeholder

    res.json({
      success: true,
      data: {
        totalWallets: totalWallets[0]?.count || 0,
        totalBalance: totalBalance[0]?.total || 0,
        pendingWithdrawals,
      }
    });
  } catch (error) {
    console.error('Erreur wallet stats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

// Liste des wallets utilisateurs DZD
static async getDZDWallets(req: Request, res: Response) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, Number(page)); // Force minimum à 1
    const offset = (pageNum - 1) * Number(limit);

    const wallets = await sequelize.query(
      `SELECT 
        u.id as "userId",
        u.email,
        u."firstName",
        u."lastName",
        u.country,
        w.balance,
        w.updated_at as "lastUpdate"
      FROM users u
      JOIN wallets w ON u.id = w.user_id
      WHERE u.country = 'DZ'
      ORDER BY w.balance DESC
      LIMIT $1 OFFSET $2`,
      {
        bind: [Number(limit), offset],
        type: QueryTypes.SELECT
      }
    );

    const countResult = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM users u
       JOIN wallets w ON u.id = w.user_id
       WHERE u.country = 'DZ'`,
      { type: QueryTypes.SELECT }
    ) as any[];

    res.json({
      success: true,
      data: {
        wallets,
        pagination: {
          total: countResult[0]?.count || 0,
          page: pageNum,
          pages: Math.ceil((countResult[0]?.count || 0) / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Erreur DZD wallets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Historique wallet d'un utilisateur
static async getUserWalletHistory(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const history = await sequelize.query(
      `SELECT 
        wt.id,
        wt.type,
        wt.amount,
        wt.description,
        wt."created_at",
        t.id as "transactionId"
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.id
      LEFT JOIN transactions t ON wt.transaction_id = t.id
      WHERE w."user_id" = $1
      ORDER BY wt."created_at" DESC
      LIMIT 50`,
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: { history }
    });
  } catch (error) {
    console.error('Erreur wallet history:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}
static async processWithdrawal(req: Request, res: Response) {
  try {
    const { userId, amount, bankName, accountNumber, accountHolder, notes } = req.body;

    if (!userId || !amount || !bankName || !accountNumber) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes'
      });
    }

    // Vérifier le solde disponible
    const walletBalance = await WalletService.getWalletBalance(userId);
    
    if (amount > walletBalance) {
      return res.status(400).json({
        success: false,
        error: 'Solde insuffisant'
      });
    }

    // Débiter le wallet
    const wallet = await WalletService.getOrCreateWallet(userId);
    const transaction = await sequelize.transaction();

    try {
      // Débiter le montant
      await sequelize.query(
        'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2',
        {
          bind: [amount, userId],
          transaction
        }
      );

      // Enregistrer la transaction de retrait
      await sequelize.query(
        `INSERT INTO wallet_transactions (wallet_id, transaction_id, type, amount, description, created_at)
         VALUES ($1, NULL, 'debit', $2, $3, NOW())`,
        {
          bind: [
            wallet.id,
            amount,
            `Virement bancaire vers ${bankName} - ${accountNumber} - ${accountHolder}${notes ? ' - ' + notes : ''}`
          ],
          transaction
        }
      );

      await transaction.commit();

      console.log(`✅ Virement traité: ${amount}€ pour user ${userId}`);

      res.json({
        success: true,
        message: 'Virement traité avec succès',
        data: {
          newBalance: walletBalance - amount
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error: any) {
    console.error('Erreur processWithdrawal:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du traitement du virement'
    });
  }
}
}