"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripCapacityService = void 0;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const trip_1 = require("../types/trip");
class TripCapacityService {
    // Vérifier si la capacité est disponible
    static async checkAvailability(tripId, requestedWeight) {
        try {
            const trip = await models_1.Trip.findByPk(tripId);
            if (!trip)
                return false;
            // Calculer le poids réellement disponible
            const totalReserved = await this.calculateReservedWeight(tripId);
            const availableWeight = trip.capacityKg - totalReserved;
            return availableWeight >= requestedWeight;
        }
        catch (error) {
            console.error('Erreur vérification disponibilité:', error);
            return false;
        }
    }
    // Calculer le poids total réservé pour un voyage
    static async calculateReservedWeight(tripId) {
        try {
            const result = await models_1.Transaction.sum('packageWeight', {
                where: {
                    tripId,
                    status: {
                        [sequelize_1.Op.in]: [
                            'payment_pending',
                            'payment_escrowed',
                            'package_picked_up',
                            'package_delivered', // Ajout
                            'payment_released' // Ajout
                        ]
                    }
                }
            });
            return result || 0;
        }
        catch (error) {
            console.error('Erreur calcul poids réservé:', error);
            return 0;
        }
    }
    // Réserver de la capacité
    static async reserveCapacity(tripId, weight) {
        try {
            const trip = await models_1.Trip.findByPk(tripId);
            if (!trip)
                return false;
            // Vérifier d'abord la disponibilité
            const isAvailable = await this.checkAvailability(tripId, weight);
            if (!isAvailable) {
                throw new Error('Capacité insuffisante');
            }
            // Mettre à jour le poids réservé du voyage
            const newReservedWeight = trip.reservedWeight + weight;
            const newAvailableWeight = trip.capacityKg - newReservedWeight;
            await trip.update({
                reservedWeight: newReservedWeight,
                availableWeight: newAvailableWeight
            });
            return true;
        }
        catch (error) {
            console.error('Erreur réservation capacité:', error);
            return false;
        }
    }
    // Libérer la capacité seulement en cas d'annulation ou d'échec
    static async releaseCapacity(tripId, weight) {
        try {
            const trip = await models_1.Trip.findByPk(tripId);
            if (!trip)
                return;
            // Libérer la capacité réservée
            const newReservedWeight = Math.max(0, trip.reservedWeight - weight);
            const newAvailableWeight = trip.capacityKg - newReservedWeight;
            await trip.update({
                reservedWeight: newReservedWeight,
                availableWeight: newAvailableWeight
            });
            console.log(`Capacité libérée: ${weight}kg pour voyage ${tripId}`);
        }
        catch (error) {
            console.error('Erreur libération capacité:', error);
        }
    }
    // Mettre à jour les voyages pour masquer ceux complets
    static async updateTripVisibility() {
        try {
            // Masquer les voyages où toute la capacité est réservée
            await models_1.Trip.update({ status: trip_1.TripStatus.FULL }, // Utilisation de l'enum au lieu de 'full'
            {
                where: {
                    availableWeight: { [sequelize_1.Op.lte]: 0 },
                    status: trip_1.TripStatus.PUBLISHED
                }
            });
            // Réactiver les voyages avec de la capacité disponible
            await models_1.Trip.update({ status: trip_1.TripStatus.PUBLISHED }, // Utilisation de l'enum au lieu de 'published'
            {
                where: {
                    availableWeight: { [sequelize_1.Op.gt]: 0 },
                    status: trip_1.TripStatus.FULL
                }
            });
        }
        catch (error) {
            console.error('Erreur mise à jour visibilité voyages:', error);
        }
    }
}
exports.TripCapacityService = TripCapacityService;
