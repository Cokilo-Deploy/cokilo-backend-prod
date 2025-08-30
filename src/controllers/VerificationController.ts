import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import { UserVerificationStatus } from '../types/user';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export class VerificationController {
  // Démarrer une session de vérification d'identité
  static async startVerification(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      console.log('🔄 Démarrage vérification pour utilisateur:', user.id);

      // Créer une session de vérification Stripe Identity
      const verificationSession = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          userId: user.id.toString(),
        },
        options: {
          document: {
            require_id_number: true,
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        return_url: `http://192.168.1.106:3000/verification/complete?user_id=${user.id}`,
      });

      console.log('✅ Session Stripe créée:', verificationSession.id);

      // Sauvegarder l'ID de session sur l'utilisateur
      await user.update({
        stripeIdentitySessionId: verificationSession.id,
        verificationStatus: UserVerificationStatus.PENDING_VERIFICATION, // ← Corrigé
      });

      res.json({
        success: true,
        verificationSession: {
          id: verificationSession.id,
          client_secret: verificationSession.client_secret,
          status: verificationSession.status,
          url: verificationSession.url,
        },
        message: 'Session de vérification créée',
      });

    } catch (error: any) {
      console.error('❌ Erreur création session vérification:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la session de vérification',
        details: error.message,
      });
    }
  }

  // ... vos méthodes existantes ...

// Page de completion de vérification
static async completeVerification(req: Request, res: Response) {
  try {
    const { user_id } = req.query;
    
    console.log('🎉 Retour de vérification pour utilisateur:', user_id);

    if (!user_id) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erreur - CoKilo</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #FF3B30; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Erreur</h1>
          <p>ID utilisateur manquant</p>
        </body>
        </html>
      `);
    }

    // Trouver l'utilisateur et vérifier son statut
    const user = await User.findByPk(user_id as string);
    
    if (!user || !user.stripeIdentitySessionId) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erreur - CoKilo</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #FF3B30; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Utilisateur non trouvé</h1>
          <p>Session de vérification introuvable</p>
        </body>
        </html>
      `);
    }

    // Récupérer le statut depuis Stripe
    const verificationSession = await stripe.identity.verificationSessions.retrieve(
      user.stripeIdentitySessionId
    );

    console.log('📊 Statut final Stripe:', verificationSession.status);

    // Mettre à jour le statut selon Stripe
    let newStatus = UserVerificationStatus.UNVERIFIED;
    let statusMessage = 'Vérification en cours...';
    let statusColor = '#FF9500';

    switch (verificationSession.status) {
      case 'verified':
        newStatus = UserVerificationStatus.VERIFIED;
        statusMessage = '✅ Identité vérifiée avec succès !';
        statusColor = '#34C759';
        break;
      case 'requires_input':
        newStatus = UserVerificationStatus.VERIFICATION_FAILED;
        statusMessage = '❌ Vérification échouée - Action requise';
        statusColor = '#FF3B30';
        break;
      case 'processing':
        newStatus = UserVerificationStatus.PENDING_VERIFICATION;
        statusMessage = '⏳ Vérification en cours de traitement...';
        statusColor = '#FF9500';
        break;
      default:
        statusMessage = '❓ Statut de vérification inconnu';
        statusColor = '#8E8E93';
    }

    // Sauvegarder le nouveau statut
    await user.update({
      verificationStatus: newStatus,
      ...(newStatus === UserVerificationStatus.VERIFIED && { 
        identityVerifiedAt: new Date() 
      }),
    });

    // Page de succès/échec
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vérification d'identité - CoKilo</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 50px 20px;
            background: #f8f9fa;
            margin: 0;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #007AFF;
            margin-bottom: 30px;
          }
          .status {
            font-size: 24px;
            font-weight: 600;
            color: ${statusColor};
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #666;
            line-height: 1.5;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: #007AFF;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px;
          }
          .button:hover {
            background: #0056CC;
          }
          .secondary {
            background: #f0f0f0;
            color: #333;
          }
          .secondary:hover {
            background: #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">CoKilo</div>
          <div class="status">${statusMessage}</div>
          <div class="message">
            ${newStatus === UserVerificationStatus.VERIFIED 
              ? 'Vous pouvez maintenant créer des voyages et réserver des livraisons en toute sécurité.' 
              : newStatus === UserVerificationStatus.VERIFICATION_FAILED
              ? 'La vérification a échoué. Vous pouvez réessayer depuis l\'application.' 
              : 'La vérification est en cours. Vous recevrez une notification une fois terminée.'
            }
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 40px;">
            Vous pouvez fermer cette page et retourner dans l'application CoKilo.
          </p>
        </div>
        
        <script>
          // Essayer de fermer la page automatiquement après 3 secondes
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `);

  } catch (error: any) {
    console.error('❌ Erreur completion vérification:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erreur - CoKilo</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #FF3B30; }
        </style>
      </head>
      <body>
        <h1 class="error">❌ Erreur technique</h1>
        <p>Une erreur est survenue lors de la vérification.</p>
        <p>Veuillez retourner dans l'application et réessayer.</p>
      </body>
      </html>
    `);
  }
}



  // Vérifier le statut de la vérification
  static async checkStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      console.log('🔍 Vérification statut pour utilisateur:', user.id);

      // Si pas de session de vérification
      if (!user.stripeIdentitySessionId) {
        return res.json({
          success: true,
          verificationStatus: user.verificationStatus || UserVerificationStatus.UNVERIFIED,
          userAccess: getUserAccessInfo(user),
        });
      }

      // Récupérer le statut depuis Stripe
      const verificationSession = await stripe.identity.verificationSessions.retrieve(
        user.stripeIdentitySessionId
      );

      console.log('📊 Statut Stripe:', verificationSession.status);

      // Mettre à jour le statut local selon Stripe
      let newStatus = user.verificationStatus;
      
      switch (verificationSession.status) {
        case 'verified':
          newStatus = UserVerificationStatus.VERIFIED;
          break;
        case 'requires_input':
          newStatus = UserVerificationStatus.VERIFICATION_FAILED; // ← Corrigé
          break;
        case 'processing':
          newStatus = UserVerificationStatus.PENDING_VERIFICATION; // ← Corrigé
          break;
        default:
          newStatus = UserVerificationStatus.UNVERIFIED;
      }

      // Sauvegarder le nouveau statut
      if (newStatus !== user.verificationStatus) {
        await user.update({
          verificationStatus: newStatus,
          ...(newStatus === UserVerificationStatus.VERIFIED && { 
            identityVerifiedAt: new Date() 
          }),
        });
      }

      res.json({
        success: true,
        verificationStatus: newStatus,
        stripeStatus: verificationSession.status,
        userAccess: getUserAccessInfo(user),
      });

    } catch (error: any) {
      console.error('❌ Erreur vérification statut:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du statut',
        details: error.message,
      });
    }
  }

  // Webhook Stripe
  static async stripeWebhook(req: Request, res: Response) {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return res.status(400).send('Webhook signature missing');
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      console.log('🔔 Webhook Stripe reçu:', event.type);

      if (event.type === 'identity.verification_session.verified') {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;

        if (userId) {
          const user = await User.findByPk(userId);
          if (user) {
            await user.update({
              verificationStatus: UserVerificationStatus.VERIFIED,
              identityVerifiedAt: new Date(),
            });
            console.log('✅ Utilisateur', userId, 'marqué comme vérifié');
          }
        }
      }

      res.json({ received: true });

    } catch (error: any) {
      console.error('❌ Erreur webhook:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
}