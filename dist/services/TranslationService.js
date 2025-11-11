"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationService = exports.TranslationService = void 0;
// 1. CORRIGER src/services/TranslationService.ts
const translations_1 = require("../config/translations");
class TranslationService {
    constructor() {
        this.supportedLocales = ['fr', 'en', 'de', 'es', 'it'];
        this.defaultLocale = 'fr';
        this.translations = translations_1.translations;
    }
    static getInstance() {
        if (!TranslationService.instance) {
            TranslationService.instance = new TranslationService();
        }
        return TranslationService.instance;
    }
    t(key, user, fallback) {
        const locale = this.getLocaleForContext(user);
        const translation = this.translations[key];
        if (!translation) {
            console.warn(`Translation key not found: ${String(key)}`);
            return fallback || String(key);
        }
        const translatedText = translation[locale];
        if (!translatedText) {
            const defaultTranslation = translation[this.defaultLocale];
            return defaultTranslation || fallback || String(key);
        }
        return translatedText;
    }
    getLocaleForContext(user) {
        console.log('=== GET LOCALE FOR CONTEXT ===');
        console.log('user?.language:', user?.language);
        // Priorité 1: Si l'utilisateur a défini une langue manuellement
        if (user?.language && this.isValidLocale(user.language)) {
            console.log('Using user language:', user.language);
            return user.language;
        }
        console.log('Using default locale:', this.defaultLocale);
        return this.defaultLocale;
    }
    translateTransactionStatus(status, user) {
        const locale = this.getLocaleForContext(user);
        const key = `transaction.status.${status}`;
        const translation = this.translations[key];
        if (!translation)
            return status;
        return translation[locale] ||
            translation[this.defaultLocale] ||
            status;
    }
    translatePackageType(packageType, user) {
        const locale = this.getLocaleForContext(user);
        const key = `package.type.${packageType}`;
        const translation = this.translations[key];
        if (!translation)
            return packageType;
        return translation[locale] ||
            translation[this.defaultLocale] ||
            packageType;
    }
    translateTransportMode(transportMode, user) {
        const locale = this.getLocaleForContext(user);
        const key = `transport.${transportMode}`;
        const translation = this.translations[key];
        if (!translation)
            return transportMode;
        return translation[locale] ||
            translation[this.defaultLocale] ||
            transportMode;
    }
    translateTripStatus(status, user) {
        const locale = this.getLocaleForContext(user);
        const key = `trip.status.${status}`;
        const translation = this.translations[key];
        if (!translation)
            return status;
        return translation[locale] ||
            translation[this.defaultLocale] ||
            status;
    }
    formatTransactionForAPI(transaction, user) {
        const locale = this.getLocaleForContext(user);
        return {
            ...transaction,
            statusTranslated: this.translateTransactionStatus(transaction.status, user),
            packageTypeTranslated: this.translatePackageType(transaction.packageType, user),
            locale
        };
    }
    formatTripForAPI(trip, user) {
        const locale = this.getLocaleForContext(user);
        return {
            ...trip,
            statusTranslated: this.translateTripStatus(trip.status, user),
            transportModeTranslated: this.translateTransportMode(trip.transportMode, user),
            locale
        };
    }
    isValidLocale(locale) {
        return this.supportedLocales.includes(locale);
    }
    getAllTranslations(user) {
        const locale = this.getLocaleForContext(user);
        const result = {};
        Object.entries(this.translations).forEach(([key, translationObj]) => {
            result[key] = translationObj[locale] ||
                translationObj[this.defaultLocale] ||
                key;
        });
        return result;
    }
    getSupportedLocales() {
        return [...this.supportedLocales];
    }
    getDefaultLocale() {
        return this.defaultLocale;
    }
}
exports.TranslationService = TranslationService;
// Instance singleton - UNE SEULE FOIS
exports.translationService = TranslationService.getInstance();
