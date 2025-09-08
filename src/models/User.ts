//src//models/User.ts
import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';
import { UserVerificationStatus, UserRole } from '../types/user';
import bcrypt from 'bcryptjs';

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileName?: string;
  phone: string;
  avatar?: string;
 
  
  verificationStatus: UserVerificationStatus;
  stripeIdentitySessionId?: string;
  stripeCustomerId?: string;
  stripeConnectedAccountId?: string;
  country?: string;
  paymentMethod: 'manual' | 'stripe_connect';
  
  role: UserRole;
  isActive: boolean;
  rating: number;
  totalTrips: number;
  totalDeliveries: number;
  totalEarnings: number;
  
  language: string;
  currency: string;
  timezone: string;
  notificationsEnabled: boolean;
  
  // Nouvelles propriétés ajoutées
  addressLine1?: string;
  addressCity?: string;
  addressPostalCode?: string;
  dateOfBirth?: Date;
  stripeTermsAccepted?: boolean;
  stripeTermsAcceptedAt?: Date;
  
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  identityVerifiedAt?: Date;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'verificationStatus' | 'role' | 'isActive' | 'rating' | 'totalTrips' | 
  'totalDeliveries' | 'totalEarnings' | 'language' | 'currency' | 'timezone' | 
  'notificationsEnabled' | 'paymentMethod' | 'stripeTermsAccepted' | 'stripeTermsAcceptedAt' |
  'addressLine1' | 'addressCity' | 'addressPostalCode' | 'dateOfBirth'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public phone!: string;
  public avatar?: string;
   
  
  public verificationStatus!: UserVerificationStatus;
  public stripeIdentitySessionId?: string;
  public stripeCustomerId?: string;
  public stripeConnectedAccountId?: string;
  public country?: string;
  public paymentMethod!: 'manual' | 'stripe_connect';
  
  public role!: UserRole;
  public isActive!: boolean;
  public rating!: number;
  public totalTrips!: number;
  public totalDeliveries!: number;
  public totalEarnings!: number;
  
  public language!: string;
  public currency!: string;
  public timezone!: string;
  public notificationsEnabled!: boolean;
  
  // Nouvelles propriétés
  public addressLine1?: string;
  public addressCity?: string;
  public addressPostalCode?: string;
  public dateOfBirth?: Date;
  public stripeTermsAccepted?: boolean;
  public stripeTermsAcceptedAt?: Date;
  
  public emailVerifiedAt?: Date;
  public phoneVerifiedAt?: Date;
  public identityVerifiedAt?: Date;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public profileName?: string;

  public canViewTrips(): boolean {
    return this.isActive && this.verificationStatus !== UserVerificationStatus.SUSPENDED;
  }

  public canCreateTrip(): boolean {
    return this.canViewTrips() && this.verificationStatus === UserVerificationStatus.VERIFIED;
  }

  public canBookTrip(): boolean {
    return this.canViewTrips() && this.verificationStatus === UserVerificationStatus.VERIFIED;
  }

  public canChat(): boolean {
    return this.verificationStatus === UserVerificationStatus.VERIFIED;
  }

  public canUseStripeConnect(): boolean {
    return this.paymentMethod === 'stripe_connect' && 
           this.stripeConnectedAccountId !== null &&
           ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT'].includes(this.country || '');
  }

  public getRecommendedPaymentMethod(): 'manual' | 'stripe_connect' {
    const euCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'LU', 'FI', 'IE', 'GR'];
    return euCountries.includes(this.country || '') ? 'stripe_connect' : 'manual';
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public getPublicProfile() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName.charAt(0) + '.',
      avatar: this.avatar,
      rating: this.rating,
      totalTrips: this.totalTrips,
      totalDeliveries: this.totalDeliveries,
      verificationStatus: this.verificationStatus,
      memberSince: this.createdAt,
    };
  }

  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [5, 255],
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255],
    },
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50],
    },
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50],
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [10, 20],
    },
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },  
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified', 'failed', 'suspended'),
    allowNull: false,
    defaultValue: UserVerificationStatus.UNVERIFIED,
  },
  stripeIdentitySessionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  stripeConnectedAccountId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  country: {
    type: DataTypes.STRING(3),
    allowNull: true,
    validate: {
      isIn: [['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'DZ', 'MA', 'TN', 'US', 'GB', 'CA']],
    },
  },
  paymentMethod: {
    type: DataTypes.ENUM('manual', 'stripe_connect'),
    allowNull: false,
    defaultValue: 'manual',
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: UserRole.USER,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 5.0,
    validate: {
      min: 0,
      max: 5,
    },
  },
  totalTrips: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  totalDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  totalEarnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'fr',
    validate: {
      isIn: [['fr', 'en', 'es', 'de', 'it']],
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'EUR',
    validate: {
      isIn: [['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'DZD', 'MAD', 'TND', 'EGP', 'SAR', 'AED']],
    },
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'Europe/Paris',
  },
  notificationsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  phoneVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  identityVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  profileName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      len: [2, 50],
    },
  },
  addressLine1: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'address_line1'
  },
  addressCity: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'address_city'
  },
  addressPostalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'address_postal_code'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth'
  },
  stripeTermsAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'stripe_terms_accepted'
  },
  stripeTermsAcceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'stripe_terms_accepted_at'
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
  indexes: [
    {
      fields: ['email'],
      unique: true,
    },
    {
      fields: ['stripeCustomerId'],
      unique: true,
      where: {
        stripeCustomerId: {
          [Op.ne]: null,
        },
      },
    },
    {
      fields: ['stripeconnectedaccountid'],
      unique: true,
      where: {
        stripeconnectedaccountid: {
          [Op.ne]: null,
        },
      },
    },
    {
      fields: ['country'],
    },
    {
      fields: ['paymentmethod'],
    },
    {
      fields: ['verificationStatus'],
    },
  ],
});

export { User, UserAttributes, UserCreationAttributes, UserVerificationStatus };