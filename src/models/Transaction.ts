//src/models/Transaction.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { TransactionStatus, PackageType } from '../types/transaction';
import crypto from 'crypto';

interface TransactionAttributes {
  id: number;
  
  travelerId: number;
  senderId: number;
  tripId: number;
  
  amount: number;
  serviceFee: number;
  travelerAmount: number;
  currency: string;
  
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  
  deliveryCode: string;
  pickupCode: string;
  
  packageDescription: string;
  packageType: PackageType;
  packageWeight: number;
  packageValue?: number;
  packagePhotos: string[];
  
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupDate?: Date;
  pickupNotes?: string;
  
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryDate?: Date;
  deliveryNotes?: string;
  
  status: TransactionStatus;
  statusHistory: any[];
  
  insuranceCoverage: number;
  requiresSignature: boolean;
  
  notes?: string;
  internalNotes?: string;
  
  pickedUpAt?: Date;
  deliveredAt?: Date;
  paymentReleasedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  cancellationReason?: string;
  
  // AJOUT - Nouvelles propriétés pour les avis
  senderReviewed: boolean;    // L'expéditeur a-t-il donné son avis
  travelerReviewed: boolean;  // Le voyageur a-t-il donné son avis
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 
  'id' | 'serviceFee' | 'travelerAmount' | 'currency' | 'deliveryCode' | 'pickupCode' | 
  'status' | 'statusHistory' | 'insuranceCoverage' | 'requiresSignature' | 'cancellationReason'| 
  'senderReviewed' | 'travelerReviewed'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  
  public travelerId!: number;
  public senderId!: number;
  public tripId!: number;
  
  public amount!: number;
  public serviceFee!: number;
  public travelerAmount!: number;
  public currency!: string;
  
  public stripePaymentIntentId!: string;
  public stripeTransferId?: string;
  
  public deliveryCode!: string;
  public pickupCode!: string;
  
  public packageDescription!: string;
  public packageType!: PackageType;
  public packageWeight!: number;
  public packageValue?: number;
  public packagePhotos!: string[];
  
  public pickupAddress!: string;
  public pickupLat?: number;
  public pickupLng?: number;
  public pickupDate?: Date;
  public pickupNotes?: string;
  
  public deliveryAddress!: string;
  public deliveryLat?: number;
  public deliveryLng?: number;
  public deliveryDate?: Date;
  public deliveryNotes?: string;
  
  public status!: TransactionStatus;
  public statusHistory!: any[];
  
  public insuranceCoverage!: number;
  public requiresSignature!: boolean;
  
  public notes?: string;
  public internalNotes?: string;
  
  public pickedUpAt?: Date;
  public deliveredAt?: Date;
  public paymentReleasedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  traveler: any;

  public cancellationReason?: string;

  public senderReviewed!: boolean;
  public travelerReviewed!: boolean;
  sender: any;

  public canBePickedUp(): boolean {
    return this.status === TransactionStatus.PAYMENT_ESCROWED;
  }

  public canBeDelivered(): boolean {
    return this.status === TransactionStatus.PACKAGE_PICKED_UP;
  }

  public canBeCompleted(): boolean {
    return this.status === TransactionStatus.PACKAGE_DELIVERED;
  }

  public getStatusHistory(): any[] {
    return this.statusHistory || [];
  }

  public addStatusChange(newStatus: TransactionStatus, notes?: string) {
    const statusChange = {
      status: newStatus,
      timestamp: new Date(),
      notes,
    };
    this.statusHistory = [...this.getStatusHistory(), statusChange];
  }
}

Transaction.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  travelerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tripId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 1,
      max: 10000,
    },
  },
  serviceFee: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  travelerAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: true,
    defaultValue: 'EUR',
    validate: {
      isIn: [['EUR', 'USD', 'GBP', 'CAD', 'CHF']],
    },
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  stripeTransferId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deliveryCode: {
    type: DataTypes.STRING(8),
    allowNull: false,
  },
  pickupCode: {
    type: DataTypes.STRING(8),
    allowNull: false,
  },
  packageDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 500],
    },
  },
  packageType: {
    type: DataTypes.ENUM('documents', 'clothes', 'electronics', 'food', 'gifts', 'books', 'other'),
    allowNull: false,
  },
  packageWeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0.1,
      max: 50,
    },
  },
  packageValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  packagePhotos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  },
  pickupAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pickupLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  pickupLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  pickupDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  pickupNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deliveryAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deliveryLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  deliveryLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deliveryNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('payment_pending', 'payment_escrowed', 'package_picked_up', 'package_delivered', 'payment_released', 'cancelled', 'disputed', 'refunded'),
    allowNull: false,
    defaultValue: TransactionStatus.PAYMENT_PENDING,
  },
  statusHistory: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  insuranceCoverage: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 100,
    validate: {
      min: 0,
    },
  },
  requiresSignature: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  internalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pickedUpAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paymentReleasedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancellationReason: {
  type: DataTypes.TEXT,
  allowNull: true,
},
  
  senderReviewed: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},
travelerReviewed: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},
}, {
  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  hooks: {
    beforeCreate: (transaction: Transaction) => {
      if (!transaction.deliveryCode) {
        transaction.deliveryCode = generateCode();
      }
      if (!transaction.pickupCode) {
        transaction.pickupCode = generateCode();
      }
      
      if (!transaction.serviceFee) {
        transaction.serviceFee = parseFloat((transaction.amount * 0.10).toFixed(2));
      }
      
      if (!transaction.travelerAmount) {
        transaction.travelerAmount = parseFloat((transaction.amount - transaction.serviceFee).toFixed(2));
      }
      
      transaction.addStatusChange(transaction.status, 'Transaction créée');
    },
    beforeUpdate: (transaction: Transaction) => {
      if (transaction.changed('status')) {
        transaction.addStatusChange(transaction.status);
        
        const now = new Date();
        switch (transaction.status) {
          case TransactionStatus.PACKAGE_PICKED_UP:
            transaction.pickedUpAt = now;
            break;
          case TransactionStatus.PACKAGE_DELIVERED:
            transaction.deliveredAt = now;
            break;
          case TransactionStatus.PAYMENT_RELEASED:
            transaction.paymentReleasedAt = now;
            break;
        }
        // AJOUT : Notification automatique
      setTimeout(() => {
        const { NotificationService } = require('../services/NotificationService');
        NotificationService.notifyTransactionUpdate(transaction);
      }, 100);
      }
    },
  },
  indexes: [
    {
      fields: ['travelerId'],
    },
    {
      fields: ['senderId'],
    },
    {
      fields: ['tripId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['stripePaymentIntentId'],
      unique: true,
    },
  ],
});

function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export { Transaction, TransactionAttributes, TransactionCreationAttributes };