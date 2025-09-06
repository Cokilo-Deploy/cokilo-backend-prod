import { User } from '../models/User';
import { StripeConnectService } from './StripeConnectService';
import jwt from 'jsonwebtoken';

export class ExtendedRegistrationService {
  
  static async registerWithStripeConnect(userData: any, userIp: string) {
    const {
      email, password, firstName, lastName, phone,
      country, dateOfBirth, addressLine1, addressCity, addressPostalCode,
      acceptCokiloTerms, acceptStripeTerms
    } = userData;

    // Validation des consentements
    if (!acceptCokiloTerms) {
      throw new Error('Vous devez accepter les conditions générales de CoKilo');
    }

    const euCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'LU', 'FI', 'IE', 'GR'];
    const isEuropeanUser = euCountries.includes(country);

    if (isEuropeanUser) {
      if (!acceptStripeTerms) {
        throw new Error('Vous devez accepter les conditions de service Stripe pour recevoir vos paiements');
      }

      if (!dateOfBirth || !addressLine1 || !addressCity || !addressPostalCode) {
        throw new Error('Adresse complète et date de naissance requises pour les utilisateurs européens');
      }
    }

    // Créer l'utilisateur
    const user = await User.create({
      email, password, firstName, lastName, phone,
      country,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      addressLine1, addressCity, addressPostalCode,
      stripeTermsAccepted: acceptStripeTerms || false,
      stripeTermsAcceptedAt: acceptStripeTerms ? new Date() : undefined,
      paymentMethod: isEuropeanUser ? 'stripe_connect' : 'manual'
    });

    // Créer automatiquement le Connected Account pour les européens
    let stripeAccountCreated = false;
    if (isEuropeanUser && acceptStripeTerms) {
      try {
        await StripeConnectService.createConnectedAccountWithUserData(user.id, userIp);
        stripeAccountCreated = true;
        console.log(`Connected Account créé automatiquement pour user ${user.id}`);
      } catch (error) {
        console.error('Erreur création Connected Account:', error);
        // L'inscription continue même si Connect échoue
      }
    }

    // Générer le token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        paymentMethod: user.paymentMethod,
        stripeAccountCreated,
        needsStripeOnboarding: isEuropeanUser && !stripeAccountCreated
      }
    };
  }
}