import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ReviewAttributes {
  id: number;
  transactionId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewCreationAttributes extends Optional<ReviewAttributes, 
  'id' | 'isPublic' | 'createdAt' | 'updatedAt'> {}

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public id!: number;
  public transactionId!: number;
  public reviewerId!: number;
  public revieweeId!: number;
  public rating!: number;
  public comment?: string;
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reviewerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    revieweeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      {
        fields: ['transactionId'],
      },
      {
        fields: ['reviewerId'],
      },
      {
        fields: ['revieweeId'],
      },
      {
        fields: ['transactionId', 'reviewerId'],
        unique: true,
      },
    ],
  }
);

export { Review, ReviewAttributes, ReviewCreationAttributes };