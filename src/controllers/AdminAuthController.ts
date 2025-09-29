import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';

export class AdminAuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const admin = await Admin.findOne({ where: { email } });
      
      if (!admin) {
        return res.status(401).json({ 
          success: false, 
          error: 'Email ou mot de passe incorrect' 
        });
      }

      if (!admin.isActive) {
        return res.status(403).json({ 
          success: false, 
          error: 'Compte désactivé' 
        });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Email ou mot de passe incorrect' 
        });
      }

      // Mettre à jour lastLoginAt
      await admin.update({ lastLoginAt: new Date() });

      // Générer le token
      const token = jwt.sign(
        { adminId: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error('Erreur login admin:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const admin = (req as any).admin;
      
      res.json({
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error('Erreur profil admin:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
}