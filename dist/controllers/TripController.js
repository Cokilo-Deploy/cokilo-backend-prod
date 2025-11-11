"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripController = void 0;
const sequelize_1 = require("sequelize");
const Trip_1 = require("../models/Trip");
const trip_1 = require("../types/trip");
const User_1 = require("../models/User");
const userAccess_1 = require("../utils/userAccess");
const TripCapacityService_1 = require("../services/TripCapacityService");
const TranslationService_1 = require("../services/TranslationService");
const responseHelpers_1 = require("../utils/responseHelpers");
const errorCodes_1 = require("../utils/errorCodes");
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
                const tripData = {
                    ...trip.toJSON(),
                    reservedWeight,
                    availableWeight,
                    capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
                    isOwnTrip: false
                };
                // Ajouter les traductions
                return TranslationService_1.translationService.formatTripForAPI(tripData, user);
            }));
            const availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);
            const tripsWithCurrency = availableTrips.map(trip => ({
                ...trip,
                displayCurrency: 'EUR',
                currencySymbol: '€'
            }));
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trips_loaded', { trips: tripsWithCurrency }, 200, user);
        }
        catch (error) {
            console.error('Erreur récupération voyages:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_trips', null, 500, req.user);
        }
    }
    static async getAllTrips(req, res) {
        console.log('=== DEBUT getAllTrips ===');
        try {
            const user = req.user;
            const forcedCurrency = req.headers['x-force-currency'];
            const userCurrency = forcedCurrency || user.currency;
            console.log('DEVISE UTILISÉE:', {
                userCurrencyFromDB: user.currency,
                forcedCurrency,
                finalCurrency: userCurrency
            });
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const whereClause = {
                status: trip_1.TripStatus.PUBLISHED,
            };
            const paginatedTrips = await Trip_1.Trip.findAll({
                where: whereClause,
                include: [{
                        model: User_1.User,
                        as: 'traveler',
                        attributes: ['id', 'firstName', 'lastName', 'profileName', 'rating', 'avatar']
                    }],
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });
            console.log('Trips récupérés avant conversion:', paginatedTrips.length);
            const plainTrips = await Promise.all(paginatedTrips.map(async (trip) => {
                const reservedWeight = await TripCapacityService_1.TripCapacityService.calculateReservedWeight(trip.id);
                const availableWeight = trip.capacityKg - reservedWeight;
                //log
                console.log(`Voyage ${trip.id}: capacityKg=${trip.capacityKg}, reserved=${reservedWeight}, available=${availableWeight}`);
                const tripData = {
                    ...trip.toJSON(),
                    reservedWeight,
                    availableWeight,
                    capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
                    isOwnTrip: trip.travelerId === user.id
                };
                return TranslationService_1.translationService.formatTripForAPI(tripData, user);
            }));
            const availableTrips = plainTrips.filter(trip => trip.availableWeight > 0);
            //log
            console.log(`Total trips: ${plainTrips.length}, Disponibles: ${availableTrips.length}`);
            const tripsWithCurrency = availableTrips.map(trip => ({
                ...trip,
                displayCurrency: 'EUR',
                currencySymbol: '€'
            }));
            const totalTrips = await Trip_1.Trip.count({ where: whereClause });
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trips_loaded', {
                trips: tripsWithCurrency,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalTrips / limit),
                    totalTrips,
                    limit
                }
            }, 200, user, req);
        }
        catch (error) {
            console.error('Erreur récupération voyages:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_trips', null, 500, req.user);
        }
    }
    static async searchTrips(req, res) {
        try {
            const user = req.user;
            const { from, to, date, maxWeight, maxPrice } = req.query;
            const whereConditions = {
                status: trip_1.TripStatus.PUBLISHED,
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
                        attributes: ['id', 'firstName', 'lastName', 'profileName', 'avatar'],
                    },
                ],
                order: [['departureDate', 'ASC']],
                limit: 100,
            });
            const tripsWithCapacity = await Promise.all(trips.map(async (trip) => {
                const reservedWeight = await TripCapacityService_1.TripCapacityService.calculateReservedWeight(trip.id);
                const availableWeight = trip.capacityKg - reservedWeight;
                const tripData = {
                    ...trip.toJSON(),
                    reservedWeight,
                    availableWeight,
                    capacityPercentage: Math.round((reservedWeight / trip.capacityKg) * 100),
                    isOwnTrip: trip.travelerId === user.id
                };
                return TranslationService_1.translationService.formatTripForAPI(tripData, user);
            }));
            let availableTrips = tripsWithCapacity.filter(trip => trip.availableWeight > 0);
            if (maxWeight) {
                availableTrips = availableTrips.filter(trip => trip.availableWeight >= parseFloat(maxWeight));
            }
            const tripsWithCurrency = availableTrips.slice(0, 50).map(trip => ({
                ...trip,
                displayCurrency: 'EUR',
                currencySymbol: '€'
            }));
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trips_loaded', { trips: tripsWithCurrency }, 200, user);
        }
        catch (error) {
            console.error('Erreur recherche voyages:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_trips', null, 500, req.user);
        }
    }
    static async createTrip(req, res) {
        try {
            const user = req.user;
            if (!user.canCreateTrip()) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.identity_verification_required', null, 403, user);
            }
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
            const formattedTrip = TranslationService_1.translationService.formatTripForAPI(trip.toJSON(), user);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trip_created', {
                trip: formattedTrip,
                userAccess: (0, userAccess_1.getUserAccessInfo)(user)
            }, 201, user);
        }
        catch (error) {
            console.error('Erreur création voyage:', error);
            return res.status(500).json((0, errorCodes_1.errorResponse)(errorCodes_1.ErrorCode.TRIP_CREATION_FAILED));
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
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trip_not_found', null, 404, user);
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
            const formattedTrip = TranslationService_1.translationService.formatTripForAPI(tripWithCapacity, user);
            const tripWithCurrency = {
                ...formattedTrip,
                displayCurrency: 'EUR',
                currencySymbol: '€'
            };
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trip_loaded', { trip: tripWithCurrency }, 200, user);
        }
        catch (error) {
            console.error('Erreur récupération voyage:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_trip', null, 500, req.user);
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
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trip_not_found', null, 404, user);
            }
            await trip.update(req.body);
            if (req.body.capacityKg) {
                await TripCapacityService_1.TripCapacityService.updateTripVisibility();
            }
            const formattedTrip = TranslationService_1.translationService.formatTripForAPI(trip.toJSON(), user);
            return res.status(200).json({
                success: true,
                message: TranslationService_1.translationService.t('msg.trip_updated', user, 'Voyage mis à jour'),
                data: { trip: formattedTrip },
                locale: user?.language || 'fr',
                currency: user.currency
            });
        }
        catch (error) {
            console.error('Erreur mise à jour voyage:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_trip', null, 500, req.user);
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
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trip_not_found', null, 404, user);
            }
            await trip.update({ status: trip_1.TripStatus.CANCELLED });
            return res.status(200).json({
                success: true,
                message: TranslationService_1.translationService.t('msg.trip_deleted', user, 'Voyage supprimé'),
                locale: user?.language || 'fr',
                currency: user.currency
            });
        }
        catch (error) {
            console.error('Erreur suppression voyage:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_trip', null, 500, req.user);
        }
    }
}
exports.TripController = TripController;
