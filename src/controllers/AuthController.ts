import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import { ExtendedRegistrationService } from '../services/ExtendedRegistrationService';
import axios from 'axios';
import { EmailVerificationService } from '../services/EmailVerificationService';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { Transaction } from '../models/Transaction'; 
import { Trip } from '../models/Trip';  
import { ChatMessage } from '../models/ChatMessage'; 
import { ChatConversation } from '../models/ChatConversation'; 
import { Stripe } from 'stripe';
import { WalletService } from '../services/walletService';
import { Wallet } from '../models/Wallet';
import { ErrorCode, errorResponse } from '../utils/errorCodes';
import { sendLocalizedResponse } from '../utils/responseHelpers';

const nodemailer = require('nodemailer');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
});


export class AuthController {
  
  // Fonction helper pour détecter la devise par IP
  private static async detectCurrencyFromIP(req: Request): Promise<string> {
    try {
      // Priorité aux headers de proxy (DigitalOcean utilise des proxies)
      const clientIP = req.headers['x-forwarded-for'] as string ||
                      req.headers['x-real-ip'] as string ||
                      req.headers['cf-connecting-ip'] as string || // Cloudflare
                      req.connection?.remoteAddress ||
                      req.socket?.remoteAddress ||
                      req.ip ||
                      '127.0.0.1';

      // Prendre seulement la première IP si liste séparée par virgules
      const realIP = clientIP.split(',')[0].trim();
      
      console.log('=== DETECTION IP ===');
      console.log('Header x-forwarded-for:', req.headers['x-forwarded-for']);
      console.log('Header x-real-ip:', req.headers['x-real-ip']);
      console.log('IP finale utilisée:', realIP);

      // Exclure les IPs privées/locales
      if (realIP === '127.0.0.1' || 
          realIP === '::1' || 
          realIP.startsWith('10.') ||      // Réseaux privés
          realIP.startsWith('172.') ||     // Réseaux privés  
          realIP.startsWith('192.168.') || // Réseaux privés
          realIP.includes('localhost')) {
        console.log('IP PRIVEE DETECTEE - retour EUR');
        return 'EUR';
      }

      const response = await axios.get(`http://ip-api.com/json/${realIP}?fields=countryCode,country,query`, {
        timeout: 3000
      });
      
      console.log('API Response complète:', response.data);
      
      const countryCode = (response.data as any).countryCode;
      if (!countryCode) {
        console.log('Pas de pays détecté - retour EUR');
        return 'EUR';
      }
      
      const countryToCurrency: { [key: string]: string } = {
        'DZ': 'DZD', 'MA': 'MAD', 'TN': 'TND', 'EG': 'EGP',
        'SA': 'SAR', 'AE': 'AED', 'US': 'USD', 'CA': 'CAD',
        'GB': 'GBP', 'CH': 'CHF'
      };
      
      const finalCurrency = countryToCurrency[countryCode] || 'EUR';
      console.log('PAYS:', countryCode, '-> DEVISE:', finalCurrency);
      
      return finalCurrency;
    } catch (error) {
      console.log('ERREUR DETECTION:', error);
      return 'EUR';
    }
  }

  // Fonction helper pour détecter le pays par IP
  private static async detectCountryFromIP(req: Request): Promise<string> {
    try {
      const clientIP = req.headers['x-forwarded-for'] as string ||
                      req.headers['x-real-ip'] as string ||
                      req.headers['cf-connecting-ip'] as string ||
                      req.connection?.remoteAddress ||
                      req.socket?.remoteAddress ||
                      req.ip ||
                      '127.0.0.1';

      const realIP = clientIP.split(',')[0].trim();
      
      // Exclure les IPs privées/locales
      if (realIP === '127.0.0.1' || realIP === '::1' || 
          realIP.startsWith('10.') || realIP.startsWith('172.') || 
          realIP.startsWith('192.168.') || realIP.includes('localhost')) {
        return 'FR'; // Défaut Europe
      }

      const response = await axios.get(`http://ip-api.com/json/${realIP}?fields=countryCode`, {
        timeout: 3000
      });
      
      return (response.data as any).countryCode || 'FR';
    } catch (error) {
      console.log('ERREUR DETECTION PAYS:', error);
      return 'FR';
    }
  }

