"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
//src/models/Transaction.ts
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const transaction_1 = require("../types/transaction");
const crypto_1 = __importDefault(require("crypto"));
class Transaction extends sequelize_1.Model {
    canBePickedUp() {
        return this.status === transaction_1.TransactionStatus.PAYMENT_ESCROWED;
    }
    canBeDelivered() {
        return this.status === transaction_1.TransactionStatus.PACKAGE_PICKED_UP;
    }
    canBeCompleted() {
        return this.status === transaction_1.TransactionStatus.PACKAGE_DELIVERED;
    }
    getStatusHistory() {
        return this.statusHistory || [];
    }
    addStatusChange(newStatus, notes) {
        const statusChange = {
            status: newStatus,
            timestamp: new Date(),
            notes,
        };
        this.statusHistory = [...this.getStatusHistory(), statusChange];
    }
}
exports.Transaction = Transaction;
Transaction.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    travelerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    senderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    tripId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 1,
            max: 10000,
        },
    },
    serviceFee: {
        type: sequelize_1.DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    travelerAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'EUR',
        validate: {
            isIn: [['EUR', 'USD', 'GBP', 'CAD', 'CHF']],
        },
    },
    stripePaymentIntentId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    stripeTransferId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    deliveryCode: {
        type: sequelize_1.DataTypes.STRING(8),
        allowNull: false,
    },
    pickupCode: {
        type: sequelize_1.DataTypes.STRING(8),
        allowNull: false,
    },
    packageDescription: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [10, 500],
        },
    },
    packageType: {
        type: sequelize_1.DataTypes.ENUM('documents', 'clothes', 'electronics', 'food', 'gifts', 'books', 'other'),
        allowNull: false,
    },
    packageWeight: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0.1,
        },
    },
    packageValue: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    packagePhotos: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    pickupAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    pickupLat: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    pickupLng: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    pickupDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    pickupNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    deliveryAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    deliveryLat: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    deliveryLng: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    deliveryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    deliveryNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('payment_pending', 'payment_escrowed', 'package_picked_up', 'package_delivered', 'payment_released', 'cancelled', 'disputed', 'refunded'),
        allowNull: false,
        defaultValue: transaction_1.TransactionStatus.PAYMENT_PENDING,
    },
    statusHistory: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    insuranceCoverage: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 100,
        validate: {
            min: 0,
        },
    },
    requiresSignature: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    internalNotes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    pickedUpAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    deliveredAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    paymentReleasedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    cancellationReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    senderReviewed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    travelerReviewed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    hooks: {
        beforeCreate: (transaction) => {
            if (!transaction.deliveryCode) {
                transaction.deliveryCode = generateCode();
            }
            if (!transaction.pickupCode) {
                transaction.pickupCode = generateCode();
            }
            if (!transaction.serviceFee) {
                transaction.serviceFee = parseFloat((transaction.amount * 0.30).toFixed(2));
            }
            if (!transaction.travelerAmount) {
                transaction.travelerAmount = parseFloat((transaction.amount - transaction.serviceFee).toFixed(2));
            }
            transaction.addStatusChange(transaction.status, 'Transaction créée');
        },
        beforeUpdate: (transaction) => {
            if (transaction.changed('status')) {
                transaction.addStatusChange(transaction.status);
                const now = new Date();
                switch (transaction.status) {
                    case transaction_1.TransactionStatus.PACKAGE_PICKED_UP:
                        transaction.pickedUpAt = now;
                        break;
                    case transaction_1.TransactionStatus.PACKAGE_DELIVERED:
                        transaction.deliveredAt = now;
                        break;
                    case transaction_1.TransactionStatus.PAYMENT_RELEASED:
                        transaction.paymentReleasedAt = now;
                        break;
                }
                // AJOUT : Notification automatique
                setTimeout(() => {
                    const { NotificationService } = require('../services/NotificationService');
                    NotificationService.notifyTransactionUpdate(transaction);
                }, 100);
            }
        },
    },
    indexes: [
        {
            fields: ['travelerId'],
        },
        {
            fields: ['senderId'],
        },
        {
            fields: ['tripId'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['stripePaymentIntentId'],
            unique: true,
        },
    ],
});
function generateCode() {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
}
