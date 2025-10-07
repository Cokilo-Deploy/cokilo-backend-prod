// src/controllers/TripController.ts - Version simplifiée (utilisateurs connectés uniquement)
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Trip } from '../models/Trip';
import { TripStatus, TripType } from '../types/trip';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import { TripCapacityService } from '../services/TripCapacityService';
import { CurrencyService } from '../services/CurrencyService';
import { translationService } from '../services/TranslationService';
import { sendLocalizedResponse } from '../utils/responseHelpers';

export class TripController {

  // Fonction existante - conservée intacte
  static async convertTripsForUser(trips: any[], userCurrency: string) {
    try {
      console.log('=== CONVERSION TRIPS ===');
      console.log('User currency:', userCurrency);
      console.log('Nombre de trips à convertir:', trips.length);
      
      if (trips.length === 0) return [];
      
      console.log('Premier trip avant conversion:', {
        id: trips[0].id,
        pricePerKg: trips[0].pricePerKg,
        title: trips[0].title
      });

      const rates = await CurrencyService.getExchangeRates();
      console.log('Taux de change récupérés:', Object.keys(rates).length + ' devises');
      
      const convertedTrips = trips.map(trip => {
        const originalPrice = parseFloat(trip.pricePerKg) || 0;
        
        let convertedPrice;
        if (userCurrency === 'EUR') {
          convertedPrice = originalPrice;
          console.log(`Trip ${trip.id}: EUR - pas de conversion (${originalPrice})`);
        } else {
          convertedPrice = CurrencyService.convertPrice(originalPrice, 'EUR', userCurrency, rates);
          console.log(`Trip ${trip.id}: ${originalPrice} EUR -> ${convertedPrice} ${userCurrency}`);
        }
        
        return {
          ...trip,
          originalPricePerKg: originalPrice,
          pricePerKg: convertedPrice,
          displayCurrency: userCurrency,
          currencySymbol: CurrencyService.getCurrencySymbol(userCurrency)
        };
      });

      if (convertedTrips.length > 0) {
        console.log('Premier trip après conversion:', {
          pricePerKg: convertedTrips[0].pricePerKg,
          displayCurrency: convertedTrips[0].displayCurrency,
          currencySymbol: convertedTrips[0].currencySymbol
        });
      }

      return convertedTrips;
    } catch (error) {
      console.error('Erreur conversion trips:', error);
      return trips.map(trip => ({
        ...trip,
        originalPricePerKg: trip.pricePerKg,
        displayCurrency: 'EUR',
        currencySymbol: '€'
      }));
    }
  }

  static async getAvailableTrips(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const trips = await Trip.findAll({
        where: {
          status: TripStatus.PUBLISHED,
          departureDate: { [Op.gte]: new Date() },
          travelerId: { [Op.ne]: user.id }
        },
        include: [
          {
            model: User,
            as: 'traveler',
            attributes: ['firstName', 'lastName', 'profileName']
          }
        ],
        order: [['departureDate', 'ASC']]
      });

      const tripsWithCapacity = await Promise.all(
        trips.map(async (trip) => {
          const reservedWeight = await TripCapacityService.calculateReservedWeight(trip.id);
          const availableWeight = trip.capacityKg - reservedWeight;
          
          const tripData = {
            ...trip.toJSON(),
            reservedWeight,
            availableWeight,
            capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
            isOwnTrip: false
          };

          // Ajouter les traductions
          return translationService.formatTripForAPI(tripData, user);
        })
      );

      const availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);
      const convertedTrips = await TripController.convertTripsForUser(availableTrips, user.currency);

