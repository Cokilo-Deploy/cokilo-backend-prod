// src/models/Notification.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NotificationAttributes {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  data?: object;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 
  'id' | 'data' | 'readAt' | 'createdAt' | 'updatedAt'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> 
  implements NotificationAttributes {
  
  public id!: number;
  public userId!: number;
  public type!: string;
  public title!: string;
  public body!: string;
  public data?: object;
  public isRead!: boolean;
  public readAt?: Date;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
      id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
      },
      userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
              model: 'users',
              key: 'id'
          }
      },
      type: {
          type: DataTypes.STRING(50),
          allowNull: false,
      },
      title: {
          type: DataTypes.STRING(255),
          allowNull: false,
      },
      body: {
          type: DataTypes.TEXT,
          allowNull: false,
      },
      data: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
      },
      isRead: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
      },
      readAt: {
          type: DataTypes.DATE,
          allowNull: true,
      },
      createdAt: '',
      updatedAt: ''
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
  }
);

export { Notification };