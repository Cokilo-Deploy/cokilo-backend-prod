"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeIdentityService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const User_1 = require("../models/User");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
});
class StripeIdentityService {
    // Créer une session de vérification d'identité
    static async createVerificationSession(userId) {
        try {
            const user = await User_1.User.findByPk(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }
            // Vérifier si déjà vérifié
            if (user.verificationStatus === User_1.UserVerificationStatus.VERIFIED) {
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
                verificationStatus: User_1.UserVerificationStatus.PENDING_VERIFICATION,
            });
            return {
                sessionId: verificationSession.id,
                clientSecret: verificationSession.client_secret,
                url: verificationSession.url,
            };
        }
        catch (error) {
            throw new Error(`Erreur création session de vérification: ${error}`);
        }
    }
    // Vérifier le statut de la vérification
    static async checkVerificationStatus(sessionId) {
        try {
            const session = await stripe.identity.verificationSessions.retrieve(sessionId);
            return {
                status: session.status,
                verifiedData: session.verified_outputs,
                lastError: session.last_error,
            };
        }
        catch (error) {
            throw new Error(`Erreur vérification statut: ${error}`);
        }
    }
    // Traitement des webhooks Stripe Identity
    static async handleVerificationWebhook(event) {
        try {
            switch (event.type) {
                case 'identity.verification_session.verified':
                    await this.handleVerificationSuccess(event.data.object);
                    break;
                case 'identity.verification_session.requires_input':
                    await this.handleVerificationRequiresInput(event.data.object);
                    break;
                case 'identity.verification_session.canceled':
                    await this.handleVerificationCanceled(event.data.object);
                    break;
            }
        }
        catch (error) {
            console.error('Erreur traitement webhook identity:', error);
            throw error;
        }
    }
    static async handleVerificationSuccess(session) {
        const userId = session.metadata?.userId;
        if (!userId)
            return;
        const user = await User_1.User.findByPk(parseInt(userId));
        if (!user)
            return;
        // Marquer comme vérifié
        await user.update({
            verificationStatus: User_1.UserVerificationStatus.VERIFIED,
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
    static async handleVerificationRequiresInput(session) {
        const userId = session.metadata?.userId;
        if (!userId)
            return;
        const user = await User_1.User.findByPk(parseInt(userId));
        if (!user)
            return;
        await user.update({
            verificationStatus: User_1.UserVerificationStatus.VERIFICATION_FAILED,
        });
        console.log(`❌ Vérification échouée pour ${user.email}`);
    }
    static async handleVerificationCanceled(session) {
        const userId = session.metadata?.userId;
        if (!userId)
            return;
        const user = await User_1.User.findByPk(parseInt(userId));
        if (!user)
            return;
        await user.update({
            verificationStatus: User_1.UserVerificationStatus.UNVERIFIED,
            // CORRECTION: Utiliser undefined au lieu de null
            stripeIdentitySessionId: undefined,
        });
        console.log(`🚫 Vérification annulée pour ${user.email}`);
    }
}
exports.StripeIdentityService = StripeIdentityService;
