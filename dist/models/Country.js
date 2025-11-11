"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Country = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Country extends sequelize_1.Model {
    getTranslatedName(lang) {
        const nameMap = {
            fr: this.nameFr,
            en: this.nameEn,
            de: this.nameDe,
            es: this.nameEs,
            it: this.nameIt
        };
        return nameMap[lang] || this.nameEn;
    }
}
exports.Country = Country;
Country.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: sequelize_1.DataTypes.STRING(2),
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 2],
            isUppercase: true,
        },
    },
    value: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    nameFr: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'name_fr',
    },
    nameEn: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'name_en',
    },
    nameDe: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'name_de',
    },
    nameEs: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'name_es',
    },
    nameIt: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'name_it',
    },
    isEurozone: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_eurozone',
    },
    phonePrefix: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
        field: 'phone_prefix',
    },
    postalCodeFormat: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        field: 'postal_code_format',
    },
    stripeSupported: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'stripe_supported',
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'Country',
    tableName: 'countries',
    timestamps: true,
    underscored: true, // ← AJOUTER CETTE LIGNE
    indexes: [
        { fields: ['code'], unique: true },
        { fields: ['value'], unique: true },
        { fields: ['is_eurozone'] },
    ],
});
