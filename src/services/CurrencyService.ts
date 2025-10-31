//src/services/CurrencyService - VERSION SIMPLIFIÉE (EUR uniquement)
import { Transaction } from '../models';

interface ExchangeRates {
  [key: string]: number;
}

export class CurrencyService {
  // SIMPLIFIÉ : Plus besoin de l'API ni du cache
  private static readonly BASE_CURRENCY = 'EUR';

  // Garde la méthode pour ne pas casser le code existant
  static async getExchangeRates(): Promise<ExchangeRates> {
    // Retourne juste EUR maintenant
    return { EUR: 1 };
  }

  // SIMPLIFIÉ : Ne convertit plus, retourne toujours en EUR
  static async convertTransactions(transactions: Transaction[], targetCurrency: string): Promise<any[]> {
    // Ignore targetCurrency - toujours EUR maintenant
    return transactions.map(tx => ({
      ...tx.toJSON(),
      displayCurrency: 'EUR',
      currencySymbol: '€'
    }));
  }

  // SIMPLIFIÉ : Ne convertit plus
  static convertPrice(amount: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates): number {
    // Pas de conversion - retourne le montant tel quel (déjà en EUR)
    return amount;
  }

  // SIMPLIFIÉ : Toujours le symbole EUR
  static getCurrencySymbol(currency: string): string {
    return '€';
  }

  // SIMPLIFIÉ : Seulement EUR maintenant
  static getSupportedCurrencies(): Array<{code: string, name: string, symbol: string}> {
    return [
      { code: 'EUR', name: 'Euro', symbol: '€' }
    ];
  }

  // SIMPLIFIÉ : Plus besoin de forcer la mise à jour
  static async forceUpdateRates(): Promise<ExchangeRates> {
    return { EUR: 1 };
  }
}