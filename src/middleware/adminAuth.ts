import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Chercher dans la table admins au lieu de users
    const admin = await Admin.findByPk(decoded.adminId || decoded.userId);
    
    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: 'Accès admin requis' });
    }

    (req as any).admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};