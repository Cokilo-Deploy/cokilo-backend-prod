import { Request, Response } from 'express';
import { Country } from '../models/Country';
import { Location } from '../models/Location';
import { sendLocalizedResponse } from '../utils/responseHelpers';

export class LocationController {
  
  /**
   * GET /api/locations/countries
   * Récupérer tous les pays disponibles
   */
  static async getCountries(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { lang = user?.language || 'fr' } = req.query;
      
      const countries = await Country.findAll({
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
      
      return sendLocalizedResponse(
        res,
        'msg.countries_loaded',
        { countries: formatted },
        200,
        user
      );
      
    } catch (error: any) {
      console.error('Erreur récupération pays:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_data',
        null,
        500,
        (req as any).user
      );
    }
  }
  
  /**
   * GET /api/locations/:countryCode
   * Récupérer toutes les locations d'un pays
   */
  static async getLocationsByCountry(req: Request, res: Response) {
    try {
      const { countryCode } = req.params;
      const user = (req as any).user;
      const { lang = user?.language || 'fr' } = req.query;
      
      const locations = await Location.findAll({
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
      
      return sendLocalizedResponse(
        res,
        'msg.locations_loaded',
        { locations: formatted },
        200,
        user
      );
      
    } catch (error: any) {
      console.error('Erreur récupération localisations:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_data',
        null,
        500,
        (req as any).user
      );
    }
  }
}