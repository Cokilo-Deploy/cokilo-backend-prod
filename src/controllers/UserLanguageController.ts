// 1. Créer src/controllers/UserLanguageController.ts

import { Request, Response } from 'express';
import { User } from '../models/User';
import { translationService } from '../services/TranslationService';
import { sendLocalizedResponse } from '../utils/responseHelpers';

export class UserLanguageController {
  
  /**
   * GET /api/user/language - Récupère la langue actuelle de l'utilisateur
   */
  static async getCurrentLanguage(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      return res.json({
        success: true,
        data: {
          currentLanguage: user.language || translationService.getDefaultLocale(),
          supportedLanguages: translationService.getSupportedLocales(),
          defaultLanguage: translationService.getDefaultLocale()
        },
        locale: user.language || translationService.getDefaultLocale()
      });
      
    } catch (error) {
      console.error('Erreur récupération langue:', error);
      return sendLocalizedResponse(
        res,
        'msg.server_error',
        null,
        500,
        (req as any).user,
        req
      );
    }
  }

  /**
   * PUT /api/user/language - Change la langue de l'utilisateur
   */
  static async updateLanguage(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { language } = req.body;

      // Validation de la langue
      if (!language) {
        return sendLocalizedResponse(
          res,
          'msg.missing_required_fields',
          { field: 'language' },
          400,
          user,
          req
        );
      }

      if (!translationService.isValidLocale(language)) {
        return res.status(400).json({
          success: false,
          message: translationService.t('msg.invalid_locale', user),
          data: {
            supportedLanguages: translationService.getSupportedLocales(),
            providedLanguage: language
          },
          locale: user.language || translationService.getDefaultLocale()
        });
      }

      // Mise à jour en base de données
      await user.update({ language });
      
      console.log(`Langue utilisateur ${user.id} mise à jour: ${user.language} -> ${language}`);

      return res.json({
        success: true,
        message: translationService.t('msg.language_updated', { ...user, language }, 'Language updated successfully'),
        data: {
          previousLanguage: user.language,
          newLanguage: language,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            language: language
          }
        },
        locale: language
      });

    } catch (error) {
      console.error('Erreur mise à jour langue:', error);
      return sendLocalizedResponse(
        res,
        'msg.server_error',
        null,
        500,
        (req as any).user,
        req
      );
    }
  }

  /**
   * GET /api/user/languages/supported - Liste des langues supportées
   */
  static async getSupportedLanguages(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      const languages = [
        { code: 'fr', name: 'Français', nativeName: 'Français' },
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano' }
      ];

      return res.json({
        success: true,
        data: {
          languages,
          currentLanguage: user?.language || translationService.getDefaultLocale(),
          defaultLanguage: translationService.getDefaultLocale()
        },
        locale: user?.language || translationService.getDefaultLocale()
      });

    } catch (error) {
      console.error('Erreur récupération langues supportées:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
}

