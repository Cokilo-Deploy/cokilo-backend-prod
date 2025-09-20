// 1. CORRIGER src/services/TranslationService.ts - Supprimer les doublons
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

  public t(key: keyof AppTranslations, user?: User, fallback?: string): string {
    let locale = this.defaultLocale;

    if (user?.language) {
      locale = user.language;
    }

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
      const defaultTranslation = translation[this.defaultLocale as keyof TranslationKey];
      return defaultTranslation || fallback || String(key);
    }

    return translatedText;
  }

  public getLocaleForContext(user?: User, acceptLanguage?: string): string {
  // Priorité 1: Si l'utilisateur a défini une langue manuellement
  if (user?.language && this.isValidLocale(user.language)) {
    return user.language;
  }
  
  // Priorité 2: Détecter depuis Accept-Language header
  if (acceptLanguage) {
    const detected = this.detectLanguageFromHeader(acceptLanguage);
    return detected;
  }
  
  // Priorité 3: Langue par défaut
  return this.defaultLocale;
}

private detectLanguageFromHeader(acceptLanguage: string): string {
  const languages = acceptLanguage.toLowerCase().split(',');
  
  for (const lang of languages) {
    const code = lang.trim().split(';')[0].split('-')[0];
    if (this.supportedLocales.includes(code)) {
      return code;
    }
  }
  
  return this.defaultLocale;
}

  public translateTransactionStatus(status: string, user?: User): string {
    const key = `transaction.status.${status}` as keyof AppTranslations;
    return this.t(key, user, status);
  }

  public translatePackageType(packageType: string, user?: User): string {
    const key = `package.type.${packageType}` as keyof AppTranslations;
    return this.t(key, user, packageType);
  }

  public translateTransportMode(transportMode: string, user?: User, acceptLanguage?: string): string {
  const locale = this.getLocaleForContext(user, acceptLanguage);
  const key = `transport.${transportMode}` as keyof AppTranslations;
  const translation = this.translations[key];
  
  if (!translation) return transportMode;
  
  return translation[locale as keyof TranslationKey] || 
         translation[this.defaultLocale as keyof TranslationKey] || 
         transportMode;
}


  public translateTripStatus(status: string, user?: User, acceptLanguage?: string): string {
  const locale = this.getLocaleForContext(user, acceptLanguage);
  const key = `trip.status.${status}` as keyof AppTranslations;
  const translation = this.translations[key];
  
  if (!translation) return status;
  
  return translation[locale as keyof TranslationKey] || 
         translation[this.defaultLocale as keyof TranslationKey] || 
         status;
}

  public formatTransactionForAPI(transaction: any, user?: User): any {
    const locale = this.getLocaleForContext(user);
    
    return {
      ...transaction,
      statusTranslated: this.translateTransactionStatus(transaction.status, user),
      packageTypeTranslated: this.translatePackageType(transaction.packageType, user),
      locale
    };
  }

  public formatTripForAPI(trip: any, user?: User, acceptLanguage?:string): any {
    const locale = this.getLocaleForContext(user);
    
    return {
      ...trip,
      statusTranslated: this.translateTripStatus(trip.status, user, acceptLanguage),
      transportModeTranslated: this.translateTransportMode(trip.transportMode, user, acceptLanguage),
      locale
    };
  }

  public isValidLocale(locale: string): boolean {
    return this.supportedLocales.includes(locale);
  }

  public getAllTranslations(user?: User): Record<string, string> {
    const locale = this.getLocaleForContext(user);
    const result: Record<string, string> = {};
    
    Object.entries(this.translations).forEach(([key, translationObj]) => {
      result[key] = translationObj[locale as keyof TranslationKey] || 
                   translationObj[this.defaultLocale as keyof TranslationKey] || 
                   key;
    });

    return result;
  }

  public getSupportedLocales(): string[] {
    return [...this.supportedLocales];
  }

  public getDefaultLocale(): string {
    return this.defaultLocale;
  }
}

// Instance singleton - UNE SEULE FOIS
export const translationService = TranslationService.getInstance();


