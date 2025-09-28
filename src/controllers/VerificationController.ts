import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import { UserVerificationStatus } from '../types/user';
import { StripeConnectService } from '../services/StripeConnectService'; // AJOUT

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export class VerificationController {
  // Démarrer une session de vérification d'identité
  static async startVerification(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      console.log('🔄 Démarrage vérification pour utilisateur:', user.id);
      console.log('💰 Devise utilisateur:', user.currency); // AJOUT

      // Détection du pays de l'utilisateur
      let userCountry = 'FR'; // Valeur par défaut (France)
      
      // Méthode 1: Si vous avez un champ country dans votre table users
      if (user.country) {
        userCountry = user.country.toUpperCase();
      }
      // Méthode 2: Détecter depuis les headers Cloudflare
      else if (req.headers['cf-ipcountry']) {
        userCountry = (req.headers['cf-ipcountry'] as string).toUpperCase();
      }
      // Méthode 3: Depuis les headers de géolocalisation personnalisés
      else if (req.headers['x-country']) {
        userCountry = (req.headers['x-country'] as string).toUpperCase();
      }
      
      console.log('🌍 Pays détecté pour l\'utilisateur:', userCountry);

      // Configuration de base pour tous les pays
      const sessionOptions: any = {
        document: {
          require_live_capture: true,
          require_matching_selfie: true,
        }
      };

      // Ajout de la vérification SSN UNIQUEMENT pour les États-Unis
      if (userCountry === 'US') {
        sessionOptions.document.require_id_number = true;
        console.log('🇺🇸 Utilisateur US - Vérification SSN activée');
      } else {
        console.log('🌍 Utilisateur non-US - Vérification SSN désactivée');
        // Pour les non-américains, ne pas exiger le numéro d'identification
        sessionOptions.document.require_id_number = false;
      }

      // Créer une session de vérification Stripe Identity
      const verificationSession = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          userId: user.id.toString(),
          country: userCountry,
          userCurrency: user.currency, // AJOUT - Préserver la devise
        },
        options: sessionOptions,
        return_url: `http://192.168.1.106:3000/verification/complete?user_id=${user.id}`,
      });

      console.log('✅ Session Stripe créée:', verificationSession.id);

      // Sauvegarder l'ID de session sur l'utilisateur SANS modifier la devise
      await user.update({
        stripeIdentitySessionId: verificationSession.id,
        verificationStatus: UserVerificationStatus.PENDING_VERIFICATION,
        // NE PAS modifier currency ici
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
        country: userCountry, // Retourner le pays détecté pour debug
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
          
          // NOUVEAU : Traitement différencié après validation
          const euCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'LU', 'FI', 'IE', 'GR'];
          const isEuropeanUser = euCountries.includes(user.country || 'FR');
          
          if (isEuropeanUser) {
            console.log('🇪🇺 Utilisateur européen - Création compte Connect');
            try {
              const connectAccount = await StripeConnectService.createConnectedAccountWithUserData(
                user.id, 
                req.ip || '127.0.0.1'
               
              );

               await StripeConnectService.updateConnectedAccountWithIdentityData(user.id, user.stripeIdentitySessionId);
              
              await user.update({
                verificationStatus: newStatus,
                paymentMethod: 'stripe_connect',
                stripeConnectedAccountId: connectAccount,
                identityVerifiedAt: new Date()
              });
              
              console.log('✅ Compte Connect créé:', connectAccount);
            } catch (connectError) {
              console.error('❌ Erreur création compte Connect:', connectError);
            }
          } else {
            console.log('🇩🇿 Utilisateur non-européen - Wallet manuel');
            await user.update({
              verificationStatus: newStatus,
              paymentMethod: 'manual',
              identityVerifiedAt: new Date()
            });
          }
          
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

      // Sauvegarder le nouveau statut (si pas déjà fait dans le switch)
      if (verificationSession.status !== 'verified') {
        await user.update({
          verificationStatus: newStatus,
          ...(newStatus === UserVerificationStatus.VERIFIED && { 
            identityVerifiedAt: new Date() 
          }),
        });
      }

      // Page de succès/échec (INCHANGÉE)
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
      console.log('💰 Devise actuelle:', user.currency, '🌍 Pays:', user.country); // AJOUT

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
          
          // NOUVEAU : Traitement différencié si pas encore fait
          if (!user.stripeConnectedAccountId) {
            const euCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'LU', 'FI', 'IE', 'GR'];
            const isEuropeanUser = euCountries.includes(user.country || 'FR');
            
            if (isEuropeanUser && !user.stripeConnectedAccountId) {
              console.log('🇪🇺 Utilisateur européen - Création compte Connect');
              try {
                const connectAccount = await StripeConnectService.createConnectedAccountWithUserData(
                  user.id, 
                  req.ip || '127.0.0.1'
                );

                await StripeConnectService.updateConnectedAccountWithIdentityData(user.id, user.stripeIdentitySessionId);
                
                await user.update({
                  verificationStatus: newStatus,
                  paymentMethod: 'stripe_connect',
                  stripeConnectedAccountId: connectAccount,
                  identityVerifiedAt: new Date()
                });
                
                console.log('✅ Compte Connect créé:', connectAccount);
              } catch (connectError) {
                console.error('❌ Erreur création compte Connect:', connectError);
              }
            } else if (!isEuropeanUser) {
              console.log('🇩🇿 Utilisateur non-européen - Wallet manuel');
              await user.update({
                verificationStatus: newStatus,
                paymentMethod: 'manual',
                identityVerifiedAt: new Date()
              });
            }
          }
          
          break;
        case 'requires_input':
          newStatus = UserVerificationStatus.VERIFICATION_FAILED;
          break;
        case 'processing':
          newStatus = UserVerificationStatus.PENDING_VERIFICATION;
          break;
        default:
          newStatus = UserVerificationStatus.UNVERIFIED;
      }

      // Sauvegarder le nouveau statut si pas encore fait
      if (newStatus !== user.verificationStatus && verificationSession.status !== 'verified') {
        await user.update({
          verificationStatus: newStatus,
          ...(newStatus === UserVerificationStatus.VERIFIED && { 
            identityVerifiedAt: new Date() 
          }),
        });
      }

      // Recharger l'utilisateur pour avoir les données à jour
      await user.reload();

      res.json({
        success: true,
        verificationStatus: newStatus,
        stripeStatus: verificationSession.status,
        paymentMethod: user.paymentMethod, // AJOUT
        hasStripeConnect: !!user.stripeConnectedAccountId, // AJOUT
        currency: user.currency, // AJOUT
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

  // Nouvelle fonction à ajouter après la vérification Identity
static async updateConnectedAccountWithIdentityData(userId: number, verificationSessionId: string): Promise<void> {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.stripeConnectedAccountId) {
      throw new Error('Utilisateur ou compte Connect non trouvé');
    }

    // Récupérer les données vérifiées de Stripe Identity
    const verificationSession = await stripe.identity.verificationSessions.retrieve(verificationSessionId);
    
    if (verificationSession.status === 'verified' && verificationSession.verified_outputs) {
      const verifiedData = verificationSession.verified_outputs;
      
      // Mettre à jour le compte Connect avec les données Identity
      const updateData: any = {
        individual: {}
      };

      // Ajouter les données si disponibles
      if (verifiedData.first_name) {
        updateData.individual.first_name = verifiedData.first_name;
      }
      if (verifiedData.last_name) {
        updateData.individual.last_name = verifiedData.last_name;
      }
      if (verifiedData.dob) {
        updateData.individual.dob = {
          day: verifiedData.dob.day,
          month: verifiedData.dob.month,
          year: verifiedData.dob.year
        };
      }
      if (verifiedData.id_number) {
        updateData.individual.id_number = verifiedData.id_number;
      }

      // Transférer le document d'identité
if (verificationSession.last_verification_report) {
  const report = await stripe.identity.verificationReports.retrieve(verificationSession.last_verification_report as string);
  
  // Correction : utiliser les bonnes propriétés
  if (report.document) {
    updateData.individual.verification = {
      document: {}
    };
    
    // Vérifier si les fichiers existent avant de les assigner
    if ((report.document as any).front) {
      updateData.individual.verification.document.front = (report.document as any).front;
    }
    if ((report.document as any).back) {
      updateData.individual.verification.document.back = (report.document as any).back;
    }
  }
}

      // Mettre à jour le compte Connect seulement si on a des données
      if (Object.keys(updateData.individual).length > 0) {
        await stripe.accounts.update(user.stripeConnectedAccountId, updateData);
        console.log('✅ Compte Connect mis à jour avec données Identity');
      }
    }
  } catch (error) {
    console.error('❌ Erreur mise à jour compte Connect:', error);
    throw error;
  }
}

  // Webhook Stripe (INCHANGÉ)
  static async stripeWebhook(req: Request, res: Response) {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return res.status(400).send('Webhook signature missing');
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      console.log('🔔 Webhook Stripe reçu:', event.type);

      // Gérer tous les événements de vérification
      if (event.type.startsWith('identity.verification_session.')) {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;

        console.log('👤 UserId du webhook:', userId);
        console.log('📊 Statut session:', session.status);

        if (userId) {
          const user = await User.findByPk(userId);
          if (user) {
            let newStatus = UserVerificationStatus.UNVERIFIED;
            
            switch (session.status) {
              case 'verified':
                newStatus = UserVerificationStatus.VERIFIED;
                
                // NOUVEAU : Traitement Connect via webhook aussi
                const euCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'LU', 'FI', 'IE', 'GR'];
                const isEuropeanUser = euCountries.includes(user.country || 'FR');
                
                if (isEuropeanUser && !user.stripeConnectedAccountId) {
                  try {
                    const connectAccount = await StripeConnectService.createConnectedAccountWithUserData(
                      user.id, 
                      '127.0.0.1' // IP par défaut pour webhook
                    );

                    await StripeConnectService.updateConnectedAccountWithIdentityData(user.id, session.id);
                    
                    await user.update({
                      verificationStatus: newStatus,
                      paymentMethod: 'stripe_connect',
                      stripeConnectedAccountId: connectAccount,
                      identityVerifiedAt: new Date()
                    });
                  } catch (connectError) {
                    console.error('❌ Erreur création compte Connect via webhook:', connectError);
                  }
                } else if (!isEuropeanUser) {
                  await user.update({
                    verificationStatus: newStatus,
                    paymentMethod: 'manual',
                    identityVerifiedAt: new Date()
                  });
                }
                
                break;
              case 'requires_input':
                newStatus = UserVerificationStatus.VERIFICATION_FAILED;
                await user.update({ verificationStatus: newStatus });
                break;
              case 'processing':
                newStatus = UserVerificationStatus.PENDING_VERIFICATION;
                await user.update({ verificationStatus: newStatus });
                break;
            }
            
            console.log('✅ Utilisateur', userId, 'statut mis à jour vers:', newStatus);
          } else {
            console.log('❌ Utilisateur non trouvé:', userId);
          }
        } else {
          console.log('❌ Pas de userId dans les metadata');
        }
      }

      res.json({ received: true });

    } catch (error: any) {
      console.error('❌ Erreur webhook:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }

  static async submitStripeData(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { dateOfBirth, addressLine1, addressCity, addressPostalCode, acceptStripeTerms, phone } = req.body;

      // Validation
      if (!dateOfBirth || !addressLine1 || !addressCity || !addressPostalCode || !acceptStripeTerms) {
        return res.status(400).json({
          success: false,
          error: 'Tous les champs sont requis'
        });
      }

      // Mettre à jour l'utilisateur avec les données Stripe
      await user.update({
        dateOfBirth: new Date(dateOfBirth),
        addressLine1,
        addressCity,
        addressPostalCode,
        phone,
        stripeTermsAccepted: acceptStripeTerms,
        stripeTermsAcceptedAt: new Date()

      });

      console.log('✅ Données Stripe sauvegardées pour utilisateur:', user.id);

      res.json({
        success: true,
        message: 'Informations sauvegardées. Vous pouvez maintenant procéder à la vérification d\'identité.'
      });

    } catch (error) {
      console.error('❌ Erreur sauvegarde données Stripe:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde'
      });
    }
  }
}