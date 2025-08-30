import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Token d\'authentification requis' 
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Utilisateur non trouvé ou inactif' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Token invalide' 
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, jwtSecret) as any;
      const user = await User.findByPk(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};