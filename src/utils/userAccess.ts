import { User } from '../models/User';

export interface UserAccessInfo {
  level: 'basic' | 'verified' | 'admin';
  canCreateTrip: boolean;
  canBookTrip: boolean;
  canChat: boolean;
  verificationRequired: boolean;
  verificationStatus: string;
  permissions: string[];
}

export const getUserAccessInfo = (user?: User): UserAccessInfo => {
  if (!user) {
    return {
      level: 'basic',
      canCreateTrip: false,
      canBookTrip: false,
      canChat: false,
      verificationRequired: true,
      verificationStatus: 'unverified',
      permissions: ['view_trips'],
    };
  }

  const isVerified = user.canCreateTrip();
  const level = user.role === 'admin' ? 'admin' : (isVerified ? 'verified' : 'basic');
  
  const permissions = ['view_trips'];
  if (isVerified) {
    permissions.push('create_trip', 'book_trip', 'chat');
  }
  if (user.role === 'admin') {
    permissions.push('admin_access');
  }

  return {
    level,
    canCreateTrip: user.canCreateTrip(),
    canBookTrip: user.canBookTrip(),
    canChat: user.canChat(),
    verificationRequired: !isVerified,
    verificationStatus: user.verificationStatus,
    permissions,
  };
};