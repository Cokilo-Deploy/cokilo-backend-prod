import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Wallet extends Model {
  public id!: number;
  public userId!: number;
  public balance!: number;
  public currency!: string;
}

Wallet.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'EUR',
  },
}, {
  sequelize,
  tableName: 'wallets',
  underscored: true,
});