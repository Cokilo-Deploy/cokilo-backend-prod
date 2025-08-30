//src/models/Trip.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { TripStatus, TripType, TransportMode } from '../types/trip';

interface TripAttributes {
  id: number;
  travelerId: number;
  
  title: string;
  description: string;
  
  departureCity: string;
  departureCountry: string;
  departureAddress: string;
  departureLat: number;
  departureLng: number;
  
  arrivalCity: string;
  arrivalCountry: string;
  arrivalAddress: string;
  arrivalLat: number;
  arrivalLng: number;
  
  departureDate: Date;
  arrivalDate: Date;
  flexibleDates: boolean;
  
  transportMode: TransportMode;
  transportDetails?: string;
  
  capacityKg: number;        // Capacité totale du voyage
  reservedWeight: number;    // Poids déjà réservé
  availableWeight: number;   // Poids disponible (calculé)
  pricePerKg: number;
  maxItemSize: string;
  
  allowedItems: string[];
  forbiddenItems: string[];
  
  status: TripStatus;
  tripType: TripType;
  totalBookings: number;
  totalRevenue: number;
  
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TripCreationAttributes extends Optional<TripAttributes, 
  'id' | 'status' | 'totalBookings' | 'totalRevenue' | 'flexibleDates' | 'reservedWeight' | 'availableWeight'> {}

class Trip extends Model<TripAttributes, TripCreationAttributes> implements TripAttributes {
  public id!: number;
  public travelerId!: number;
  
  public title!: string;
  public description!: string;
  
  public departureCity!: string;
  public departureCountry!: string;
  public departureAddress!: string;
  public departureLat!: number;
  public departureLng!: number;
  
  public arrivalCity!: string;
  public arrivalCountry!: string;
  public arrivalAddress!: string;
  public arrivalLat!: number;
  public arrivalLng!: number;
  
  public departureDate!: Date;
  public arrivalDate!: Date;
  public flexibleDates!: boolean;
  
  public transportMode!: TransportMode;
  public transportDetails?: string;
  
  public capacityKg!: number;
  public reservedWeight!: number;
  public availableWeight!: number;
  public pricePerKg!: number;
  public maxItemSize!: string;
  
  public allowedItems!: string[];
  public forbiddenItems!: string[];
  
  public status!: TripStatus;
  public tripType!: TripType;
  public totalBookings!: number;
  public totalRevenue!: number;
  
  public publishedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isBookable(): boolean {
    return this.status === TripStatus.PUBLISHED && this.availableWeight > 0;
  }

  public getRemainingWeight(): number {
    return this.availableWeight;
  }

  public getTotalDuration(): number {
    return this.arrivalDate.getTime() - this.departureDate.getTime();
  }

  public updateAvailableWeight(): void {
    this.availableWeight = this.capacityKg - this.reservedWeight;
  }
}

Trip.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  travelerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [5, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [20, 1000],
    },
  },
  departureCity: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  departureCountry: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  departureAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  departureLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90,
    },
  },
  departureLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180,
    },
  },
  arrivalCity: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  arrivalCountry: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  arrivalAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  arrivalLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90,
    },
  },
  arrivalLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180,
    },
  },
  departureDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString(),
    },
  },
  arrivalDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
    },
  },
  flexibleDates: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  transportMode: {
    type: DataTypes.ENUM('car', 'train', 'plane', 'bus'),
    allowNull: false,
  },
  transportDetails: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  capacityKg: {
  type: DataTypes.DECIMAL(5, 2),
  allowNull: false, // Changé temporairement en true
  defaultValue: 10,
  validate: {
    min: 0.1,
    max: 100,
  },
},
  reservedWeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  availableWeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  pricePerKg: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    validate: {
      min: 1,
      max: 1000,
    },
  },
  maxItemSize: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [5, 100],
    },
  },
  allowedItems: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  },
  forbiddenItems: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: ['liquides', 'fragile', 'electronique'],
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'full', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: TripStatus.DRAFT,
  },
  tripType: {
    type: DataTypes.ENUM('domestic', 'international'),
    allowNull: false,
  },
  totalBookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Trip',
  tableName: 'trips',
  hooks: {
    beforeCreate: (trip: Trip) => {
      // Définir le type de voyage
      if (trip.departureCountry !== trip.arrivalCountry) {
        trip.tripType = TripType.INTERNATIONAL;
      } else {
        trip.tripType = TripType.DOMESTIC;
      }
      
      // Initialiser availableWeight avec capacityKg
      if (!trip.availableWeight) {
        trip.availableWeight = trip.capacityKg;
      }
    },
    beforeUpdate: (trip: Trip) => {
      if (trip.changed('status') && trip.status === TripStatus.PUBLISHED && !trip.publishedAt) {
        trip.publishedAt = new Date();
      }
      
      // Recalculer availableWeight si capacityKg ou reservedWeight change
      if (trip.changed('capacityKg') || trip.changed('reservedWeight')) {
        trip.availableWeight = trip.capacityKg - trip.reservedWeight;
      }
      
      // Changer le statut en 'full' si plus de capacité
      if (trip.availableWeight <= 0 && trip.status === TripStatus.PUBLISHED) {
        trip.status = TripStatus.FULL;
      }
      
      // Remettre en 'published' si de la capacité se libère
      if (trip.availableWeight > 0 && trip.status === TripStatus.FULL) {
        trip.status = TripStatus.PUBLISHED;
      }
    },
  },
  indexes: [
    {
      fields: ['travelerId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['departureCity', 'arrivalCity'],
    },
    {
      fields: ['departureDate'],
    },
    {
      fields: ['tripType'],
    },
    {
      fields: ['availableWeight'],
    },
  ],
});

export { Trip, TripAttributes, TripCreationAttributes };