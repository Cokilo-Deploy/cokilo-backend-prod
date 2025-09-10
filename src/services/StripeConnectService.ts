// src/services/StripeConnectService.ts
import Stripe from 'stripe';
import { User } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export class StripeConnectService {
  
  /**
   * Créer un Connected Account pour un voyageur européen
   */
  static async createConnectedAccount(userId: number): Promise<string> {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Créer le compte avec le pays de l'utilisateur
    const account = await stripe.accounts.create({
      type: 'custom',
      country: user.country,
      capabilities: {
        transfers: { requested: true }
        // Supprimé card_payments pour éviter de demander les coordonnées bancaires
      },
      business_type: 'individual', // Ajout pour clarifier le type
      metadata: {
        userId: userId.toString(),
        platform: 'cokilo'
      }
    });

    await User.update(
      { stripeConnectedAccountId: account.id },
      { where: { id: userId } }
    );

    return account.id;
  } catch (error) {
    console.error('Erreur création Connected Account:', error);
    throw error;
  }
}

  static async createConnectedAccountWithUserData(userId: number, userIp: string): Promise<string> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier que toutes les données nécessaires sont présentes
      if (!user.dateOfBirth || !user.addressLine1 || !user.addressCity || !user.addressPostalCode) {
        throw new Error('Données utilisateur incomplètes pour la création du compte Connect');
      }

   const account = await stripe.accounts.create({
  type: 'custom',
  country: user.country || 'FR',
  email: user.email,
  capabilities: {
    transfers: { requested: true },
    
  },
  business_type: 'individual', // IMPORTANT : Spécifier "individual"
  individual: {
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    phone: user.phone, // Ajouter ce champ au formulaire
    dob: (() => {
  try {
    const parsedDate = typeof user.dateOfBirth === 'string' 
      ? new Date(user.dateOfBirth) 
      : user.dateOfBirth;
    
    return {
      day: parsedDate.getDate(),
      month: parsedDate.getMonth() + 1,
      year: parsedDate.getFullYear()
    };
  } catch (error) {
    console.error('Erreur parsing date de naissance:', error);
    return undefined;
  }
})(),
    address: {
      line1: user.addressLine1,
      city: user.addressCity,
      postal_code: user.addressPostalCode,
      country: user.country || 'FR'
    }
  },
  tos_acceptance: {
    date: Math.floor(Date.now() / 1000),
    ip: userIp,
    service_agreement: 'recipient'
  },
  metadata: {
    userId: userId.toString(),
    platform: 'cokilo',
    account_type: 'individual'
  }
});

      // Sauvegarder l'ID du compte connecté
      await User.update(
        { stripeConnectedAccountId: account.id },
        { where: { id: userId } }
      );

      console.log(`Connected Account créé automatiquement: ${account.id} pour user ${userId}`);
      return account.id;

    } catch (error) {
      console.error('Erreur création Connected Account avec données user:', error);
      throw error;
    }
  }

  /**
   * Créer un lien d'onboarding pour compléter le profil
   */
  static async createOnboardingLink(userId: number): Promise<string> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.stripeConnectedAccountId) {
        throw new Error('Connected Account non trouvé');
      }

      const accountLink = await stripe.accountLinks.create({
        account: user.stripeConnectedAccountId,
        refresh_url: 'https://stripe.com/docs',
        return_url: 'https://stripe.com/docs',
        type: 'account_onboarding',
        collect: 'eventually_due'
      });

      return accountLink.url;

    } catch (error) {
      console.error('Erreur création lien onboarding:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'un Connected Account
   */
  static async getAccountStatus(userId: number): Promise<{
    isActive: boolean;
    canReceivePayments: boolean;
    requirements: string[];
  }> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.stripeConnectedAccountId) {
        return {
          isActive: false,
          canReceivePayments: false,
          requirements: ['Compte Connect non créé']
        };
      }

      const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);

      return {
        isActive: account.details_submitted || false,
        canReceivePayments: account.charges_enabled || false,
        requirements: account.requirements?.currently_due || []
      };

    } catch (error) {
      console.error('Erreur vérification statut account:', error);
      return {
        isActive: false,
        canReceivePayments: false,
        requirements: ['Erreur vérification']
      };
    }
  }

  /**
   * Effectuer un transfer vers un Connected Account
   */
  static async transferToTraveler(
  userId: number, 
  amount: number, 
  targetCurrency: string, 
  transactionId: number
): Promise<string> {
  try {
    console.log('🔍 Transfer - Début fonction avec params:', {
      userId,
      amount,
      targetCurrency,
      transactionId
    });

    // Récupérer les infos du voyageur
    const user = await User.findByPk(userId);
    if (!user?.stripeConnectedAccountId) {
      throw new Error('Compte Connect non trouvé');
    }

    console.log('✅ User trouvé, ConnectedAccountId:', user.stripeConnectedAccountId);

    // Effectuer le transfer avec conversion automatique USD -> EUR
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Montant en centimes
      currency: targetCurrency.toLowerCase(), // 'eur'
      destination: user.stripeConnectedAccountId,
      metadata: {
        transaction_id: transactionId.toString(),
        user_id: userId.toString(),
        original_amount: amount.toString(),
        target_currency: targetCurrency
      }
    });

    console.log(`💱 Transfer créé avec succès: ${transfer.id}`);
    console.log(`💱 Montant: ${amount} ${targetCurrency} vers ${user.stripeConnectedAccountId}`);
    
    return transfer.id;

  } catch (error) {
    console.error('Erreur transfer vers voyageur:', error);
    throw error;
  }
}

// Dans StripeConnectService, ajoutez ces deux fonctions :

