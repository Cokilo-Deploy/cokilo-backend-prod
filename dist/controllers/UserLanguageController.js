"use strict";
// 1. Créer src/controllers/UserLanguageController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLanguageController = void 0;
const TranslationService_1 = require("../services/TranslationService");
const responseHelpers_1 = require("../utils/responseHelpers");
class UserLanguageController {
    /**
     * GET /api/user/language - Récupère la langue actuelle de l'utilisateur
     */
    static async getCurrentLanguage(req, res) {
        try {
            const user = req.user;
            return res.json({
                success: true,
                data: {
                    currentLanguage: user.language || TranslationService_1.translationService.getDefaultLocale(),
                    supportedLanguages: TranslationService_1.translationService.getSupportedLocales(),
                    defaultLanguage: TranslationService_1.translationService.getDefaultLocale()
                },
                locale: user.language || TranslationService_1.translationService.getDefaultLocale()
            });
        }
        catch (error) {
            console.error('Erreur récupération langue:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user, req);
        }
    }
    /**
     * PUT /api/user/language - Change la langue de l'utilisateur
     */
    static async updateLanguage(req, res) {
        try {
            const user = req.user;
            const { language } = req.body;
            // Validation de la langue
            if (!language) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.missing_required_fields', { field: 'language' }, 400, user, req);
            }
            if (!TranslationService_1.translationService.isValidLocale(language)) {
                return res.status(400).json({
                    success: false,
                    message: TranslationService_1.translationService.t('msg.invalid_locale', user),
                    data: {
                        supportedLanguages: TranslationService_1.translationService.getSupportedLocales(),
                        providedLanguage: language
                    },
                    locale: user.language || TranslationService_1.translationService.getDefaultLocale()
                });
            }
            // Mise à jour en base de données
            await user.update({ language });
            console.log(`Langue utilisateur ${user.id} mise à jour: ${user.language} -> ${language}`);
            return res.json({
                success: true,
                message: TranslationService_1.translationService.t('msg.language_updated', { ...user, language }, 'Language updated successfully'),
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
        }
        catch (error) {
            console.error('Erreur mise à jour langue:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.server_error', null, 500, req.user, req);
        }
    }
    /**
     * GET /api/user/languages/supported - Liste des langues supportées
     */
    static async getSupportedLanguages(req, res) {
        try {
            const user = req.user;
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
                    currentLanguage: user?.language || TranslationService_1.translationService.getDefaultLocale(),
                    defaultLanguage: TranslationService_1.translationService.getDefaultLocale()
                },
                locale: user?.language || TranslationService_1.translationService.getDefaultLocale()
            });
        }
        catch (error) {
            console.error('Erreur récupération langues supportées:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur serveur'
            });
        }
    }
}
exports.UserLanguageController = UserLanguageController;
