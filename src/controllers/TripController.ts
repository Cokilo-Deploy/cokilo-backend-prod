import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Trip } from '../models/Trip';
import { TripStatus, TripType } from '../types/trip';
import { User } from '../models/User';
import { getUserAccessInfo } from '../utils/userAccess';
import { TripCapacityService } from '../services/TripCapacityService';
import { CurrencyService } from '../services/CurrencyService';

export class TripController {

  private static async convertTripsForUser(trips: any[], userCurrency: string): Promise<any[]> {
    if (userCurrency === 'EUR') return trips; // Pas de conversion nécessaire
    
    try {
      const rates = await CurrencyService.getExchangeRates();
      
      return trips.map(trip => ({
        ...trip,
        pricePerKg: CurrencyService.convertPrice(trip.pricePerKg, 'EUR', userCurrency, rates),
        originalPricePerKg: trip.pricePerKg, // Garder le prix original
        displayCurrency: userCurrency,
        currencySymbol: CurrencyService.getCurrencySymbol(userCurrency)
      }));
    } catch (error) {
      console.error('Erreur conversion devise:', error);
      return trips; // Retourner sans conversion en cas d'erreur
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
      console.log('BACKEND - getAllTrips appelé');
      
      const user = (req as any).user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const whereClause = { 
        status: TripStatus.PUBLISHED,
        travelerId: { [Op.ne]: user.id }
      };

      const trips = await Trip.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'traveler',
            attributes: ['id', 'firstName', 'lastName', 'profileName']
          },
        ],
        order: [['departureDate', 'ASC']],
        limit: limit * 2, // Augmenter pour compenser le filtrage
        offset,
      });

      const tripsWithCapacity = await Promise.all(
        trips.rows.map(async (trip) => {
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

      // Filtrer les voyages avec capacité disponible après calcul
      const availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);

      // Limiter au nombre demandé après filtrage
      const paginatedTrips = availableTrips.slice(0, limit);

      // NOUVELLE LIGNE : Conversion devise
      const convertedTrips = await TripController.convertTripsForUser(paginatedTrips, user.currency);

      res.json({
        success: true,
        data: {
          trips: convertedTrips, // Utiliser convertedTrips au lieu de paginatedTrips
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(availableTrips.length / limit),
            totalItems: availableTrips.length,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error: any) {
      console.error('Erreur récupération voyages:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des voyages',
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