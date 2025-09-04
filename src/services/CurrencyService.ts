import axios from 'axios';
import { Transaction } from '../models';

interface ExchangeRates {
  [key: string]: number;
}

export class CurrencyService {
  static convertTransactions(uniqueTransactions: Transaction[], userCurrency: any): any {
    throw new Error('Method not implemented.');
  }
  private static readonly BASE_CURRENCY = 'EUR';
  private static readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/EUR'; // API gratuite
  private static cachedRates: ExchangeRates | null = null;
  private static lastUpdate: number = 0;
  private static readonly CACHE_DURATION = 3600000; // 1 heure en ms

  static async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    // Utiliser cache si valide
    if (this.cachedRates && (now - this.lastUpdate) < this.CACHE_DURATION) {
      return this.cachedRates;
    }

    try {
      const response = await axios.get(this.API_URL, { timeout: 5000 });
      
      // Vérifier que la réponse contient les taux
      if (response.data && response.data.rates) {
        this.cachedRates = response.data.rates;
        this.lastUpdate = now;
        
        console.log('Taux de change mis à jour:', Object.keys(this.cachedRates || {}).length, 'devises');
        return this.cachedRates!; // Assertion que cachedRates n'est pas null
      } else {
        throw new Error('Format de réponse API invalide');
      }
    } catch (error) {
      console.error('Erreur récupération taux de change:', error);
      
      // Fallback avec taux statiques si API échoue
      if (this.cachedRates) {
        console.log('Utilisation du cache existant');
        return this.cachedRates;
      }
      
      console.log('Utilisation des taux de fallback');
      const fallbackRates: ExchangeRates = {
        EUR: 1,
        USD: 1.1,
        DZD: 150,
        MAD: 11,
        TND: 3.1,
        GBP: 0.85,
        CAD: 1.45,
        CHF: 0.95,
        EGP: 31.5,
        SAR: 4.1,
        AED: 4.0
      };
      
      // Mettre en cache les taux de fallback
      this.cachedRates = fallbackRates;
      this.lastUpdate = now;
      
      return fallbackRates;
    }
  }

  static convertPrice(amount: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates): number {
    if (fromCurrency === toCurrency) return amount;
    
    // Vérifier que les devises existent dans les taux
    if (fromCurrency !== 'EUR' && !rates[fromCurrency]) {
      console.warn(`Devise source ${fromCurrency} non trouvée, pas de conversion`);
      return amount;
    }
    
    if (toCurrency !== 'EUR' && !rates[toCurrency]) {
      console.warn(`Devise cible ${toCurrency} non trouvée, pas de conversion`);
      return amount;
    }
    
    try {
      // Tout convertir via EUR comme base
      const euroAmount = fromCurrency === 'EUR' ? amount : amount / rates[fromCurrency];
      const convertedAmount = toCurrency === 'EUR' ? euroAmount : euroAmount * rates[toCurrency];
      
      // Arrondir à 2 décimales
      return Math.round(convertedAmount * 100) / 100;
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      return amount; // Retourner le montant original en cas d'erreur
    }
  }

  static getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      EUR: '€',
      USD: '$',
      DZD: 'د.ج',
      MAD: 'د.م',
      TND: 'د.ت',
      GBP: '£',
      CAD: 'C$',
      CHF: 'CHF',
      EGP: 'ج.م',
      SAR: 'ر.س',
      AED: 'د.إ'
    };
    return symbols[currency] || currency;
  }

  // Méthode utilitaire pour obtenir la liste des devises supportées
  static getSupportedCurrencies(): Array<{code: string, name: string, symbol: string}> {
    return [
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'USD', name: 'Dollar US', symbol: '$' },
      { code: 'DZD', name: 'Dinar Algérien', symbol: 'د.ج' },
      { code: 'MAD', name: 'Dirham Marocain', symbol: 'د.م' },
      { code: 'TND', name: 'Dinar Tunisien', symbol: 'د.ت' },
      { code: 'GBP', name: 'Livre Sterling', symbol: '£' },
      { code: 'CAD', name: 'Dollar Canadien', symbol: 'C$' },
      { code: 'CHF', name: 'Franc Suisse', symbol: 'CHF' },
      { code: 'EGP', name: 'Livre Égyptienne', symbol: 'ج.م' },
      { code: 'SAR', name: 'Riyal Saoudien', symbol: 'ر.س' },
      { code: 'AED', name: 'Dirham des EAU', symbol: 'د.إ' }
    ];
  }

  // Méthode pour forcer la mise à jour du cache
  static async forceUpdateRates(): Promise<ExchangeRates> {
    this.cachedRates = null;
    this.lastUpdate = 0;
    return await this.getExchangeRates();
  }
}