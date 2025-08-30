"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripController = void 0;
const sequelize_1 = require("sequelize");
const Trip_1 = require("../models/Trip");
const trip_1 = require("../types/trip");
const User_1 = require("../models/User");
const userAccess_1 = require("../utils/userAccess");
const TripCapacityService_1 = require("../services/TripCapacityService");
class TripController {
    static async getAvailableTrips(req, res) {
        try {
            const user = req.user;
            const trips = await Trip_1.Trip.findAll({
                where: {
                    status: trip_1.TripStatus.PUBLISHED,
                    departureDate: { [sequelize_1.Op.gte]: new Date() },
                    travelerId: { [sequelize_1.Op.ne]: user.id }
                },
                include: [
                    {
                        model: User_1.User,
                        as: 'traveler',
                        attributes: ['firstName', 'lastName', 'profileName']
                    }
                ],
                order: [['departureDate', 'ASC']]
            });
            const tripsWithCapacity = await Promise.all(trips.map(async (trip) => {
                const reservedWeight = await TripCapacityService_1.TripCapacityService.calculateReservedWeight(trip.id);
                const availableWeight = trip.capacityKg - reservedWeight;
                return {
                    ...trip.toJSON(),
                    reservedWeight,
                    availableWeight,
                    capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
                    isOwnTrip: false
                };
            }));
            // Filtrer après calcul pour ne garder que les voyages avec capacité disponible
            const availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);
            res.json({
                success: true,
                data: { trips: availableTrips }
            });
        }
        catch (error) {
            console.error('Erreur récupération voyages:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur récupération voyages'
            });
        }
    }
    static async getAllTrips(req, res) {
        try {
            console.log('BACKEND - getAllTrips appelé');
            const user = req.user;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const whereClause = {
                status: trip_1.TripStatus.PUBLISHED,
                travelerId: { [sequelize_1.Op.ne]: user.id }
            };
            const trips = await Trip_1.Trip.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: User_1.User,
                        as: 'traveler',
                        attributes: ['id', 'firstName', 'lastName', 'profileName']
                    },
                ],
                order: [['departureDate', 'ASC']],
                limit: limit * 2, // Augmenter pour compenser le filtrage
                offset,
            });
            const tripsWithCapacity = await Promise.all(trips.rows.map(async (trip) => {
                const reservedWeight = await TripCapacityService_1.TripCapacityService.calculateReservedWeight(trip.id);
                const availableWeight = trip.capacityKg - reservedWeight;
                return {
                    ...trip.toJSON(),
                    reservedWeight,
                    availableWeight,
                    capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
                    isOwnTrip: false
                };
            }));
            // Filtrer les voyages avec capacité disponible après calcul
            const availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);
            // Limiter au nombre demandé après filtrage
            const paginatedTrips = availableTrips.slice(0, limit);
            res.json({
                success: true,
                data: {
                    trips: paginatedTrips,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(availableTrips.length / limit),
                        totalItems: availableTrips.length,
                        itemsPerPage: limit,
                    },
                },
            });
        }
        catch (error) {
            console.error('Erreur récupération voyages:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des voyages',
            });
        }
    }
    static async searchTrips(req, res) {
        try {
            const user = req.user;
            const { from, to, date, maxWeight, maxPrice } = req.query;
            const whereConditions = {
                status: trip_1.TripStatus.PUBLISHED,
                travelerId: { [sequelize_1.Op.ne]: user.id }
            };
            if (from) {
                whereConditions.departureCity = { [sequelize_1.Op.iLike]: `%${from}%` };
            }
            if (to) {
                whereConditions.arrivalCity = { [sequelize_1.Op.iLike]: `%${to}%` };
            }
            if (date) {
                const searchDate = new Date(date);
                const nextDay = new Date(searchDate);
                nextDay.setDate(nextDay.getDate() + 1);
                whereConditions.departureDate = { [sequelize_1.Op.between]: [searchDate, nextDay] };
            }
            if (maxPrice) {
                whereConditions.pricePerKg = { [sequelize_1.Op.lte]: parseFloat(maxPrice) };
            }
            const trips = await Trip_1.Trip.findAll({
                where: whereConditions,
                include: [
                    {
                        model: User_1.User,
                        as: 'traveler',
                        attributes: ['id', 'firstName', 'lastName', 'profileName'],
                    },
                ],
                order: [['departureDate', 'ASC']],
                limit: 100, // Augmenter pour compenser le filtrage
            });
            const tripsWithCapacity = await Promise.all(trips.map(async (trip) => {
                const reservedWeight = await TripCapacityService_1.TripCapacityService.calculateReservedWeight(trip.id);
                const availableWeight = trip.capacityKg - reservedWeight;
                return {
                    ...trip.toJSON(),
                    reservedWeight,
                    availableWeight,
                    capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
                    isOwnTrip: false
                };
            }));
            // Filtrer après calcul et appliquer le filtre de poids si spécifié
            let availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);
            if (maxWeight) {
                availableTrips = availableTrips.filter(trip => trip.availableWeight >= parseFloat(maxWeight));
            }
            res.json({
                success: true,
                data: { trips: availableTrips.slice(0, 50) },
            });
        }
        catch (error) {
            console.error('Erreur recherche voyages:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche',
            });
        }
    }
    static async createTrip(req, res) {
        try {
            const user = req.user;
            const { title, description, departureCity, departureCountry, departureDate, departureAddress, departureLat, departureLng, arrivalCity, arrivalCountry, arrivalDate, arrivalAddress, arrivalLat, arrivalLng, capacityKg, pricePerKg, maxItemSize, transportMode, } = req.body;
            const trip = await Trip_1.Trip.create({
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
                tripType: trip_1.TripType.INTERNATIONAL,
                status: trip_1.TripStatus.PUBLISHED,
                allowedItems: ['vêtements', 'documents', 'électronique'],
                forbiddenItems: ['liquides', 'substances dangereuses'],
            });
            await user.increment('totalTrips');
            res.status(201).json({
                success: true,
                data: { trip },
                userAccess: (0, userAccess_1.getUserAccessInfo)(user),
                message: 'Voyage créé avec succès',
            });
        }
        catch (error) {
            console.error('Erreur création voyage:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur création voyage',
            });
        }
    }
    static async getTripDetails(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const trip = await Trip_1.Trip.findByPk(id, {
                include: [
                    {
                        model: User_1.User,
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
            const reservedWeight = await TripCapacityService_1.TripCapacityService.calculateReservedWeight(trip.id);
            const availableWeight = trip.capacityKg - reservedWeight;
            const tripWithCapacity = {
                ...trip.toJSON(),
                reservedWeight,
                availableWeight,
                capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
                isOwnTrip: trip.travelerId === user.id
            };
            res.json({
                success: true,
                data: { trip: tripWithCapacity },
            });
        }
        catch (error) {
            console.error('Erreur récupération voyage:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur récupération voyage',
            });
        }
    }
    static async updateTrip(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const trip = await Trip_1.Trip.findOne({
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
                await TripCapacityService_1.TripCapacityService.updateTripVisibility();
            }
            res.json({
                success: true,
                data: { trip },
                message: 'Voyage mis à jour',
            });
        }
        catch (error) {
            console.error('Erreur mise à jour voyage:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur mise à jour voyage',
            });
        }
    }
    static async deleteTrip(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const trip = await Trip_1.Trip.findOne({
                where: { id, travelerId: user.id },
            });
            if (!trip) {
                return res.status(404).json({
                    success: false,
                    error: 'Voyage non trouvé ou non autorisé',
                });
            }
            await trip.update({ status: trip_1.TripStatus.CANCELLED });
            res.json({
                success: true,
                message: 'Voyage supprimé',
            });
        }
        catch (error) {
            console.error('Erreur suppression voyage:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur suppression voyage',
            });
        }
    }
}
exports.TripController = TripController;
