"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Wallet extends sequelize_1.Model {
}
exports.Wallet = Wallet;
Wallet.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
    },
    balance: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        defaultValue: 'EUR',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'wallets',
    underscored: true,
});
