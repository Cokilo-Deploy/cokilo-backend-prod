import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import axios from 'axios';

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
    
    const countryCode = response.data.countryCode;
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

  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email déjà utilisé'
        });
      }

      // NOUVELLE LIGNE - Détecter la devise
      const detectedCurrency = await AuthController.detectCurrencyFromIP(req);
      console.log('Devise détectée pour nouvel utilisateur:', detectedCurrency);

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        currency: detectedCurrency, // NOUVELLE LIGNE
      });

       console.log('UTILISATEUR CREE avec devise:', user.currency); // LOG VERIFICATION

      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

      const userAccess = getUserAccessInfo(user);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            verificationStatus: user.verificationStatus,
            currency: user.currency, // NOUVELLE LIGNE - Renvoyer la devise
          },
          detectedCurrency // NOUVELLE LIGNE - Info pour le client
        },
        userAccess,
        message: 'Compte créé avec succès'
      });

    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'inscription'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect'
        });
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect'
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
            currency: user.currency, // NOUVELLE LIGNE - Inclure la devise
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
            currency: user.currency, // NOUVELLE LIGNE
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
}