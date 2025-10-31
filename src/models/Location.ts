import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Country } from './Country';

export enum LocationType {
  WILAYA = 'wilaya',
  DEPARTMENT = 'department',
  PROVINCE = 'province',
  LAND = 'land',
  DISTRICT = 'district',
  REGION = 'region',
  CITY = 'city'
}

interface LocationAttributes {
  id: number;
  countryCode: string;
  type: LocationType;
  value: string;
  code?: string;
  nameFr: string;
  nameEn: string;
  nameDe: string;
  nameEs: string;
  nameIt: string;
  population?: number;
  latitude?: number;
  longitude?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LocationCreationAttributes extends Optional<LocationAttributes, 
  'id' | 'code' | 'population' | 'latitude' | 'longitude'> {}

class Location extends Model<LocationAttributes, LocationCreationAttributes> implements LocationAttributes {
  public id!: number;
  public countryCode!: string;
  public type!: LocationType;
  public value!: string;
  public code?: string;
  public nameFr!: string;
  public nameEn!: string;
  public nameDe!: string;
  public nameEs!: string;
  public nameIt!: string;
  public population?: number;
  public latitude?: number;
  public longitude?: number;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getTranslatedName(lang: 'fr' | 'en' | 'de' | 'es' | 'it'): string {
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

Location.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  countryCode: {
    type: DataTypes.STRING(2),
    allowNull: false,
    field: 'country_code',
    references: {
      model: 'countries',
      key: 'code',
    },
  },
  type: {
    type: DataTypes.ENUM(...Object.values(LocationType)),
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Code officiel (ex: 16 pour Alger, 75 pour Paris)',
  },
  nameFr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_fr',
  },
  nameEn: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_en',
  },
  nameDe: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_de',
  },
  nameEs: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_es',
  },
  nameIt: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_it',
  },
  population: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Location',
  tableName: 'locations',
  timestamps: true,
  underscored: true,  // ← AJOUTER CETTE LIGNE
  indexes: [
    { fields: ['country_code'] },
    { fields: ['type'] },
    { fields: ['country_code', 'value'] },
    { fields: ['code'] },
  ],
});

// Relations
Location.belongsTo(Country, {
  foreignKey: 'countryCode',
  targetKey: 'code',
  as: 'country',
});

Country.hasMany(Location, {
  foreignKey: 'countryCode',
  sourceKey: 'code',
  as: 'locations',
});

export { Location, LocationAttributes, LocationCreationAttributes };