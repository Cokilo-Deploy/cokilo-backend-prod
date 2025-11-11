"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trip = void 0;
//src/models/Trip.ts
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const trip_1 = require("../types/trip");
class Trip extends sequelize_1.Model {
    isBookable() {
        return this.status === trip_1.TripStatus.PUBLISHED && this.availableWeight > 0;
    }
    getRemainingWeight() {
        return this.availableWeight;
    }
    getTotalDuration() {
        return this.arrivalDate.getTime() - this.departureDate.getTime();
    }
    updateAvailableWeight() {
        this.availableWeight = this.capacityKg - this.reservedWeight;
    }
}
exports.Trip = Trip;
Trip.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    travelerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [5, 200],
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [20, 1000],
        },
    },
    departureCity: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100],
        },
    },
    departureCountry: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100],
        },
    },
    departureAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    departureLat: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: false,
        validate: {
            min: -90,
            max: 90,
        },
    },
    departureLng: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: false,
        validate: {
            min: -180,
            max: 180,
        },
    },
    arrivalCity: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100],
        },
    },
    arrivalCountry: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100],
        },
    },
    arrivalAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    arrivalLat: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: false,
        validate: {
            min: -90,
            max: 90,
        },
    },
    arrivalLng: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: false,
        validate: {
            min: -180,
            max: 180,
        },
    },
    departureLocation: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        field: 'departure_location',
    },
    arrivalLocation: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        field: 'arrival_location',
    },
    departureDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfter: new Date().toISOString(),
        },
    },
    arrivalDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
        },
    },
    flexibleDates: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    transportMode: {
        type: sequelize_1.DataTypes.ENUM('car', 'train', 'plane', 'bus'),
        allowNull: false,
    },
    transportDetails: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    capacityKg: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false, // Changé temporairement en true
        defaultValue: 10,
        validate: {
            min: 0.1,
            max: 100,
        },
    },
    reservedWeight: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    availableWeight: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    pricePerKg: {
        type: sequelize_1.DataTypes.DECIMAL(6, 2),
        allowNull: false,
        validate: {
            min: 1,
            max: 1000,
        },
    },
    maxItemSize: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [5, 100],
        },
    },
    allowedItems: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    forbiddenItems: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: ['liquides', 'fragile', 'electronique'],
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'published', 'full', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: trip_1.TripStatus.DRAFT,
    },
    tripType: {
        type: sequelize_1.DataTypes.ENUM('domestic', 'international'),
        allowNull: false,
    },
    totalBookings: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    totalRevenue: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    publishedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'Trip',
    tableName: 'trips',
    hooks: {
        beforeCreate: (trip) => {
            // Définir le type de voyage
            if (trip.departureCountry !== trip.arrivalCountry) {
                trip.tripType = trip_1.TripType.INTERNATIONAL;
            }
            else {
                trip.tripType = trip_1.TripType.DOMESTIC;
            }
            // Initialiser availableWeight avec capacityKg
            if (!trip.availableWeight) {
                trip.availableWeight = trip.capacityKg;
            }
        },
        beforeUpdate: (trip) => {
            if (trip.changed('status') && trip.status === trip_1.TripStatus.PUBLISHED && !trip.publishedAt) {
                trip.publishedAt = new Date();
            }
            // Recalculer availableWeight si capacityKg ou reservedWeight change
            if (trip.changed('capacityKg') || trip.changed('reservedWeight')) {
                trip.availableWeight = trip.capacityKg - trip.reservedWeight;
            }
            // Changer le statut en 'full' si plus de capacité
            if (trip.availableWeight <= 0 && trip.status === trip_1.TripStatus.PUBLISHED) {
                trip.status = trip_1.TripStatus.FULL;
            }
            // Remettre en 'published' si de la capacité se libère
            if (trip.availableWeight > 0 && trip.status === trip_1.TripStatus.FULL) {
                trip.status = trip_1.TripStatus.PUBLISHED;
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
