"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserVerificationStatus = exports.User = void 0;
//src//models/User.ts
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const user_1 = require("../types/user");
Object.defineProperty(exports, "UserVerificationStatus", { enumerable: true, get: function () { return user_1.UserVerificationStatus; } });
const bcrypt_1 = __importDefault(require("bcrypt"));
class User extends sequelize_1.Model {
    canViewTrips() {
        return this.isActive && this.verificationStatus !== user_1.UserVerificationStatus.SUSPENDED;
    }
    canCreateTrip() {
        return this.canViewTrips() && this.verificationStatus === user_1.UserVerificationStatus.VERIFIED;
    }
    canBookTrip() {
        return this.canViewTrips() && this.verificationStatus === user_1.UserVerificationStatus.VERIFIED;
    }
    canChat() {
        return this.verificationStatus === user_1.UserVerificationStatus.VERIFIED;
    }
    canUseStripeConnect() {
        return this.paymentMethod === 'stripe_connect' &&
            this.stripeConnectedAccountId !== null &&
            ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT'].includes(this.country || '');
    }
    getRecommendedPaymentMethod() {
        const euCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'LU', 'FI', 'IE', 'GR'];
        return euCountries.includes(this.country || '') ? 'stripe_connect' : 'manual';
    }
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    getPublicProfile() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName.charAt(0) + '.',
            avatar: this.avatar,
            rating: this.rating,
            totalTrips: this.totalTrips,
            totalDeliveries: this.totalDeliveries,
            verificationStatus: this.verificationStatus,
            memberSince: this.createdAt,
        };
    }
    async validatePassword(password) {
        return bcrypt_1.default.compare(password, this.password);
    }
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            len: [5, 255],
        },
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 255],
        },
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50],
        },
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50],
        },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: {
            name: 'unique_phone',
            msg: 'Ce numéro de téléphone est déjà utilisé'
        },
        validate: {
            len: [10, 20],
        },
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    verificationStatus: {
        type: sequelize_1.DataTypes.ENUM('unverified', 'pending', 'verified', 'failed', 'suspended'),
        allowNull: false,
        defaultValue: user_1.UserVerificationStatus.UNVERIFIED,
    },
    stripeIdentitySessionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    stripeCustomerId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    stripeConnectedAccountId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'stripeconnectedaccountid' // AJOUTER cette ligne
    },
    country: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: true,
        validate: {
            isIn: [['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'DZ', 'MA', 'TN', 'US', 'GB', 'CA']],
        },
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('manual', 'stripe_connect'),
        allowNull: false,
        defaultValue: 'manual',
        field: 'paymentmethod' // AJOUTER cette ligne
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: user_1.UserRole.USER,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    rating: {
        type: sequelize_1.DataTypes.DECIMAL(2, 1),
        defaultValue: 5.0,
        validate: {
            min: 0,
            max: 5,
        },
    },
    totalTrips: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    totalDeliveries: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    totalEarnings: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    language: {
        type: sequelize_1.DataTypes.STRING(5),
        defaultValue: 'fr',
        validate: {
            isIn: [['fr', 'en', 'es', 'de', 'it']],
        },
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        defaultValue: 'EUR',
        validate: {
            isIn: [['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'DZD', 'MAD', 'TND', 'EGP', 'SAR', 'AED']],
        },
    },
    timezone: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'Europe/Paris',
    },
    notificationsEnabled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    emailVerifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    phoneVerifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    identityVerifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    profileName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        validate: {
            len: [2, 50],
        },
    },
    addressLine1: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        field: 'address_line1'
    },
    addressCity: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        field: 'address_city'
    },
    addressPostalCode: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        field: 'address_postal_code'
    },
    dateOfBirth: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth'
    },
    stripeTermsAccepted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'stripe_terms_accepted'
    },
    stripeTermsAcceptedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'stripe_terms_accepted_at'
    },
    pushToken: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    deviceType: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'unknown'
    },
    verificationCode: {
        type: sequelize_1.DataTypes.STRING(6),
        allowNull: true,
        field: 'verificationcode'
    },
    verificationCodeExpires: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'verificationcodeexpires'
    },
    resetPasswordToken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    resetPasswordExpiry: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt_1.default.hash(user.password, 12);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt_1.default.hash(user.password, 12);
            }
        },
    },
    indexes: [
        {
            fields: ['email'],
            unique: true,
        },
        {
            fields: ['stripeCustomerId'],
            unique: true,
            where: {
                stripeCustomerId: {
                    [sequelize_1.Op.ne]: null,
                },
            },
        },
        {
            fields: ['stripeConnectedAccountId'],
            unique: true,
            where: {
                stripeConnectedAccountId: {
                    [sequelize_1.Op.ne]: null,
                },
            },
        },
        {
            fields: ['country'],
        },
        {
            fields: ['paymentMethod'],
        },
        {
            fields: ['verificationStatus'],
        },
        {
            fields: ['phone'],
            unique: true,
            where: {
                phone: {
                    [sequelize_1.Op.ne]: null,
                },
            },
        },
    ],
});