  // NOUVELLE MÉTHODE - Validation directe avec création du compte Connect
private static async createAndValidateStripeConnect(data: any, userIp: string): Promise<{
  success: boolean, 
  errors: string[], 
  accountId?: string
}> {
  const errors: string[] = [];
  
  try {
    console.log('🔍 Création + Validation Stripe Connect...');
    console.log('📍 Données:', {
      country: data.country,
      postalCode: data.postalCode,
      phone: data.phone,
      city: data.city
    });
    
    // Préparer date de naissance
    const dobParts = data.dateOfBirth.split('-');
    
    // Préparer l'adresse
    const address: any = {
      line1: data.addressLine1,
      city: data.city,
      postal_code: data.postalCode,
      country: data.country,
    };
    
    if (data.addressLine2) {
      address.line2 = data.addressLine2;
    }
    
    // État requis pour US, CA, AU
    if (['US', 'CA', 'AU'].includes(data.country) && data.state) {
      address.state = data.state;
    }
    
    // Créer le compte Connect RÉEL
    const account = await stripe.accounts.create({
      type: 'express',
      country: data.country,
      email: data.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        dob: {
          day: parseInt(dobParts[2]),
          month: parseInt(dobParts[1]),
          year: parseInt(dobParts[0]),
        },
        address: address,
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: userIp,
      },
    });

    console.log('✅ Compte Stripe Connect créé:', account.id);
    
    return { 
      success: true, 
      errors: [],
      accountId: account.id
    };

  } catch (error: any) {
    console.error('❌ Création Stripe Connect échouée:', error);
    console.error('Type erreur:', error.type);
    console.error('Param:', error.param);
    console.error('Message:', error.message);
    
    // Parser les erreurs Stripe pour messages clairs
    if (error.type === 'StripeInvalidRequestError') {
      const param = error.param || '';
      
      if (param.includes('postal_code')) {
        errors.push(`Code postal invalide pour ${data.country}. Ce code postal n'existe pas dans notre base.`);
      } else if (param.includes('phone')) {
        errors.push(`Numéro de téléphone invalide. Vérifiez le format (ex: +33 6 XX XX XX XX pour France).`);
      } else if (param.includes('address.city')) {
        errors.push(`Ville invalide ou ne correspond pas au code postal.`);
      } else if (param.includes('address')) {
        errors.push(`Adresse invalide. Vérifiez que la ville et le code postal correspondent.`);
      } else if (param.includes('dob')) {
        errors.push(`Date de naissance invalide.`);
      } else if (param.includes('state')) {
        errors.push(`État/Province manquant. Requis pour ${data.country}.`);
      } else if (param.includes('first_name') || param.includes('last_name')) {
        errors.push(`Nom ou prénom invalide.`);
      } else {
        errors.push(error.message || 'Données invalides pour Stripe');
      }
    } else {
      errors.push('Erreur lors de la création du compte de paiement.');
    }
    
    return { success: false, errors };
  }
}

  static async register(req: Request, res: Response) {
    try {
      // Si c'est l'ancien format (sans champs étendus), utiliser l'ancienne méthode
      const { country, dateOfBirth, addressLine1, acceptStripeTerms } = req.body;
      
      if (!country && !dateOfBirth && !addressLine1 && !acceptStripeTerms) {
        // ANCIEN FORMAT - Inscription simple
        return AuthController.registerSimple(req, res);
      }

      // NOUVEAU FORMAT - Inscription étendue avec Stripe Connect
      const userIp = req.headers['x-forwarded-for'] || 
                     req.headers['do-connecting-ip'] || 
                     req.connection.remoteAddress || 
                     '127.0.0.1';

      // Ajouter détection automatique de devise et pays si manquante
      const detectedCurrency = await AuthController.detectCurrencyFromIP(req);
      req.body.currency = req.body.currency || detectedCurrency;

      const detectedCountry = await AuthController.detectCountryFromIP(req);
      req.body.country = req.body.country || detectedCountry;


      const result = await ExtendedRegistrationService.registerWithStripeConnect(
        req.body, 
        Array.isArray(userIp) ? userIp[0] : userIp.toString()
      );

      const userAccess = getUserAccessInfo(result.user);

      res.status(201).json({
        success: true,
        data: {
          token: result.token,
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            verificationStatus: result.user.verificationStatus,
            currency: result.user.currency,
            country: result.user.country,
            paymentMethod: result.user.paymentMethod
          },
          detectedCurrency: req.body.currency,
          detectedCountry: req.body.country,
          stripeAccountCreated: result.stripeAccountCreated
        },
        userAccess,
        message: 'Inscription réussie'
      });

    } catch (error: any) {
  console.error('Erreur inscription:', error);
  
  // Parser les erreurs pour le frontend
  let errorMessage = 'Erreur lors de l\'inscription';
  let fieldErrors: any = {};
  
  const errorText = error.message || '';
  
  if (errorText.includes('postal') || errorText.includes('Code postal')) {
    fieldErrors.postalCode = 'Code postal invalide ou inexistant';
    errorMessage = 'Code postal invalide pour ce pays';
  } else if (errorText.includes('phone') || errorText.includes('téléphone')) {
    fieldErrors.phone = 'Numéro invalide';
    errorMessage = 'Numéro de téléphone invalide';
  } else if (errorText.includes('address') || errorText.includes('Adresse')) {
    fieldErrors.address = 'Adresse invalide';
    errorMessage = 'L\'adresse ne correspond pas au code postal';
  } else if (errorText.includes('state') || errorText.includes('État')) {
    fieldErrors.state = 'État/Province requis';
    errorMessage = 'État ou province requis pour ce pays';
  }
  
  res.status(400).json({
    success: false,
    error: errorMessage,
    fieldErrors: fieldErrors,
    details: error.message
  });
}
  }

  // Méthode pour l'ancien format d'inscription (rétrocompatibilité)
 // Dans AuthController.ts - Méthode registerSimple modifiée
