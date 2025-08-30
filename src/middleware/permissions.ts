import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';

interface AuthRequest extends Request {
  user?: User;
}

export const requireBasicAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentification requise' 
    });
  }

  if (!req.user.canViewTrips()) {
    return res.status(403).json({ 
      success: false,
      error: 'Accès refusé' 
    });
  }

  next();
};

export const requireVerifiedIdentity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentification requise' 
    });
  }

  if (!req.user.canCreateTrip()) {
    const userAccess = getUserAccessInfo(req.user);
    return res.status(403).json({
      success: false,
      error: 'Vérification d\'identité requise',
      code: 'IDENTITY_VERIFICATION_REQUIRED',
      userAccess,
      action: {
        type: 'VERIFY_IDENTITY',
        message: 'Vérifiez votre identité via Stripe Identity pour accéder à cette fonctionnalité',
        url: '/api/verification/start'
      }
    });
  }

  next();
};