      return sendLocalizedResponse(
        res,
        'msg.trips_loaded',
        { trips: convertedTrips },
        200,
        user
      );

    } catch (error) {
      console.error('Erreur récupération voyages:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_trips',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async getAllTrips(req: Request, res: Response) {
    
console.log('=== DEBUT getAllTrips ===');

    try {
      const user = (req as any).user;       
      
      const forcedCurrency = req.headers['x-force-currency'] as string;
      const userCurrency = forcedCurrency || user.currency;
      
      console.log('DEVISE UTILISÉE:', {
        userCurrencyFromDB: user.currency,
        forcedCurrency,
        finalCurrency: userCurrency
      });

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const whereClause = {
        status: TripStatus.PUBLISHED,
        travelerId: { [Op.not]: user.id }
      };

      const paginatedTrips = await Trip.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'traveler',
          attributes: ['id', 'firstName', 'lastName', 'profileName', 'rating']
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      

      console.log('Trips récupérés avant conversion:', paginatedTrips.length);

      const plainTrips = await Promise.all(
  paginatedTrips.map(async (trip) => {
    const reservedWeight = await TripCapacityService.calculateReservedWeight(trip.id);
    const availableWeight = trip.capacityKg - reservedWeight;
    //log
    console.log(`Voyage ${trip.id}: capacityKg=${trip.capacityKg}, reserved=${reservedWeight}, available=${availableWeight}`);
    
    const tripData = {
      ...trip.toJSON(),
      reservedWeight,
      availableWeight,
      capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100)
    };
    
    return translationService.formatTripForAPI(tripData, user);
  })
);
      const availableTrips = plainTrips.filter(trip => trip.availableWeight > 0);
      //log
      console.log(`Total trips: ${plainTrips.length}, Disponibles: ${availableTrips.length}`);
            
      const convertedTrips = await TripController.convertTripsForUser(availableTrips, userCurrency);
      const totalTrips = await Trip.count({ where: whereClause });

      return sendLocalizedResponse(
        res,
        'msg.trips_loaded',
        {
          trips: convertedTrips,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalTrips / limit),
            totalTrips,
            limit
          }
        },
        200,
        user,
        req
      );

    } catch (error: any) {
      console.error('Erreur récupération voyages:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_trips',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async searchTrips(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { from, to, date, maxWeight, maxPrice } = req.query;
      const whereConditions: any = { 
        status: TripStatus.PUBLISHED,
        travelerId: { [Op.ne]: user.id }
      };

      if (from) {
        whereConditions.departureCity = { [Op.iLike]: `%${from}%` };
      }
      if (to) {
        whereConditions.arrivalCity = { [Op.iLike]: `%${to}%` };
      }
      if (date) {
        const searchDate = new Date(date as string);
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);
        whereConditions.departureDate = { [Op.between]: [searchDate, nextDay] };
      }
      if (maxPrice) {
        whereConditions.pricePerKg = { [Op.lte]: parseFloat(maxPrice as string) };
      }

      const trips = await Trip.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'traveler',
            attributes: ['id', 'firstName', 'lastName', 'profileName'],
          },
        ],
        order: [['departureDate', 'ASC']],
        limit: 100,
      });

      const tripsWithCapacity = await Promise.all(
        trips.map(async (trip) => {
          const reservedWeight = await TripCapacityService.calculateReservedWeight(trip.id);
          const availableWeight = trip.capacityKg - reservedWeight;
          
          const tripData = {
            ...trip.toJSON(),
            reservedWeight,
            availableWeight,
            capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
            isOwnTrip: false
          };

          return translationService.formatTripForAPI(tripData, user);
        })
      );

      let availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);

      if (maxWeight) {
        availableTrips = availableTrips.filter(trip => 
          trip.availableWeight >= parseFloat(maxWeight as string)
        );
      }

      const convertedTrips = await TripController.convertTripsForUser(availableTrips.slice(0, 50), user.currency);

      return sendLocalizedResponse(
        res,
        'msg.trips_loaded',
        { trips: convertedTrips },
        200,
        user
      );

    } catch (error: any) {
      console.error('Erreur recherche voyages:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_trips',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async createTrip(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user.canCreateTrip()) {
        return sendLocalizedResponse(
          res,
          'msg.identity_verification_required',
          null,
          403,
          user
        );
      }

      const {
        title,
        description,
        departureCity,
        departureCountry,
        departureDate,
        departureAddress,
        departureLat,
        departureLng,
        arrivalCity,
        arrivalCountry,
        arrivalDate,
        arrivalAddress,
        arrivalLat,
        arrivalLng,
        capacityKg,
        pricePerKg,
        maxItemSize,
        transportMode,
      } = req.body;

      const trip = await Trip.create({
        travelerId: user.id,
        title,
        description,
        departureCity,
        departureCountry,
        departureDate,
        departureAddress,
        departureLat,
        departureLng,
        arrivalCity,
        arrivalCountry,
        arrivalDate,
        arrivalAddress,
        arrivalLat,
        arrivalLng,
        capacityKg,
        reservedWeight: 0,
        availableWeight: capacityKg,
        pricePerKg,
        maxItemSize,
        transportMode,
        tripType: TripType.INTERNATIONAL,
        status: TripStatus.PUBLISHED,
        allowedItems: ['vêtements', 'documents', 'électronique'],
        forbiddenItems: ['liquides', 'substances dangereuses'],
      });

      await user.increment('totalTrips');

      const formattedTrip = translationService.formatTripForAPI(trip.toJSON(), user);

      return sendLocalizedResponse(
        res,
        'msg.trip_created',
        { 
          trip: formattedTrip,
          userAccess: getUserAccessInfo(user)
        },
        201,
        user
      );

    } catch (error: any) {
      console.error('Erreur création voyage:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_creating_trip',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async getTripDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const trip = await Trip.findByPk(id, {
        include: [
          {
            model: User,
            as: 'traveler',
            attributes: ['id', 'firstName', 'lastName', 'totalTrips', 'profileName'],
          },
        ],
      });

      if (!trip) {
        return sendLocalizedResponse(
          res,
          'msg.trip_not_found',
          null,
          404,
          user
        );
      }

      const reservedWeight = await TripCapacityService.calculateReservedWeight(trip.id);
      const availableWeight = trip.capacityKg - reservedWeight;

      const tripWithCapacity = {
        ...trip.toJSON(),
        reservedWeight,
        availableWeight,
        capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
        isOwnTrip: trip.travelerId === user.id
      };

      const formattedTrip = translationService.formatTripForAPI(tripWithCapacity, user);
      const convertedTrips = await TripController.convertTripsForUser([formattedTrip], user.currency);

      return sendLocalizedResponse(
        res,
        'msg.trip_loaded',
        { trip: convertedTrips[0] },
        200,
        user
      );

    } catch (error: any) {
      console.error('Erreur récupération voyage:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_trip',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async updateTrip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const trip = await Trip.findOne({
        where: { id, travelerId: user.id },
      });

      if (!trip) {
        return sendLocalizedResponse(
          res,
          'msg.trip_not_found',
          null,
          404,
          user
        );
      }

      await trip.update(req.body);
      
      if (req.body.capacityKg) {
        await TripCapacityService.updateTripVisibility();
      }

      const formattedTrip = translationService.formatTripForAPI(trip.toJSON(), user);

      return res.status(200).json({
        success: true,
        message: translationService.t('msg.trip_updated', user,  'Voyage mis à jour'),
        data: { trip: formattedTrip },
        locale: user?.language || 'fr',
        currency: user.currency
      });

    } catch (error: any) {
      console.error('Erreur mise à jour voyage:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_trip',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async deleteTrip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const trip = await Trip.findOne({
        where: { id, travelerId: user.id },
      });

      if (!trip) {
        return sendLocalizedResponse(
          res,
          'msg.trip_not_found',
          null,
          404,
          user
        );
      }

      await trip.update({ status: TripStatus.CANCELLED });

      return res.status(200).json({
        success: true,
        message: translationService.t('msg.trip_deleted', user,  'Voyage supprimé'),
        locale: user?.language || 'fr',
        currency: user.currency
      });

    } catch (error: any) {
      console.error('Erreur suppression voyage:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_trip',
        null,
        500,
        (req as any).user
      );
    }
  }
}