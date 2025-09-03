import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Trip } from '../models/Trip';
import { TripStatus, TripType } from '../types/trip';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import { TripCapacityService } from '../services/TripCapacityService';
import { CurrencyService } from '../services/CurrencyService';
import { log } from 'console';

export class TripController {

  // Dans TripController backend
static async convertTripsForUser(trips: any[], userCurrency: string) {
  try {
    console.log('=== CONVERSION TRIPS ===');
    console.log('User currency:', userCurrency);
    console.log('Nombre de trips à convertir:', trips.length);
    
    if (trips.length > 0) {
      console.log('Premier trip avant conversion:', {
        id: trips[0].id,
        pricePerKg: trips[0].pricePerKg,
        title: trips[0].title
      });
    }

    const rates = await CurrencyService.getExchangeRates();
    console.log('Taux de change récupérés:', rates);
    
    const convertedTrips = trips.map(trip => {
      const originalPrice = trip.pricePerKg;
      
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
          
          return {
            ...trip.toJSON(),
            reservedWeight,
            availableWeight,
            capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
            isOwnTrip: false
          };
        })
      );

      // Filtrer après calcul pour ne garder que les voyages avec capacité disponible
      const availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);

      // NOUVELLE LIGNE : Conversion devise
      const convertedTrips = await TripController.convertTripsForUser(availableTrips, user.currency);

      res.json({
        success: true,
        data: { trips: convertedTrips }
      });

    } catch (error) {
      console.error('Erreur récupération voyages:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur récupération voyages'
      });
    }
  }

  static async getAllTrips(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    // Utiliser la devise forcée si fournie, sinon celle de l'utilisateur
    const forcedCurrency = req.headers['x-force-currency'] as string;
    const userCurrency = forcedCurrency || user.currency;
    
    console.log('DEVISE UTILISÉE:', {
      userCurrencyFromDB: user.currency,
      forcedCurrency,
      finalCurrency: userCurrency
    });

    // DÉCLARER paginatedTrips D'ABORD
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

    // MAINTENANT utiliser convertTripsForUser
    const convertedTrips = await TripController.convertTripsForUser(paginatedTrips, userCurrency);

    console.log('USER COMPLET dans getAllTrips:', {
      id: user.id,
      email: user.email,
      currency: user.currency,
      finalCurrencyUsed: userCurrency
    });

    const totalTrips = await Trip.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        trips: convertedTrips,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTrips / limit),
          totalTrips,
          limit
        }
      }
    });

  } catch (error: any) {
    console.error('Erreur récupération voyages:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des voyages'
    });
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
        limit: 100, // Augmenter pour compenser le filtrage
      });

      const tripsWithCapacity = await Promise.all(
        trips.map(async (trip) => {
          const reservedWeight = await TripCapacityService.calculateReservedWeight(trip.id);
          const availableWeight = trip.capacityKg - reservedWeight;
          
          return {
            ...trip.toJSON(),
            reservedWeight,
            availableWeight,
            capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
            isOwnTrip: false
          };
        })
      );

      // Filtrer après calcul et appliquer le filtre de poids si spécifié
      let availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);

      if (maxWeight) {
        availableTrips = availableTrips.filter(trip => 
          trip.availableWeight >= parseFloat(maxWeight as string)
        );
      }

      // NOUVELLE LIGNE : Conversion devise
      const convertedTrips = await TripController.convertTripsForUser(availableTrips.slice(0, 50), user.currency);

      res.json({
        success: true,
        data: { trips: convertedTrips },
      });
    } catch (error: any) {
      console.error('Erreur recherche voyages:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche',
      });
    }
  }

  static async createTrip(req: Request, res: Response) {
    try {
      const user = (req as any).user;
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

      res.status(201).json({
        success: true,
        data: { trip },
        userAccess: getUserAccessInfo(user),
        message: 'Voyage créé avec succès',
      });
    } catch (error: any) {
      console.error('Erreur création voyage:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur création voyage',
      });
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
        return res.status(404).json({
          success: false,
          error: 'Voyage non trouvé',
        });
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

      // NOUVELLE LIGNE : Conversion devise pour trip unique
      const convertedTrips = await TripController.convertTripsForUser([tripWithCapacity], user.currency);

      res.json({
        success: true,
        data: { trip: convertedTrips[0] },
      });
    } catch (error: any) {
      console.error('Erreur récupération voyage:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur récupération voyage',
      });
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
        return res.status(404).json({
          success: false,
          error: 'Voyage non trouvé ou non autorisé',
        });
      }

      await trip.update(req.body);
      
      if (req.body.capacityKg) {
        await TripCapacityService.updateTripVisibility();
      }

      res.json({
        success: true,
        data: { trip },
        message: 'Voyage mis à jour',
      });
    } catch (error: any) {
      console.error('Erreur mise à jour voyage:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur mise à jour voyage',
      });
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
        return res.status(404).json({
          success: false,
          error: 'Voyage non trouvé ou non autorisé',
        });
      }

      await trip.update({ status: TripStatus.CANCELLED });
      res.json({
        success: true,
        message: 'Voyage supprimé',
      });
    } catch (error: any) {
      console.error('Erreur suppression voyage:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur suppression voyage',
      });
    }
  }
}