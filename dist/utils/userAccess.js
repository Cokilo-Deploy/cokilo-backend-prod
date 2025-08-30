"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAccessInfo = void 0;
const getUserAccessInfo = (user) => {
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
exports.getUserAccessInfo = getUserAccessInfo;
