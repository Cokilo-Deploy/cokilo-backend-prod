import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CountryAttributes {
  id: number;
  code: string;
  value: string;
  nameFr: string;
  nameEn: string;
  nameDe: string;
  nameEs: string;
  nameIt: string;
  isEurozone: boolean;
  phonePrefix: string;
  postalCodeFormat?: string;
  stripeSupported: boolean;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CountryCreationAttributes extends Optional<CountryAttributes, 
  'id' | 'isEurozone' | 'postalCodeFormat' | 'stripeSupported'> {}

class Country extends Model<CountryAttributes, CountryCreationAttributes> implements CountryAttributes {
  public id!: number;
  public code!: string;
  public value!: string;
  public nameFr!: string;
  public nameEn!: string;
  public nameDe!: string;
  public nameEs!: string;
  public nameIt!: string;
  public isEurozone!: boolean;
  public phonePrefix!: string;
  public postalCodeFormat?: string;
  public stripeSupported!: boolean;
  public currency!: string;
  
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

Country.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(2),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 2],
      isUppercase: true,
    },
  },
  value: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
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
  isEurozone: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_eurozone',
  },
  phonePrefix: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'phone_prefix',
  },
  postalCodeFormat: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'postal_code_format',
  },
  stripeSupported: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'stripe_supported',
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR',
  },
}, {
  sequelize,
  modelName: 'Country',
  tableName: 'countries',
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['value'], unique: true },
    { fields: ['is_eurozone'] },
  ],
});

export { Country, CountryAttributes, CountryCreationAttributes };