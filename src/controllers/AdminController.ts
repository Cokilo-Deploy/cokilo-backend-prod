// src/controllers/AdminController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { Transaction } from '../models/Transaction';
import { Op, QueryTypes } from 'sequelize';
import { TransactionStatus } from '../types/transaction';
import { sequelize } from '../config/database';
import { WalletService } from '../services/walletService';
import { Wallet } from '../models/Wallet';
import { ChatConversation, ChatMessage } from '../models';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
});

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

    // NOUVEAU - Revenus totaux (serviceFee uniquement)
    const revenueResult = await sequelize.query(
      `SELECT 
        SUM("serviceFee") as "totalRevenue",
        COUNT(*) as "completedTransactions"
      FROM transactions 
      WHERE status = 'payment_released'
      AND "serviceFee" IS NOT NULL`,
      { type: QueryTypes.SELECT }
    ) as any[];

    const totalRevenue = Number(revenueResult[0]?.totalRevenue || 0);
    const completedTransactions = Number(revenueResult[0]?.completedTransactions || 0);

    // Revenus du mois en cours
    const monthRevenueResult = await sequelize.query(
      `SELECT SUM("serviceFee") as "monthlyRevenue"
      FROM transactions 
      WHERE status = 'payment_released'
      AND "serviceFee" IS NOT NULL
      AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)`,
      { type: QueryTypes.SELECT }
    ) as any[];

    const monthlyRevenue = Number(monthRevenueResult[0]?.monthlyRevenue || 0);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        trips: { total: totalTrips, active: activeTrips },
        transactions: { total: totalTransactions, pending: pendingTransactions },
        revenue: {
          total: totalRevenue,
          completedTransactions
        },
        monthlyRevenue
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
        order: [['createdAt', 'DESC']],
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
      order: [['createdAt', 'DESC']],
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
      order: [['createdAt', 'DESC']]
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
    const { userId } = req.params;

    // Utiliser une requête SQL brute au lieu de Sequelize ORM
    const userResult = await sequelize.query(
      `SELECT 
        id,
        email,
        "firstName",
        "lastName",
        country,
        currency,
        paymentmethod,
        "verificationStatus",
        "createdAt"
      FROM users
      WHERE id = $1`,
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Récupérer le solde wallet
    const walletResult = await sequelize.query(
      `SELECT balance FROM wallets WHERE user_id = $1`,
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    const user = userResult[0] as any;
    user.walletBalance = walletResult[0]?.balance || 0;

    res.json({
      success: true,
      data: { user }
    });

  } catch (error: any) {
    console.error('Erreur getUserDetails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
        wt.created_at as "createdAt",
        wt.transaction_id as "transactionId",
        wr.id as "withdrawalRequestId"
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.id
      LEFT JOIN withdrawal_requests wr ON wt.wallet_id = wr.wallet_id 
        AND wt.type = 'debit'
        AND ABS(EXTRACT(EPOCH FROM (wt.created_at - wr.requested_at))) < 10
      WHERE w.user_id = $1
      ORDER BY wt.created_at DESC
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
  } catch (error: any) {
    console.error('Erreur wallet history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
static async getWithdrawalDetails(req: Request, res: Response) {
  try {
    const { withdrawalId } = req.params;

    const result = await sequelize.query(
      `SELECT 
        wr.id,
        wr.wallet_id as "walletId",
        wr.amount,
        wr.currency,
        wr.bank_account_name as "accountHolder",
        wr.bank_account_number as "accountNumber",
        wr.bank_name as "bankName",
        wr.bank_code as "swiftBic",
        wr.status,
        wr.requested_at as "createdAt",
        wr.notes,
        u.id as "userId",
        u.email as "userEmail",
        u."firstName" || ' ' || u."lastName" as "userName"
      FROM withdrawal_requests wr
      JOIN wallets w ON wr.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE wr.id = $1`,
      {
        bind: [withdrawalId],
        type: QueryTypes.SELECT
      }
    );

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Demande non trouvée'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error: any) {
    console.error('Erreur getWithdrawalDetails:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
static async approveWithdrawal(req: Request, res: Response) {
  try {
    const { withdrawalId } = req.params;

    await sequelize.query(
      `UPDATE withdrawal_requests 
       SET status = 'approved', processed_at = NOW() 
       WHERE id = $1`,
      { bind: [withdrawalId] }
    );

    console.log(`Demande de retrait ${withdrawalId} approuvée`);

    res.json({
      success: true,
      message: 'Demande approuvée'
    });

  } catch (error: any) {
    console.error('Erreur approveWithdrawal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
static async rejectWithdrawal(req: Request, res: Response) {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;

    // Récupérer wallet_id et montant
    const withdrawal = await sequelize.query(
      `SELECT wallet_id, amount FROM withdrawal_requests WHERE id = $1`,
      {
        bind: [withdrawalId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (!withdrawal || withdrawal.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Demande non trouvée'
      });
    }

    const { wallet_id, amount } = withdrawal[0];
    const transaction = await sequelize.transaction();

    try {
      // Recréditer le wallet
      await sequelize.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        {
          bind: [amount, wallet_id],
          transaction
        }
      );

      // Marquer comme rejetée
      await sequelize.query(
        `UPDATE withdrawal_requests 
         SET status = 'rejected', 
             processed_at = NOW(), 
             notes = COALESCE(notes || E'\\n', '') || $1 
         WHERE id = $2`,
        {
          bind: [`Rejet: ${reason}`, withdrawalId],
          transaction
        }
      );

      await transaction.commit();
      
      console.log(`Demande ${withdrawalId} rejetée et montant recrédité`);

      res.json({
        success: true,
        message: 'Demande rejetée et montant recrédité'
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error: any) {
    console.error('Erreur rejectWithdrawal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
static async getUserWithdrawalRequests(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const requests = await sequelize.query(
      `SELECT 
        wr.id,
        wr.amount,
        wr.currency,
        wr.bank_name as "bankName",
        wr.status,
        wr.requested_at as "createdAt"
      FROM withdrawal_requests wr
      JOIN wallets w ON wr.wallet_id = w.id
      WHERE w.user_id = $1
      ORDER BY wr.requested_at DESC`,
      {
        bind: [userId],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: { requests }
    });

  } catch (error: any) {
    console.error('Erreur getUserWithdrawalRequests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
static async deleteUserAccount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log('=== SUPPRESSION ADMIN COMPTE ===');
    console.log('User ID à supprimer:', id);
    
    const user = await User.findByPk(id);
    console.log('Utilisateur trouvé:', !!user);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    console.log('Payment method:', user.paymentMethod);
    console.log('Stripe Connected Account:', user.stripeConnectedAccountId);
    console.log('Stripe Customer ID:', user.stripeCustomerId);
    console.log('Stripe Identity Session:', user.stripeIdentitySessionId);

    // Expurgation Stripe centralisée
    console.log('Expurgation Stripe...');
    try {
      const objectsToRedact: any = {};
      
      if (user.stripeCustomerId) {
        objectsToRedact.customers = [user.stripeCustomerId];
        console.log('Customer ajouté pour expurgation');
      }
      
      if (user.stripeIdentitySessionId) {
        try {
          const session = await stripe.identity.verificationSessions.retrieve(user.stripeIdentitySessionId);
          if (session.status === 'verified') {
            objectsToRedact.identity_verification_sessions = [user.stripeIdentitySessionId];
          } else if (session.status === 'requires_input') {
            await stripe.identity.verificationSessions.cancel(user.stripeIdentitySessionId);
          }
        } catch (sessionError: any) {
          console.log('Erreur Identity:', sessionError.message);
        }
      }

      if (Object.keys(objectsToRedact).length > 0) {
        const redactionJob = await (stripe as any).redactionJobs.create({
          objects: objectsToRedact
        });
        console.log('RedactionJob créé:', redactionJob.id);
      }
    } catch (redactionError: any) {
      console.log('Fallback méthodes individuelles:', redactionError.message);
      
      if (user.stripeIdentitySessionId) {
        try {
          const session = await stripe.identity.verificationSessions.retrieve(user.stripeIdentitySessionId);
          if (session.status === 'verified') {
            await stripe.identity.verificationSessions.redact(user.stripeIdentitySessionId);
          }
        } catch (e: any) {
          console.log('Erreur Identity fallback:', e.message);
        }
      }
      
      if (user.stripeCustomerId) {
        try {
          await stripe.customers.del(user.stripeCustomerId);
        } catch (e: any) {
          console.log('Erreur Customer fallback:', e.message);
        }
      }
    }

    // Suppression Stripe Connect
    if (user.paymentMethod === 'stripe_connect' && user.stripeConnectedAccountId) {
      try {
        await stripe.accounts.del(user.stripeConnectedAccountId);
        console.log('Compte Connect supprimé');
      } catch (e: any) {
        console.log('Erreur Connect:', e.message);
      }
    }

    // Suppression données application
   console.log('Suppression données application...');

// ORDRE IMPORTANT : supprimer d'abord les enfants, puis les parents
await ChatMessage.destroy({ where: { senderId: id } });
await ChatMessage.destroy({
  where: {
    conversationId: {
      [Op.in]: await ChatConversation.findAll({
        where: {
          [Op.or]: [{ user1Id: id }, { user2Id: id }]
        },
        attributes: ['id']
      }).then(convs => convs.map(c => c.id))
    }
  }
});
await ChatConversation.destroy({
  where: {
    [Op.or]: [{ user1Id: id }, { user2Id: id }]
  }
});

await Transaction.destroy({
  where: {
    [Op.or]: [{ senderId: id }, { travelerId: id }]
  }
});
await Trip.destroy({ where: { travelerId: id } });
await Wallet.destroy({ where: { userId: id } });
await User.destroy({ where: { id } });

    console.log('=== SUPPRESSION ADMIN RÉUSSIE ===');

    res.json({
      success: true,
      message: 'Compte supprimé complètement (utilisateur + Stripe)'
    });

  } catch (error: any) {
    console.error('=== ERREUR SUPPRESSION ADMIN ===', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
}
static async getStats(req: Request, res: Response) {
  try {
    // Utilisateurs
    const usersCount = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    
    // Voyages
    const tripsCount = await Trip.count();
    const activeTrips = await Trip.count({ 
      where: { 
        status: 'active',
        departureDate: { [Op.gte]: new Date() }
      }
    });

    // Transactions
    const transactionsCount = await Transaction.count();
    const pendingTransactions = await Transaction.count({ 
      where: { status: 'payment_pending' }
    });

    // Revenus totaux
    const revenueResult = await sequelize.query(
      `SELECT 
        SUM("serviceFee") as "totalRevenue",
        COUNT(*) as "completedTransactions"
      FROM transactions 
      WHERE status IN ('payment_released', 'delivered')
      AND "serviceFee" IS NOT NULL`,
      { type: QueryTypes.SELECT }
    ) as any[];
    console.log('Revenue result:', revenueResult);

    const totalRevenue = Number(revenueResult[0]?.totalRevenue || 0);
    console.log('Total revenue:', totalRevenue);
    const completedTransactions = Number(revenueResult[0]?.completedTransactions || 0);

    // Revenus du mois en cours
    const monthRevenueResult = await sequelize.query(
      `SELECT SUM("serviceFee") as "monthlyRevenue"
      FROM transactions 
      WHERE status IN ('payment_released', 'delivered')
      AND "serviceFee" IS NOT NULL
      AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)`,
      { type: QueryTypes.SELECT }
    ) as any[];

    const monthlyRevenue = Number(monthRevenueResult[0]?.monthlyRevenue || 0);
    console.log('Monthly revenue:', monthlyRevenue);

    res.json({
      success: true,
      data: {
        users: { total: usersCount, active: activeUsers },
        trips: { total: tripsCount, active: activeTrips },
        transactions: { total: transactionsCount, pending: pendingTransactions },
        revenue: {
          total: totalRevenue,
          completedTransactions
        },
        monthlyRevenue
      }
    });

  } catch (error) {
    console.error('Erreur getStats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}
}