"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = exports.LocationType = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Country_1 = require("./Country");
var LocationType;
(function (LocationType) {
    LocationType["WILAYA"] = "wilaya";
    LocationType["DEPARTMENT"] = "department";
    LocationType["PROVINCE"] = "province";
    LocationType["LAND"] = "land";
    LocationType["DISTRICT"] = "district";
    LocationType["REGION"] = "region";
    LocationType["CITY"] = "city";
})(LocationType || (exports.LocationType = LocationType = {}));
class Location extends sequelize_1.Model {
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
exports.Location = Location;
Location.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    countryCode: {
        type: sequelize_1.DataTypes.STRING(2),
        allowNull: false,
        field: 'country_code',
        references: {
            model: 'countries',
            key: 'code',
        },
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(LocationType)),
        allowNull: false,
    },
    value: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    code: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: true,
        comment: 'Code officiel (ex: 16 pour Alger, 75 pour Paris)',
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
    population: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    latitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    longitude: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'Location',
    tableName: 'locations',
    timestamps: true,
    underscored: true, // ← AJOUTER CETTE LIGNE
    indexes: [
        { fields: ['country_code'] },
        { fields: ['type'] },
        { fields: ['country_code', 'value'] },
        { fields: ['code'] },
    ],
});
// Relations
Location.belongsTo(Country_1.Country, {
    foreignKey: 'countryCode',
    targetKey: 'code',
    as: 'country',
});
Country_1.Country.hasMany(Location, {
    foreignKey: 'countryCode',
    sourceKey: 'code',
    as: 'locations',
});
