//src/models/UserPresence.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserPresenceAttributes {
  id: number;
  userId: number;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
  deviceInfo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserPresenceCreationAttributes extends Optional<UserPresenceAttributes, 
  'id' | 'isOnline'> {}

class UserPresence extends Model<UserPresenceAttributes, UserPresenceCreationAttributes> 
  implements UserPresenceAttributes {
  public id!: number;
  public userId!: number;
  public socketId!: string;
  public isOnline!: boolean;
  public lastSeen!: Date;
  public deviceInfo?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Relations
  public readonly user?: any;
}

UserPresence.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  socketId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  deviceInfo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
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

export { UserPresence, UserPresenceAttributes, UserPresenceCreationAttributes };
