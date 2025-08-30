"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPresence = void 0;
//src/models/UserPresence.ts
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class UserPresence extends sequelize_1.Model {
}
exports.UserPresence = UserPresence;
UserPresence.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    socketId: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    isOnline: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    lastSeen: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    deviceInfo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'UserPresence',
    tableName: 'user_presence',
    indexes: [
        {
            fields: ['userId'],
        },
        {
            fields: ['socketId'],
        },
        {
            fields: ['isOnline'],
        },
    ],
});
