// src/controllers/stripeConnectController.ts
import { Request, Response } from 'express';
import { StripeConnectService } from '../services/StripeConnectService';
import { User } from '../models/User';

export class StripeConnectController {

  /**
   * Initier l'onboarding Stripe Connect pour un voyageur
   */
  static async initiateOnboarding(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Vérifier si l'utilisateur peut utiliser Stripe Connect
      const recommendedMethod = user.getRecommendedPaymentMethod();
      if (recommendedMethod !== 'stripe_connect') {
        return res.status(400).json({ 
          error: 'Stripe Connect non disponible pour votre pays',
          recommendedMethod: 'manual'
        });
      }

      // Créer ou récupérer le Connected Account
      let accountId = user.stripeConnectedAccountId;
      if (!accountId) {
        accountId = await StripeConnectService.createConnectedAccount(userId);
      }

      // Créer le lien d'onboarding
      const onboardingUrl = await StripeConnectService.createOnboardingLink(userId);

      res.json({
        success: true,
        onboardingUrl,
        accountId,
        message: 'Lien d\'onboarding Stripe Connect généré'
      });

    } catch (error: any) {
      console.error('Erreur initiation onboarding:', error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'initiation de l\'onboarding',
        details: error.message 
      });
    }
  }

  /**
   * Vérifier le statut du compte Connect
   */
  static async getAccountStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const status = await StripeConnectService.getAccountStatus(userId);
      const user = await User.findByPk(userId);

      res.json({
        success: true,
        accountStatus: status,
        userPaymentMethod: user?.paymentMethod,
        canUseConnect: user?.canUseStripeConnect(),
        recommendedMethod: user?.getRecommendedPaymentMethod()
      });

    } catch (error: any) {
      console.error('Erreur vérification statut:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la vérification du statut',
        details: error.message 
      });
    }
  }

  /**
   * Mettre à jour le pays de l'utilisateur (pour déterminer le mode de paiement)
   */
  static async updateCountry(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { country } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      if (!country || country.length !== 2) {
        return res.status(400).json({ error: 'Code pays invalide (format ISO 2 lettres)' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Mettre à jour le pays
      await User.update(
        { country: country.toUpperCase() },
        { where: { id: userId } }
      );

      // Récupérer l'utilisateur mis à jour
      const updatedUser = await User.findByPk(userId);
      const recommendedMethod = updatedUser?.getRecommendedPaymentMethod();

      res.json({
        success: true,
        country: country.toUpperCase(),
        recommendedPaymentMethod: recommendedMethod,
        canUseConnect: recommendedMethod === 'stripe_connect',
        message: 'Pays mis à jour avec succès'
      });

    } catch (error: any) {
      console.error('Erreur mise à jour pays:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour du pays',
        details: error.message 
      });
    }
  }

  /**
   * Déconnecter le compte Stripe Connect
   */
  static async disconnectAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      // Remettre l'utilisateur en mode manuel
      await User.update(
        { 
          stripeConnectedAccountId: undefined,
          paymentMethod: 'manual' 
        },
        { where: { id: userId } }
      );

      res.json({
        success: true,
        message: 'Compte Stripe Connect déconnecté',
        paymentMethod: 'manual'
      });

    } catch (error: any) {
      console.error('Erreur déconnexion compte:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la déconnexion',
        details: error.message 
      });
    }
  }

  /**
   * Récupérer les informations de paiement de l'utilisateur
   */
  static async getPaymentInfo(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const accountStatus = user.stripeConnectedAccountId 
        ? await StripeConnectService.getAccountStatus(userId)
        : null;

      res.json({
        success: true,
        paymentInfo: {
          country: user.country,
          paymentMethod: user.paymentMethod,
          hasConnectedAccount: !!user.stripeConnectedAccountId,
          accountStatus,
          canUseConnect: user.canUseStripeConnect(),
          recommendedMethod: user.getRecommendedPaymentMethod()
        }
      });

    } catch (error: any) {
      console.error('Erreur récupération info paiement:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des informations',
        details: error.message 
      });
    }
  }
}