static async registerSimple(req: Request, res: Response) {
  try {
    console.log('🚀 === DEBUT REGISTER SIMPLE ===');
    console.log('📥 Données reçues:', req.body);
    
    const { firstName, lastName, email, password } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      console.log('❌ Validation échouée - champs manquants');
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    console.log('✅ Validation passée');
    console.log('🔍 Recherche utilisateur existant pour:', email);
    
    const existingUser = await User.findOne({ where: { email } });
    console.log('✅ Recherche terminée - utilisateur existe:', !!existingUser);
    
    if (existingUser) {
      console.log('❌ Email déjà utilisé');
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    console.log('🌍 Détection IP en cours...');
    const detectedCurrency = await AuthController.detectCurrencyFromIP(req);
        
    const detectedCountry = await AuthController.detectCountryFromIP(req);
    console.log('✅ IP détectée - devise:', detectedCurrency, detectedCountry);
    
    
    console.log('🔑 Génération code de vérification...');
    const verificationCode = EmailVerificationService.generateVerificationCode();
    const codeExpiration = EmailVerificationService.getCodeExpiration();
    console.log('✅ Code généré:', verificationCode);
    console.log('⏰ Expiration:', codeExpiration);

    console.log('👤 Création utilisateur en cours...');
    const user = await User.create({
      firstName,
      lastName,
      email,
      password, // Le hook beforeCreate va hasher
      currency: detectedCurrency,
      country: detectedCountry,
      emailVerifiedAt: undefined,
      verificationCode,
      verificationCodeExpires: codeExpiration
    });
    console.log('✅ Utilisateur créé avec ID:', user.id);
    console.log('📋 Détails utilisateur:', {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      currency: user.currency
    });

    console.log('📧 Envoi email de vérification...');
    console.log('📧 Destinataire:', email);
    console.log('📧 Nom:', firstName);
    console.log('📧 Code à envoyer:', verificationCode);
    
    const emailSent = await EmailVerificationService.sendVerificationCode(
      email,
      firstName,
      verificationCode
    );
    console.log('📧 Résultat envoi email:', emailSent);

    if (!emailSent) {
      console.log('❌ Échec envoi email - suppression utilisateur');
      await user.destroy();
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi du code de vérification'
      });
    }

    console.log('✅ Processus terminé avec succès');
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        requiresVerification: true,
        detectedCurrency,
        detectedCountry
      },
      message: 'Compte créé. Vérifiez votre email pour l\'activer.'
    });

    console.log('🚀 === FIN REGISTER SIMPLE REUSSI ===');

  } catch (error: any) {
    console.error('💥 === ERREUR REGISTER SIMPLE ===');
    console.error('💥 Type erreur:', error.name);
    console.error('💥 Message:', error.message);
    console.error('💥 Stack:', error.stack);
    console.error('💥 Erreur complète:', error);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de l\'inscription'
    });
  }
}

