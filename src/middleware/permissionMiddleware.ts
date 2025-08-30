// src/middleware/permissionMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User'; // ✅ User seulement
import { UserVerificationStatus } from '../types/user'; // ✅ Import correct

interface AuthRequest extends Request {
  user: User & { verificationStatus?: UserVerificationStatus; stripeCustomerId?: string };
}

export const requireBasicAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: User not found' });
  }
  next();
};

export const requireVerifiedIdentity = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: User not found' });
  }

  if (req.user.verificationStatus !== UserVerificationStatus.VERIFIED) {
    return res.status(403).json({ message: 'Forbidden: Identity verification required' });
  }

  next();
};

// Middleware pour les actions de paiement
export const requirePaymentCapability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    // Doit être vérifié ET avoir un customer Stripe
    if (
      user.verificationStatus !== UserVerificationStatus.VERIFIED ||
      !user.stripeCustomerId
    ) {
      return res.status(403).json({
        error: "Vérification d'identité et configuration paiement requises",
        code: 'PAYMENT_SETUP_REQUIRED'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur vérification paiement' });
  }
};
