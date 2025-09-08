// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

export const validateExtendedRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName, phone, country, acceptCokiloTerms } = req.body;

  // Validation de base obligatoire pour tous
  if (!email || !password || !firstName || !lastName || !phone) {
    return res.status(400).json({
      success: false,
      error: 'Email, mot de passe, prénom, nom et téléphone sont obligatoires'
    });
  }

  if (!acceptCokiloTerms) {
    return res.status(400).json({
      success: false,
      error: 'Vous devez accepter les conditions générales de CoKilo'
    });
  }

  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Format d\'email invalide'
    });
  }

  // Validation mot de passe
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Le mot de passe doit contenir au moins 8 caractères'
    });
  }

  // Si pays fourni, validation étendue pour pays européens
  if (country) {
    const euCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'LU', 'FI', 'IE', 'GR'];
    
    if (euCountries.includes(country)) {
      const { dateOfBirth, addressLine1, addressCity, addressPostalCode, acceptStripeTerms } = req.body;
      
      if (!dateOfBirth || !addressLine1 || !addressCity || !addressPostalCode) {
        return res.status(400).json({
          success: false,
          error: 'Pour les utilisateurs européens : adresse complète et date de naissance obligatoires'
        });
      }

      if (!acceptStripeTerms) {
        return res.status(400).json({
          success: false,
          error: 'Vous devez accepter les conditions de service Stripe pour recevoir vos paiements automatiques'
        });
      }

      // Validation date de naissance
      const birthDate = new Date(dateOfBirth);
      const age = (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 18) {
        return res.status(400).json({
          success: false,
          error: 'Vous devez être majeur pour utiliser nos services'
        });
      }

      // Validation code postal français (exemple)
      if (country === 'FR' && !/^\d{5}$/.test(addressPostalCode)) {
        return res.status(400).json({
          success: false,
          error: 'Code postal français invalide (5 chiffres requis)'
        });
      }
    }
  }

  next();
};