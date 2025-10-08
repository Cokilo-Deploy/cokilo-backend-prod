// src/controllers/UserController.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import { Op } from 'sequelize';
import { Review } from '../models/Review';
import { Transaction, Trip } from '../models';
import { ErrorCode, errorResponse, successResponse } from '../utils/errorCodes';

interface AuthRequest extends Request {
  user?: User;
}

export class UserController {
  // GET /api/users/profile - Profil utilisateur
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse(ErrorCode.UNAUTHORIZED));
      }

      const userAccess = getUserAccessInfo(req.user);

      res.json(successResponse({
        success: true,
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            phone: req.user.phone,
            avatar: req.user.avatar,
            rating: req.user.rating,
            totalTrips: req.user.totalTrips,
            totalDeliveries: req.user.totalDeliveries,
            verificationStatus: req.user.verificationStatus,
            identityVerifiedAt: req.user.identityVerifiedAt,
            memberSince: req.user.createdAt,
          }
        },
        userAccess, // ← Informations de permissions
      }));

    } catch (error) {
      res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
    }
  }

  
  // GET /api/users/dashboard - Tableau de bord personnalisé
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse(ErrorCode.UNAUTHORIZED));
      }

      const userAccess = getUserAccessInfo(req.user);
      
      // Données selon le niveau d'accès
      const dashboardData: any = {
        user: req.user.getPublicProfile(),
        stats: {
          totalTrips: req.user.totalTrips,
          totalDeliveries: req.user.totalDeliveries,
          rating: req.user.rating,
        }
      };

      // Si utilisateur vérifié, ajouter plus de données
      if (userAccess.canCreateTrip) {
        dashboardData.stats.totalEarnings = req.user.totalEarnings;
        dashboardData.quickActions = [
          { type: 'CREATE_TRIP', label: 'Créer un voyage', url: '/api/trips' },
          { type: 'VIEW_TRANSACTIONS', label: 'Mes transactions', url: '/api/transactions' },
        ];
      } else {
        // Utilisateur non vérifié - inciter à la vérification
        dashboardData.onboarding = {
          currentStep: 'IDENTITY_VERIFICATION',
          progress: 30,
          nextAction: {
            type: 'VERIFY_IDENTITY',
            title: 'Vérifiez votre identité',
            description: 'Débloquez toutes les fonctionnalités en vérifiant votre identité',
            cta: 'Commencer la vérification',
            url: '/api/verification/start'
          }
        };
      }

      res.json(successResponse({ ...dashboardData, userAccess }));

    } catch (error) {
      res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
    }
  }

  static async updateProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { profileName } = req.body;

    if (profileName && (profileName.length < 2 || profileName.length > 50)) {
      return res.status(400).json(errorResponse(ErrorCode.PROFILE_NAME_LENGTH));
    }

    // Vérifier si le nom de profil existe déjà (en excluant l'utilisateur actuel)
    if (profileName) {
      const existingUser = await User.findOne({
        where: {
          profileName: profileName.trim(),
          id: { [Op.ne]: user.id } // Exclure l'utilisateur actuel
        }
      });

      if (existingUser) {
        return res.status(400).json(errorResponse(ErrorCode.PROFILE_NAME_ALREADY_USED));
      }
    }

    await user.update({ profileName: profileName ? profileName.trim() : null });

    res.json(successResponse({
      success: true,
      data: { user: { ...user.toJSON(), profileName: profileName ? profileName.trim() : null } },
      message: 'Profil mis à jour'
    }));
  } catch (error: any) {
    // Gérer l'erreur de contrainte unique de la base de données
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json(errorResponse(ErrorCode.PROFILE_NAME_ALREADY_USED));
    }

    console.error('Erreur mise à jour profil:', error);
    res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
  }

}
// Récupérer les infos publiques d'un utilisateur avec sa note
static async getUserInfo(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'profileName', 'rating', 'avatar'], // Ajout avatar
    });
    
    if (!user) {
      return res.status(404).json(errorResponse(ErrorCode.USER_NOT_FOUND));
    }
    
    const reviewCount = await Review.count({
      where: { revieweeId: userId, isPublic: true }
    });
    
    res.json(successResponse({
      success: true,
      data: {
        user: {
          displayName: user.profileName || user.firstName,
          rating: Number(user.rating),
          totalReviews: reviewCount,
          avatar: user.avatar // Ajout
        }
      }
    }));
    
  } catch (error: any) {
    console.error('Erreur récupération infos utilisateur:', error);
    res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
  }
}
// Upload avatar utilisateur
static async uploadAvatar(req: AuthRequest, res: Response) {
  console.log('Upload avatar - User ID:', req.user?.id);
  console.log('Fichier reçu:', req.file ? 'OUI' : 'NON');
  console.log('Détails fichier:', req.file);
  try {
    const user = req.user;
    
    if (!user) {
      console.log('Pas d\'utilisateur authentifié');
      return res.status(401).json(errorResponse(ErrorCode.UNAUTHORIZED));
    }

    if (!req.file) {
        return res.status(400).json(errorResponse(ErrorCode.INVALID_INPUT));
    }

    // URL complète du fichier uploadé
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    console.log('URL avatar générée:', avatarUrl);
    
    // Mettre à jour l'avatar dans la base
    await user.update({ avatar: avatarUrl });
    console.log('Avatar mis à jour en base pour user:', user.id);

    res.json(successResponse({
      success: true,
      data: { 
        avatar: avatarUrl,
        user: {
          ...user.toJSON(),
          avatar: avatarUrl
        }
      },
      message: 'Avatar mis à jour avec succès'
    }));

  } catch (error: any) {
     console.error('Erreur upload avatar:', error);
    res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
  }
}
// Dans controllers/UserController.ts, ajoutez cette méthode
static async getUserStats(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    console.log('DEBUG - User ID reçu:', userId);

    // Test 1: Vérifier si l'utilisateur a des données
    console.log('DEBUG - Test de requête...');
    
    // Remplacez par le vrai nom de votre table de voyages
    const voyagesCreated = await Trip.count({     //models/Trip
      where: { travelerId: userId } // ou createdBy, ownerId, etc.
    });
    console.log('DEBUG - Voyages trouvés:', voyagesCreated);

    // Remplacez par le vrai nom de votre table de transactions  
    const colisEnvoyes = await Transaction.count({     //models/Transaction
      where: { senderId: userId } // ou userId, createdBy, etc.
    });
    console.log('DEBUG - Colis trouvés:', colisEnvoyes);

    // Test 2: Compter toutes les entrées pour voir si les tables ont des données
    const totalVoyages = await Trip.count();
    const totalColis = await Transaction.count();
    console.log('DEBUG - Total voyages dans la DB:', totalVoyages);
    console.log('DEBUG - Total colis dans la DB:', totalColis);

    res.json(successResponse({
      success: true,
      voyagesCreated,
      colisEnvoyes
    }));

  } catch (error) {
    console.error('Erreur complète:', error);
    res.status(500).json(errorResponse(ErrorCode.SERVER_ERROR));
  }
}
}
