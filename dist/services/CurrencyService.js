"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
class CurrencyService {
    // Garde la méthode pour ne pas casser le code existant
    static async getExchangeRates() {
        // Retourne juste EUR maintenant
        return { EUR: 1 };
    }
    // SIMPLIFIÉ : Ne convertit plus, retourne toujours en EUR
    static async convertTransactions(transactions, targetCurrency) {
        // Ignore targetCurrency - toujours EUR maintenant
        return transactions.map(tx => ({
            ...tx.toJSON(),
            displayCurrency: 'EUR',
            currencySymbol: '€'
        }));
    }
    // SIMPLIFIÉ : Ne convertit plus
    static convertPrice(amount, fromCurrency, toCurrency, rates) {
        // Pas de conversion - retourne le montant tel quel (déjà en EUR)
        return amount;
    }
    // SIMPLIFIÉ : Toujours le symbole EUR
    static getCurrencySymbol(currency) {
        return '€';
    }
    // SIMPLIFIÉ : Seulement EUR maintenant
    static getSupportedCurrencies() {
        return [
            { code: 'EUR', name: 'Euro', symbol: '€' }
        ];
    }
    // SIMPLIFIÉ : Plus besoin de forcer la mise à jour
    static async forceUpdateRates() {
        return { EUR: 1 };
    }
}
exports.CurrencyService = CurrencyService;
// SIMPLIFIÉ : Plus besoin de l'API ni du cache
CurrencyService.BASE_CURRENCY = 'EUR';
