// backend/src/utils/errorCodes.ts

export enum ErrorCode {
  // Authentification
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Ressources introuvables
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  TRIP_NOT_FOUND = 'TRIP_NOT_FOUND',
  REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND',
  
  // Validation
  TRANSACTION_NOT_COMPLETED = 'TRANSACTION_NOT_COMPLETED',
  REVIEW_ALREADY_EXISTS = 'REVIEW_ALREADY_EXISTS',
  PROFILE_NAME_LENGTH = 'PROFILE_NAME_LENGTH',
  PROFILE_NAME_ALREADY_USED = 'PROFILE_NAME_ALREADY_USED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_INPUT = 'INVALID_INPUT',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  
  // Serveur
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// Helper pour retourner des erreurs standardisées
export const errorResponse = (code: ErrorCode) => {
  return {
    success: false,
    errorCode: code
  };
};

// Helper pour les succès
export const successResponse = (data?: any, message?: string) => {
  return {
    success: true,
    data,
    message: message || 'SUCCESS'
  };
};