/**
 * Ajouter un compte bancaire externe au compte Connect
 */
static async addExternalAccount(userId: number, bankDetails: any): Promise<void> {
  try {
    console.log(`🔍 Debug bankDetails reçus:`, bankDetails);
    
    const user = await User.findByPk(userId);
    if (!user?.stripeConnectedAccountId) {
      throw new Error('Compte Connect non trouvé');
    }

    console.log(`🏦 Ajout compte bancaire pour user ${userId}`);

    // Vérifier s'il a déjà un compte bancaire
    const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);
    const existingAccounts = account.external_accounts?.data || [];
    
    console.log(`📋 Comptes existants: ${existingAccounts.length}`);
    
    if (existingAccounts.length > 0) {
      console.log(`ℹ️ User ${userId} a déjà un compte bancaire configuré`);
      return;
    }

    // Mapper les champs correctement
    const accountHolderName = bankDetails.accountName || bankDetails.accountHolderName;
    const accountNumber = bankDetails.accountNumber;
    const routingNumber = bankDetails.bankCode || bankDetails.routingNumber;

    // Valider les données bancaires
    if (!accountHolderName || !accountNumber) {
      throw new Error(`Données manquantes - Nom: ${accountHolderName}, Compte: ${accountNumber}`);
    }

    console.log(`🔍 Création external account avec:`, {
      country: bankDetails.country || 'FR',
      accountHolderName: accountHolderName,
      accountNumber: '****' + (accountNumber || '').slice(-4),
      routingNumber: routingNumber
    });

    // Ajouter le nouveau compte bancaire
    const externalAccount = await stripe.accounts.createExternalAccount(
      user.stripeConnectedAccountId,
      {
        external_account: {
          object: 'bank_account',
          country: bankDetails.country || 'FR',
          currency: 'eur',
          account_holder_name: accountHolderName,
          account_number: accountNumber,
          routing_number: routingNumber
        }
      }
    );

    console.log(`✅ Compte bancaire ajouté: ${externalAccount.id}`);

  } catch (error: any) {
    console.error('❌ Erreur détaillée ajout compte bancaire:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    });
    throw new Error('Impossible d\'ajouter le compte bancaire: ' + error.message);
  }
}

/**
 * Créer un payout instantané vers le compte bancaire de l'utilisateur
 */
static async createPayout(userId: number, amount: number): Promise<string> {
  try {
    const user = await User.findByPk(userId);
    if (!user?.stripeConnectedAccountId) {
      throw new Error('Compte Connect non trouvé');
    }

    console.log(`💸 Création payout ${amount}€ pour user ${userId}`);

    // Vérifier le solde disponible
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripeConnectedAccountId
    });

    const availableBalance = balance.available.find(b => b.currency === 'eur') || 
                           balance.available.find(b => b.currency === 'usd') ||
                           balance.available[0];

    const availableAmount = availableBalance ? (availableBalance.amount / 100) : 0;

    if (availableAmount < amount) {
      throw new Error(`Solde insuffisant. Disponible: ${availableAmount}€`);
    }

    // Créer le payout
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // En centimes
      currency: 'eur',
      metadata: {
        user_id: userId.toString(),
        withdrawal_amount: amount.toString()
      }
    }, {
      stripeAccount: user.stripeConnectedAccountId
    });

    console.log(`✅ Payout créé: ${payout.id} - ${amount}€`);
    
    return payout.id;

  } catch (error: any) { // Changé ici : ajouté ": any"
    console.error('Erreur création payout:', error);
    if (error?.message?.includes('insufficient')) {
      throw new Error('Solde insuffisant pour ce retrait');
    }
    throw new Error('Impossible de traiter le retrait');
  }
}
/**
 * Récupérer l'historique des payouts pour un utilisateur EU
 */
static async getPayoutHistory(userId: number): Promise<any[]> {
  try {
    const user = await User.findByPk(userId);
    if (!user?.stripeConnectedAccountId) {
      throw new Error('Compte Connect non trouvé');
    }

    console.log(`📊 Récupération historique payouts pour user ${userId}`);

    // Récupérer les payouts du compte Connect
    const payouts = await stripe.payouts.list({
      limit: 50, // Derniers 50 payouts
    }, {
      stripeAccount: user.stripeConnectedAccountId
    });

    // Transformer les données Stripe en format compatible avec l'app
    const formattedPayouts = payouts.data.map(payout => {
      const destination = payout.destination as any;
      const fee = (payout as any).fee || 0;
      
      return {
        id: payout.id,
        amount: payout.amount / 100, // Convertir centimes en euros
        currency: payout.currency.toUpperCase(),
        status: this.mapPayoutStatus(payout.status),
        method: 'stripe_instant',
        bankAccount: `****${destination?.last4 || '****'}`,
        created_at: new Date(payout.created * 1000).toISOString(),
        arrival_date: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
        description: `Retrait instantané - ${payout.amount / 100}€`,
        fee: fee / 100,
        net_amount: (payout.amount - fee) / 100
      };
    });

    console.log(`✅ ${formattedPayouts.length} payouts récupérés pour user ${userId}`);
    
    return formattedPayouts;

  } catch (error: any) {
    console.error('Erreur récupération historique payouts:', error);
    throw new Error('Impossible de récupérer l\'historique des retraits');
  }
}

/**
 * Mapper les statuts Stripe vers des statuts compréhensibles
 */
private static mapPayoutStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'paid':
      return 'completed';
    case 'pending':
      return 'processing';
    case 'in_transit':
      return 'processing';
    case 'canceled':
      return 'cancelled';
    case 'failed':
      return 'failed';
    default:
      return stripeStatus;
  }
}
}