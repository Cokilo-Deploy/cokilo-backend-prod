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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
        return bcryptjs_1.default.compare(password, this.password);
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
        allowNull: false,
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
            isIn: [['EUR', 'USD', 'GBP', 'CAD', 'CHF']],
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
}, {
    sequelize: database_1.sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcryptjs_1.default.hash(user.password, 12);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcryptjs_1.default.hash(user.password, 12);
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
            fields: ['verificationStatus'],
        },
    ],
});