// Méthodes de vérification
static async verifyEmail(req: Request, res: Response) {
  try {
    const { userId, verificationCode } = req.body;

    if (!userId || !verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Code de vérification requis'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    if (user.emailVerifiedAt) {
      return res.status(400).json({
        success: false,
        error: 'Email déjà vérifié'
      });
    }

    const isValid = EmailVerificationService.isCodeValid(
      verificationCode,
      user.verificationCode || '',
      user.verificationCodeExpires || new Date()
    );

    if (!isValid) {
  return res.status(400).json(errorResponse(ErrorCode.INVALID_VERIFICATION_CODE));
}

    // Marquer comme vérifié
    await user.update({
      emailVerifiedAt: new Date(),
      verificationCode: undefined,
      verificationCodeExpires: undefined
    });

    // Générer le JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          currency: user.currency
        }
      },
      message: 'Email vérifié avec succès'
    });

  } catch (error: any) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification'
    });
  }
}

static async resendVerification(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    const user = await User.findByPk(userId);
    if (!user || user.emailVerifiedAt) {
      return res.status(400).json({
        success: false,
        error: 'Utilisateur non trouvé ou déjà vérifié'
      });
    }

    const verificationCode = EmailVerificationService.generateVerificationCode();
    const codeExpiration = EmailVerificationService.getCodeExpiration();

    await user.update({
      verificationCode,
      verificationCodeExpires: codeExpiration
    });

    await EmailVerificationService.sendVerificationCode(
      user.email,
      user.firstName,
      verificationCode
    );

    res.json({
      success: true,
      message: 'Nouveau code envoyé'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du renvoi'
    });
  }
}

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
  return res.status(401).json(errorResponse(ErrorCode.INVALID_CREDENTIALS));
}

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
  return res.status(401).json(errorResponse(ErrorCode.INVALID_CREDENTIALS));
}
      if (!user.emailVerifiedAt) {
      console.log('Email non vérifié pour:', user.email);

      const verificationCode = EmailVerificationService.generateVerificationCode();
      const codeExpiration = EmailVerificationService.getCodeExpiration();
      await user.update({
        verificationCode,
        verificationCodeExpires: codeExpiration
      });

      await EmailVerificationService.sendVerificationCode(
        user.email,
        user.firstName,
        verificationCode
      );

      console.log('Nouveau code envoyé automatiquement à:', user.email);

      return res.status(403).json({
  success: false,
  errorCode: ErrorCode.EMAIL_NOT_VERIFIED,
  requiresVerification: true,
  userId: user.id,
  email: user.email
});
    }

      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

      const userAccess = getUserAccessInfo(user);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            verificationStatus: user.verificationStatus,
            currency: user.currency,
            country: user.country,
            paymentMethod: user.paymentMethod
          }
        },
        userAccess,
        message: 'Connexion réussie'
      });

    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({  
        success: false,
        error: 'Erreur lors de la connexion'
      });
    }
  }

  static async getProfile(req: any, res: Response) {
    try {
      const user = req.user;
      const userAccess = getUserAccessInfo(user);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            verificationStatus: user.verificationStatus,
            rating: user.rating,
            totalTrips: user.totalTrips,
            totalDeliveries: user.totalDeliveries,
            currency: user.currency,
            country: user.country,
            paymentMethod: user.paymentMethod,
            stripeConnectedAccountId: user.stripeconnectedaccountid
          }
        },
        userAccess
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du profil'
      });
    }
  }

  
  // Dans AuthController.ts - Modifiez votre fonction resetPassword existante
static async resetPassword(req: Request, res: Response) {
  try {
    console.log('🔄 Début resetPassword');
    const { email } = req.body;
    console.log('📧 Email reçu:', email);

    if (!email) {
      console.log('❌ Email manquant');
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    console.log('🔍 Recherche utilisateur...');
    const user = await User.findOne({ where: { email } });
    console.log('👤 Utilisateur trouvé:', !!user);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      });
    }

    console.log('🔑 Génération token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    console.log('💾 Mise à jour utilisateur...');
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetTokenExpiry
    });

    console.log('📨 Configuration email...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `https://cokilo.com/reset-password?token=${resetToken}`;
    console.log('🔗 URL générée:', resetUrl);
    
    console.log('📧 Envoi email...');
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'CoKilo'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe CoKilo',
      html: `<p>Cliquez pour réinitialiser: <a href="${resetUrl}">Réinitialiser</a></p>`,
    });

    console.log('✅ Email envoyé avec succès');

    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé'
    });

  } catch (error) {
    console.error('❌ Erreur complète:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la réinitialisation'
    });
  }
}

