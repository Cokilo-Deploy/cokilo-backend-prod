//src/services/StripeIdentityService.ts
import Stripe from 'stripe';
import { User, UserVerificationStatus } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export class StripeIdentityService {
  // Créer une session de vérification d'identité
  static async createVerificationSession(userId: number) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier si déjà vérifié
      if (user.verificationStatus === UserVerificationStatus.VERIFIED) {
        throw new Error('Identité déjà vérifiée');
      }

      // Créer la session de vérification Stripe Identity
      const verificationSession = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          userId: userId.toString(),
        },
        options: {
          document: {
            allowed_types: ['driving_license', 'passport', 'id_card'],
            require_id_number: true,
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        return_url: `${process.env.FRONTEND_URL}/verification/return?session_id={CHECKOUT_SESSION_ID}`,
      });

      // Sauvegarder l'ID de session
      await user.update({
        stripeIdentitySessionId: verificationSession.id,
        verificationStatus: UserVerificationStatus.PENDING_VERIFICATION,
      });

      return {
        sessionId: verificationSession.id,
        clientSecret: verificationSession.client_secret,
        url: verificationSession.url,
      };

    } catch (error) {
      throw new Error(`Erreur création session de vérification: ${error}`);
    }
  }

  // Vérifier le statut de la vérification
  static async checkVerificationStatus(sessionId: string) {
    try {
      const session = await stripe.identity.verificationSessions.retrieve(sessionId);
      
      return {
        status: session.status,
        verifiedData: session.verified_outputs,
        lastError: session.last_error,
      };
    } catch (error) {
      throw new Error(`Erreur vérification statut: ${error}`);
    }
  }

  // Traitement des webhooks Stripe Identity
  static async handleVerificationWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'identity.verification_session.verified':
          await this.handleVerificationSuccess(event.data.object as Stripe.Identity.VerificationSession);
          break;
        
        case 'identity.verification_session.requires_input':
          await this.handleVerificationRequiresInput(event.data.object as Stripe.Identity.VerificationSession);
          break;

        case 'identity.verification_session.canceled':
          await this.handleVerificationCanceled(event.data.object as Stripe.Identity.VerificationSession);
          break;
      }
    } catch (error) {
      console.error('Erreur traitement webhook identity:', error);
      throw error;
    }
  }

  private static async handleVerificationSuccess(session: Stripe.Identity.VerificationSession) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const user = await User.findByPk(parseInt(userId));
    if (!user) return;

    // Marquer comme vérifié
    await user.update({
      verificationStatus: UserVerificationStatus.VERIFIED,
      identityVerifiedAt: new Date(),
    });

    // Créer un customer Stripe si pas encore fait
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        metadata: {
          userId: user.id.toString(),
        },
      });

      await user.update({
        stripeCustomerId: customer.id,
      });
    }

    console.log(`✅ Utilisateur ${user.email} vérifié avec succès`);
  }

  private static async handleVerificationRequiresInput(session: Stripe.Identity.VerificationSession) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const user = await User.findByPk(parseInt(userId));
    if (!user) return;

    await user.update({
      verificationStatus: UserVerificationStatus.VERIFICATION_FAILED,
    });

    console.log(`❌ Vérification échouée pour ${user.email}`);
  }

  private static async handleVerificationCanceled(session: Stripe.Identity.VerificationSession) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const user = await User.findByPk(parseInt(userId));
    if (!user) return;

    await user.update({
      verificationStatus: UserVerificationStatus.UNVERIFIED,
      // CORRECTION: Utiliser undefined au lieu de null
      stripeIdentitySessionId: undefined,
    });

    console.log(`🚫 Vérification annulée pour ${user.email}`);
  }
}