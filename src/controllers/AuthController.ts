import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import axios from 'axios';

export class AuthController {
  
  // Fonction helper pour détecter la devise par IP
  private static async detectCurrencyFromIP(req: Request): Promise<string> {
    try {
      // Récupérer l'IP du client
      const clientIP = req.ip || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress || 
                      (req.connection as any)?.socket?.remoteAddress ||
                      req.headers['x-forwarded-for'] as string ||
                      req.headers['x-real-ip'] as string ||
                      '127.0.0.1';

      console.log('IP détectée pour devise:', clientIP);

      // Si IP locale, utiliser EUR par défaut
      if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.includes('localhost')) {
        return 'EUR';
      }

      // Appel API de géolocalisation
      const response = await axios.get(`http://ip-api.com/json/${clientIP}?fields=countryCode`, {
        timeout: 3000
      });
      
      const countryCode = response.data.countryCode;
      console.log('Pays détecté:', countryCode);
      
      const countryToCurrency: { [key: string]: string } = {
        'DZ': 'DZD',
        'MA': 'MAD',
        'TN': 'TND',
        'EG': 'EGP',
        'SA': 'SAR',
        'AE': 'AED',
        'US': 'USD',
        'CA': 'CAD',
        'GB': 'GBP',
        'CH': 'CHF'
        // Autres pays -> EUR par défaut
      };
      
      return countryToCurrency[countryCode] || 'EUR';
    } catch (error) {
      console.log('Erreur détection devise, utilisation EUR par défaut:', error);
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