static async confirmResetPassword(req: Request, res: Response) {
  try {
    console.log('🔄 Début confirmResetPassword');
    const { token, newPassword } = req.body;
    console.log('🔑 Token reçu:', token);

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token et nouveau mot de passe requis'
      });
    }

    // Importer Op si pas déjà fait
    const { Op } = require('sequelize');

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    
    await user.update({
      password: newPassword,
      resetPasswordToken: undefined,
      resetPasswordExpiry: undefined
    });

    console.log('✅ Mot de passe modifié avec succès');

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur confirm reset:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}
static async changePassword(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id; // Depuis le middleware auth

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
  return sendLocalizedResponse(
    res,
    'msg.incorrect_current_password',
    null,
    400,
    user
  );
    }

    // Mettre à jour avec le nouveau mot de passe (le hook User s'occupe du hashage)
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur change password:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}
static async checkAccountDeletion(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    // Vérification que userId existe
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // 1. Vérifier les transactions actives
    const activeTransactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { travelerId: userId }
        ],
        status: {
          [Op.in]: ['payment_pending', 'payment_escrowed', 'package_picked_up']
        }
      }
    });

    // 2. Vérifier le solde wallet (hybride)
    let walletBalance = 0;
    
    try {
      const balanceDetails = await WalletService.getDetailedWalletBalance(userId);
      walletBalance = balanceDetails.totalBalance;
    } catch (walletError) {
      console.log('Erreur vérification wallet:', walletError);
      walletBalance = await WalletService.getWalletBalance(userId);
    }

    // 3. Empêcher suppression si solde non nul
    if (walletBalance > 0) {
      return res.json({
        success: false,
        canDelete: false,
        reason: 'non_zero_balance',
        walletBalance: walletBalance,
        paymentMethod: user.paymentMethod,
        message: `Wallet non vide: ${walletBalance}€`
      });
    }

    // 4. Vérifier les transactions actives
    if (activeTransactions.length > 0) {
      return res.json({
        success: false,
        canDelete: false,
        reason: 'active_transactions',
        activeTransactions: activeTransactions.length,
        message: 'Vous avez des transactions en cours'
      });
    }

    res.json({
      success: true,
      canDelete: true,
      message: 'Compte peut être supprimé'
    });

  } catch (error) {
    console.error('Erreur vérification suppression:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
}
    


static async deleteAccount(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    console.log('=== DEBUT SUPPRESSION COMPTE ===');
    console.log('User ID:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      });
    }

    const user = await User.findByPk(userId);
    console.log('Utilisateur trouvé:', !!user);
    console.log('Payment method:', user?.paymentMethod);
    console.log('Stripe Connected Account:', user?.stripeConnectedAccountId);
    console.log('Stripe Customer ID:', user?.stripeCustomerId);
    console.log('Stripe Identity Session:', user?.stripeIdentitySessionId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérification finale des transactions actives
    console.log('Vérification transactions actives...');
    const activeTransactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { travelerId: userId }
        ],
        status: {
          [Op.in]: ['payment_pending', 'payment_escrowed', 'package_picked_up']
        }
      }
    });
    console.log('Transactions actives trouvées:', activeTransactions.length);

    if (activeTransactions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer: transactions en cours'
      });
    }

    // NOUVELLE SECTION : Expurgation centralisée via RedactionJob (Option 1)
    console.log('Expurgation centralisée Stripe...');
    try {
      const objectsToRedact: any = {};
      
      // Ajouter Customer pour expurgation
      if (user.stripeCustomerId) {
        objectsToRedact.customers = [user.stripeCustomerId];
        console.log('Customer ajouté pour expurgation:', user.stripeCustomerId);
      }
      
      // Ajouter Identity VerificationSession pour expurgation
      if (user.stripeIdentitySessionId) {
        try {
          const session = await stripe.identity.verificationSessions.retrieve(user.stripeIdentitySessionId);
          console.log('Statut Identity session:', session.status);
          
          if (session.status === 'verified') {
            objectsToRedact.identity_verification_sessions = [user.stripeIdentitySessionId];
            console.log('Identity session vérifiée ajoutée pour expurgation');
          } else if (session.status === 'requires_input') {
            await stripe.identity.verificationSessions.cancel(user.stripeIdentitySessionId);
            console.log('Identity session non vérifiée annulée');
          }
        } catch (sessionError: any) {
          console.log('Erreur vérification statut Identity:', sessionError.message);
        }
      }

      // Créer le RedactionJob avec accès direct (Option 1)
      if (Object.keys(objectsToRedact).length > 0) {
        const redactionJob = await (stripe as any).redactionJobs.create({
          objects: objectsToRedact
        });
        console.log('RedactionJob créé:', redactionJob.id);
        console.log('Statut expurgation:', redactionJob.status);
      } else {
        console.log('Aucun objet à expurger via RedactionJob');
      }

    } catch (redactionError: any) {
      console.log('Erreur RedactionJob (fallback sur méthodes individuelles):', redactionError.message);
      
      // Fallback : méthodes individuelles
      console.log('Utilisation méthodes de suppression individuelles...');
      
      // Gestion Identity individuelle
      if (user.stripeIdentitySessionId) {
        try {
          const session = await stripe.identity.verificationSessions.retrieve(user.stripeIdentitySessionId);
          if (session.status === 'verified') {
            await stripe.identity.verificationSessions.redact(user.stripeIdentitySessionId);
            console.log('Identity session expurgée (fallback)');
          } else if (session.status === 'requires_input') {
            await stripe.identity.verificationSessions.cancel(user.stripeIdentitySessionId);
            console.log('Identity session annulée (fallback)');
          }
        } catch (identityError: any) {
          console.log('Erreur Identity fallback:', identityError.message);
        }
      }
      
      // Suppression Customer individuelle
      if (user.stripeCustomerId) {
        try {
          await stripe.customers.del(user.stripeCustomerId);
          console.log('Customer supprimé (fallback)');
        } catch (customerError: any) {
          console.log('Erreur suppression Customer fallback:', customerError.message);
        }
      }
    }

    // Suppression Stripe Connect (hybride EU/DZ)
    console.log('Gestion Stripe Connect (système hybride)...');
    if (user.paymentMethod === 'stripe_connect' && user.stripeConnectedAccountId) {
      try {
        // Vérifier d'abord le solde avant suppression
        const balance = await stripe.balance.retrieve({
          stripeAccount: user.stripeConnectedAccountId
        });
        
        const totalAvailable = balance.available.reduce((sum, currency) => sum + currency.amount, 0);
        const totalPending = balance.pending.reduce((sum, currency) => sum + currency.amount, 0);
        
        console.log(`Solde Connect avant suppression: ${totalAvailable/100}€ disponible, ${totalPending/100}€ en attente`);
        
        await stripe.accounts.del(user.stripeConnectedAccountId);
        console.log('Compte Stripe Connect supprimé (utilisateur EU)');
      } catch (stripeError: any) {
        console.log('Erreur suppression Stripe Connect:', stripeError.message);
      }
    } else {
      console.log('Utilisateur DZ - wallet virtuel, pas de Stripe Connect à supprimer');
    }

    // Suppression des données application
    console.log('Suppression des données application...');
    
    // 1. Messages de chat
    console.log('Suppression messages...');
    await ChatMessage.destroy({
      where: { senderId: userId }
    });

    // 2. Conversations de chat
    console.log('Suppression conversations...');
    await ChatConversation.destroy({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    // 3. Voyages créés
    console.log('Suppression voyages...');
    await Trip.destroy({
      where: { travelerId: userId }
    });

    // 4. Transactions (toutes)
    console.log('Suppression transactions...');
    await Transaction.destroy({
      where: {
        [Op.or]: [
          { senderId: userId },
          { travelerId: userId }
        ]
      }
    });

    // 5. Wallet virtuel (pour utilisateurs DZ)
    console.log('Suppression wallet...');
    try {
      await Wallet.destroy({
        where: { userId: userId }
      });
      console.log('Wallet virtuel supprimé');
    } catch (walletError: any) {
      console.log('Erreur suppression wallet (non bloquant):', walletError.message);
    }

    // 6. Utilisateur (en dernier)
    console.log('Suppression utilisateur...');
    await User.destroy({
      where: { id: userId }
    });

    console.log('=== SUPPRESSION RÉUSSIE ===');
    console.log('Compte utilisateur supprimé complètement (app + Stripe)');

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });

  } catch (error: any) {
    console.error('=== ERREUR SUPPRESSION ===');
    console.error('Erreur complète:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
}
}



