import { Trip, Transaction } from '../models';
import { Op } from 'sequelize';
import { TripStatus } from '../types/trip';

export class TripCapacityService {
  // Vérifier si la capacité est disponible
  static async checkAvailability(tripId: number, requestedWeight: number): Promise<boolean> {
    try {
      const trip = await Trip.findByPk(tripId);
      if (!trip) return false;
      
      // Calculer le poids réellement disponible
      const totalReserved = await this.calculateReservedWeight(tripId);
      const availableWeight = trip.capacityKg - totalReserved;
      
      return availableWeight >= requestedWeight;
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      return false;
    }
  }

  // Calculer le poids total réservé pour un voyage
  static async calculateReservedWeight(tripId: number): Promise<number> {
  try {
    const result = await Transaction.sum('packageWeight', {
      where: {
        tripId,
        status: {
          [Op.in]: [
            'payment_pending', 
            'payment_escrowed', 
            'package_picked_up',
            'package_delivered',  // Ajout
            'payment_released'    // Ajout
          ]
        }
      }
    });
    
    return result || 0;
  } catch (error) {
    console.error('Erreur calcul poids réservé:', error);
    return 0;
  }
}

  // Réserver de la capacité
  static async reserveCapacity(tripId: number, weight: number): Promise<boolean> {
    try {
      const trip = await Trip.findByPk(tripId);
      if (!trip) return false;

      

      // Mettre à jour le poids réservé du voyage
      const newReservedWeight = trip.reservedWeight + weight;
      const newAvailableWeight = trip.capacityKg - newReservedWeight;

      await trip.update({
        reservedWeight: newReservedWeight,
        availableWeight: newAvailableWeight
      });

      return true;
    } catch (error) {
      console.error('Erreur réservation capacité:', error);
      return false;
    }
  }

  // Libérer la capacité seulement en cas d'annulation ou d'échec
static async releaseCapacity(tripId: number, weight: number) {
  try {
    const trip = await Trip.findByPk(tripId);
    if (!trip) return;

    // Libérer la capacité réservée
    const newReservedWeight = Math.max(0, trip.reservedWeight - weight);
    const newAvailableWeight = trip.capacityKg - newReservedWeight;

    await trip.update({
      reservedWeight: newReservedWeight,
      availableWeight: newAvailableWeight
    });

    console.log(`Capacité libérée: ${weight}kg pour voyage ${tripId}`);
  } catch (error) {
    console.error('Erreur libération capacité:', error);
  }
}

  // Mettre à jour les voyages pour masquer ceux complets
  static async updateTripVisibility(): Promise<void> {
    try {
      // Masquer les voyages où toute la capacité est réservée
      await Trip.update(
        { status: TripStatus.FULL }, // Utilisation de l'enum au lieu de 'full'
        {
          where: {
            availableWeight: { [Op.lte]: 0 },
            status: TripStatus.PUBLISHED
          }
        }
      );

      // Réactiver les voyages avec de la capacité disponible
      await Trip.update(
        { status: TripStatus.PUBLISHED }, // Utilisation de l'enum au lieu de 'published'
        {
          where: {
            availableWeight: { [Op.gt]: 0 },
            status: TripStatus.FULL
          }
        }
      );
    } catch (error) {
      console.error('Erreur mise à jour visibilité voyages:', error);
    }
  }
}