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
          transfers: { requested: true },
          card_payments: { requested: true }
        },
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
    card_payments: { requested: true }
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
    service_agreement: user.country || 'FR' // Acceptation CGU Stripe
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
    currency: string = 'eur',
    transactionId: number
  ): Promise<string> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.stripeConnectedAccountId) {
        throw new Error('Connected Account non trouvé');
      }

      // Vérifier que le compte peut recevoir des paiements
      const status = await this.getAccountStatus(userId);
      if (!status.canReceivePayments) {
        throw new Error('Le compte Connect ne peut pas encore recevoir de paiements');
      }

      // Effectuer le transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convertir en centimes
        currency: currency.toLowerCase(),
        destination: user.stripeConnectedAccountId,
        metadata: {
          transactionId: transactionId.toString(),
          userId: userId.toString()
        }
      });

      console.log(`💸 Transfer créé: ${transfer.id} vers ${user.stripeConnectedAccountId}`);
      return transfer.id;

    } catch (error) {
      console.error('Erreur transfer vers voyageur:', error);
      throw error;
    }
  }
}