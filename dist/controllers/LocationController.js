"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const Country_1 = require("../models/Country");
const Location_1 = require("../models/Location");
const responseHelpers_1 = require("../utils/responseHelpers");
class LocationController {
    /**
     * GET /api/locations/countries
     * Récupérer tous les pays disponibles
     */
    static async getCountries(req, res) {
        try {
            const user = req.user;
            const { lang = user?.language || 'fr' } = req.query;
            const countries = await Country_1.Country.findAll({
                order: [[`name_${lang}`, 'ASC']],
            });
            const formatted = countries.map(c => ({
                value: c.value,
                code: c.code,
                label: {
                    fr: c.nameFr,
                    en: c.nameEn,
                    de: c.nameDe,
                    es: c.nameEs,
                    it: c.nameIt
                },
                phonePrefix: c.phonePrefix,
                currency: c.currency,
                stripeSupported: c.stripeSupported,
                isEurozone: c.isEurozone,
                postalCodeFormat: c.postalCodeFormat
            }));
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.countries_loaded', { countries: formatted }, 200, user);
        }
        catch (error) {
            console.error('Erreur récupération pays:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_data', null, 500, req.user);
        }
    }
    /**
     * GET /api/locations/:countryCode
     * Récupérer toutes les locations d'un pays
     */
    static async getLocationsByCountry(req, res) {
        try {
            const { countryCode } = req.params;
            const user = req.user;
            const { lang = user?.language || 'fr' } = req.query;
            const locations = await Location_1.Location.findAll({
                where: { countryCode: countryCode.toUpperCase() },
                order: [
                    ['population', 'DESC NULLS LAST'],
                    [`name_${lang}`, 'ASC']
                ],
            });
            const formatted = locations.map(loc => ({
                value: loc.value,
                code: loc.code,
                type: loc.type,
                label: {
                    fr: loc.nameFr,
                    en: loc.nameEn,
                    de: loc.nameDe,
                    es: loc.nameEs,
                    it: loc.nameIt
                },
                population: loc.population,
                latitude: loc.latitude,
                longitude: loc.longitude
            }));
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.locations_loaded', { locations: formatted }, 200, user);
        }
        catch (error) {
            console.error('Erreur récupération localisations:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_data', null, 500, req.user);
        }
    }
}
exports.LocationController = LocationController;
