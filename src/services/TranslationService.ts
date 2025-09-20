// src/services/TranslationService.ts - Version corrigée
import { translations } from '../config/translations';
import { AppTranslations, TranslationKey } from '../types/translations';
import { User } from '../models/User';

export class TranslationService {
  private static instance: TranslationService;
  private translations: AppTranslations;
  private supportedLocales: string[] = ['fr', 'en', 'de', 'es', 'it'];
  private defaultLocale: string = 'fr';

  constructor() {
    this.translations = translations;
  }

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Traduit une clé en utilisant la langue de l'utilisateur connecté
   * OU la langue détectée par IP pour les invités
   */
  public t(key: keyof AppTranslations, user?: User, guestCountry?: string, fallback?: string): string {
    let locale = this.defaultLocale;

    // 1. Si utilisateur connecté : utiliser SA langue
    if (user?.language) {
      locale = user.language;
    } 
    // 2. Si invité : mapper le pays vers une langue
    else if (guestCountry) {
      locale = this.mapCountryToLanguage(guestCountry);
    }

    // Valider la locale
    if (!this.isValidLocale(locale)) {
      locale = this.defaultLocale;
    }

    const translation = this.translations[key];
    if (!translation) {
      console.warn(`Translation key not found: ${String(key)}`);
      return fallback || String(key);
    }

    const translatedText = translation[locale as keyof TranslationKey];
    if (!translatedText) {
      // Fallback vers la langue par défaut
      const defaultTranslation = translation[this.defaultLocale as keyof TranslationKey];
      return defaultTranslation || fallback || String(key);
    }

    return translatedText;
  }

  /**
   * Mappe un code pays vers une langue supportée
   * Utilise la logique de ton système de détection IP
   */
  private mapCountryToLanguage(country: string): string {
    const countryToLanguageMap: { [key: string]: string } = {
      // Français
      'FR': 'fr',
      'DZ': 'fr', // Algérie
      'MA': 'fr', // Maroc
      'TN': 'fr', // Tunisie
      'BE': 'fr', // Belgique (peut être fr ou nl)
      'CH': 'fr', // Suisse (peut être fr, de, it)
      'CA': 'fr', // Canada (peut être fr ou en)
      
      // Anglais
      'GB': 'en',
      'US': 'en',
      'AU': 'en',
      'IE': 'en',
      'NZ': 'en',
      'ZA': 'en',
      
      // Allemand
      'DE': 'de',
      'AT': 'de',
      'LU': 'de', // Luxembourg (peut être fr, de)
      
      // Espagnol
      'ES': 'es',
      'MX': 'es',
      'AR': 'es',
      'CO': 'es',
      'VE': 'es',
      'PE': 'es',
      'CL': 'es',
      
      // Italien
      'IT': 'it',
      'SM': 'it', // San Marino
      'VA': 'it'  // Vatican
    };

    return countryToLanguageMap[country] || this.defaultLocale;
  }

  /**
   * Récupère la locale appropriée selon le contexte
   */
  public getLocaleForContext(user?: User, guestCountry?: string): string {
    if (user?.language) {
      return user.language;
    }
    
    if (guestCountry) {
      return this.mapCountryToLanguage(guestCountry);
    }
    
    return this.defaultLocale;
  }

  /**
   * Traduit un statut de transaction
   */
  public translateTransactionStatus(status: string, user?: User, guestCountry?: string): string {
    const key = `transaction.status.${status}` as keyof AppTranslations;
    return this.t(key, user, guestCountry, status);
  }

  /**
   * Traduit un type de package
   */
  public translatePackageType(packageType: string, user?: User, guestCountry?: string): string {
    const key = `package.type.${packageType}` as keyof AppTranslations;
    return this.t(key, user, guestCountry, packageType);
  }

  /**
   * Traduit un mode de transport
   */
  public translateTransportMode(transportMode: string, user?: User, guestCountry?: string): string {
    const key = `transport.${transportMode}` as keyof AppTranslations;
    return this.t(key, user, guestCountry, transportMode);
  }

  /**
   * Traduit un statut de voyage
   */
  public translateTripStatus(status: string, user?: User, guestCountry?: string): string {
    const key = `trip.status.${status}` as keyof AppTranslations;
    return this.t(key, user, guestCountry, status);
  }

  /**
   * Formate un objet transaction avec traductions
   */
  public formatTransactionForAPI(transaction: any, user?: User, guestCountry?: string): any {
    const locale = this.getLocaleForContext(user, guestCountry);
    
    return {
      ...transaction,
      statusTranslated: this.translateTransactionStatus(transaction.status, user, guestCountry),
      packageTypeTranslated: this.translatePackageType(transaction.packageType, user, guestCountry),
      locale
    };
  }

  /**
   * Formate un objet trip avec traductions
   */
  public formatTripForAPI(trip: any, user?: User, guestCountry?: string): any {
    const locale = this.getLocaleForContext(user, guestCountry);
    
    return {
      ...trip,
      statusTranslated: this.translateTripStatus(trip.status, user, guestCountry),
      transportModeTranslated: this.translateTransportMode(trip.transportMode, user, guestCountry),
      locale
    };
  }

  /**
   * Valide si une locale est supportée
   */
  public isValidLocale(locale: string): boolean {
    return this.supportedLocales.includes(locale);
  }

  /**
   * Retourne toutes les traductions pour une locale
   */
  public getAllTranslations(user?: User, guestCountry?: string): Record<string, string> {
    const locale = this.getLocaleForContext(user, guestCountry);
    const result: Record<string, string> = {};
    
    Object.entries(this.translations).forEach(([key, translationObj]) => {
      result[key] = translationObj[locale as keyof TranslationKey] || 
                   translationObj[this.defaultLocale as keyof TranslationKey] || 
                   key;
    });

    return result;
  }

  /**
   * Retourne les locales supportées
   */
  public getSupportedLocales(): string[] {
    return [...this.supportedLocales];
  }

  /**
   * Retourne la locale par défaut
   */
  public getDefaultLocale(): string {
    return this.defaultLocale;
  }
}

// Instance singleton
export const translationService = TranslationService.getInstance();


