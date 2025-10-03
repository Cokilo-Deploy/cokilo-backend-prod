//src/services/ExtendedRegistrationService.ts
import { User, UserVerificationStatus } from '../models/User';
import { StripeConnectService } from './StripeConnectService';
import jwt from 'jsonwebtoken';
import { AuthController } from '../controllers/AuthController';

export class ExtendedRegistrationService {
  
  static async registerWithStripeConnect(userData: any, userIp: string) {
  const {
    email, password, firstName, lastName, phone,
    country, dateOfBirth, addressLine1, addressLine2, city, postalCode, state,
    currency, acceptStripeTerms
  } = userData;

  console.log('🔄 Début registerWithStripeConnect');
  console.log('📍 Country:', country);
  console.log('💰 Currency:', currency);

  let stripeConnectedAccountId = null;
  let stripeAccountCreated = false;

  try {
    // ÉTAPE 1: Création Stripe Connect AVANT tout (pour non-DZ)
    if (country !== 'DZ' && acceptStripeTerms) {
      console.log('🏦 ÉTAPE 1: Création Stripe Connect (validation incluse)...');
      
      // Appeler la nouvelle méthode de validation/création
      const stripeResult = await AuthController['createAndValidateStripeConnect'](userData, userIp);
      
      if (!stripeResult.success) {
        // Bloquer l'inscription si Stripe refuse
        const errorMessage = stripeResult.errors.join(' | ');
        console.error('❌ Stripe Connect échoué:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // ✅ Compte Connect créé avec succès
      stripeConnectedAccountId = stripeResult.accountId!;
      stripeAccountCreated = true;
      
      console.log('✅ Stripe Connect OK:', stripeConnectedAccountId);
    } else if (country === 'DZ') {
      console.log('🇩🇿 Utilisateur DZ - pas de Stripe Connect, utilisation wallet');
    }

    // ÉTAPE 2: Créer l'utilisateur en BDD
    console.log('👤 ÉTAPE 2: Création utilisateur en BDD...');
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      currency: currency || 'EUR',
      country: country,
      paymentMethod: country === 'DZ' ? 'manual' : 'stripe_connect',
      stripeConnectedAccountId: stripeConnectedAccountId || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      addressLine1: addressLine1,
      addressCity: city,
      addressPostalCode: postalCode,
      verificationStatus: UserVerificationStatus.UNVERIFIED,
      stripeTermsAccepted: acceptStripeTerms || false,
      stripeTermsAcceptedAt: acceptStripeTerms ? new Date() : undefined,
    });

    console.log('✅ Utilisateur créé avec ID:', user.id);

    // ÉTAPE 3: Stripe Identity EN DERNIER (non bloquant)
    if (country !== 'DZ' && stripeConnectedAccountId) {
      console.log('🔐 ÉTAPE 3: Création session Stripe Identity...');
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const verificationSession = await stripe.identity.verificationSessions.create({
          type: 'document',
          metadata: {
            user_id: user.id.toString(),
            connected_account_id: stripeConnectedAccountId,
          },
          options: {
            document: {
              allowed_types: ['driving_license', 'passport', 'id_card'],
              require_live_capture: true,
              require_matching_selfie: true,
            },
          },
        });

        await user.update({
          stripeIdentitySessionId: verificationSession.id,
         
        });

        console.log('✅ Session Identity créée:', verificationSession.id);
      } catch (identityError: any) {
        console.error('⚠️ Identity échouée (non bloquant car Connect OK):', identityError.message);
        // L'utilisateur pourra relancer Identity plus tard
      }
    }

    // ÉTAPE 4: Créer wallet pour DZ
    if (country === 'DZ') {
      try {
        const { Wallet } = require('../models/Wallet');
        await Wallet.create({
          userId: user.id,
          balance: 0,
          currency: 'DZD',
        });
        console.log('✅ Wallet DZD créé pour utilisateur');
      } catch (walletError: any) {
        console.error('⚠️ Erreur création wallet:', walletError.message);
      }
    }

    // Générer le token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log('✅ Inscription étendue réussie');

    return {
      token,
      user: user,
      stripeAccountCreated,
    };

  } catch (error: any) {
    console.error('💥 Enscription étendue:', error);
    
    // NETTOYAGE: Supprimer le compte Stripe si créé mais erreur après
    if (stripeConnectedAccountId) {
      console.log('🗑️ Nettoyage: suppression compte Stripe...');
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.accounts.del(stripeConnectedAccountId);
        console.log('✅ Compte Stripe supprimé');
      } catch (cleanupError: any) {
        console.error('⚠️ Erreur nettoyage Stripe:', cleanupError.message);
      }
    }
    
    throw error;
  }
}
}