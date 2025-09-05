import axios from 'axios';
import { Transaction } from '../models';

interface ExchangeRates {
  [key: string]: number;
}

export class CurrencyService {
  private static readonly BASE_CURRENCY = 'EUR';
  private static readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/EUR';
  private static cachedRates: ExchangeRates | null = null;
  private static lastUpdate: number = 0;
  private static readonly CACHE_DURATION = 3600000; // 1 heure en ms

  static async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    if (this.cachedRates && (now - this.lastUpdate) < this.CACHE_DURATION) {
      return this.cachedRates;
    }

    try {
      const response = await axios.get(this.API_URL, { timeout: 5000 });
      
      if (response.data && response.data.rates) {
        this.cachedRates = response.data.rates;
        this.lastUpdate = now;
        
        console.log('Taux de change mis à jour:', Object.keys(this.cachedRates || {}).length, 'devises');
        return this.cachedRates!;
      } else {
        throw new Error('Format de réponse API invalide');
      }
    } catch (error) {
      console.error('Erreur récupération taux de change:', error);
      
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
      
      this.cachedRates = fallbackRates;
      this.lastUpdate = now;
      
      return fallbackRates;
    }
  }

  // MÉTHODE CONVERTRANSACTIONS COMPLÈTE
  static async convertTransactions(transactions: Transaction[], targetCurrency: string): Promise<any[]> {
    if (!targetCurrency || targetCurrency === 'EUR') {
      return transactions.map(tx => ({
        ...tx.toJSON(),
        displayCurrency: 'EUR',
        currencySymbol: '€'
      }));
    }

    try {
      const rates = await this.getExchangeRates();
      const rate = rates[targetCurrency];
      
      if (!rate) {
        console.error(`Pas de taux pour ${targetCurrency}`);
        return transactions.map(tx => tx.toJSON());
      }

      console.log(`Taux de change récupérés: ${Object.keys(rates).length} devises`);

      return transactions.map(transaction => {
        const txData = transaction.toJSON();
        const originalAmount = parseFloat(String(txData.amount));
        const convertedAmount = parseFloat((originalAmount * rate).toFixed(2));
        
        console.log(`Transaction ${txData.id}: ${originalAmount} EUR -> ${convertedAmount} ${targetCurrency}`);
        
        return {
          ...txData,
          amount: convertedAmount,
          originalAmount: originalAmount,
          displayCurrency: targetCurrency,
          currencySymbol: this.getCurrencySymbol(targetCurrency)
        };
      });
    } catch (error) {
      console.error('Erreur conversion transactions:', error);
      return transactions.map(tx => tx.toJSON());
    }
  }

  static convertPrice(amount: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates): number {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency !== 'EUR' && !rates[fromCurrency]) {
      console.warn(`Devise source ${fromCurrency} non trouvée, pas de conversion`);
      return amount;
    }
    
    if (toCurrency !== 'EUR' && !rates[toCurrency]) {
      console.warn(`Devise cible ${toCurrency} non trouvée, pas de conversion`);
      return amount;
    }
    
    try {
      const euroAmount = fromCurrency === 'EUR' ? amount : amount / rates[fromCurrency];
      const convertedAmount = toCurrency === 'EUR' ? euroAmount : euroAmount * rates[toCurrency];
      
      return Math.round(convertedAmount * 100) / 100;
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      return amount;
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

  static async forceUpdateRates(): Promise<ExchangeRates> {
    this.cachedRates = null;
    this.lastUpdate = 0;
    return await this.getExchangeRates();
  }
}