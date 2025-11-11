"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
// src/models/Notification.ts
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Notification extends sequelize_1.Model {
}
exports.Notification = Notification;
Notification.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    type: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    body: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    data: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    readAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdAt: '',
    updatedAt: ''
}, {
    sequelize: database_1.sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
});
