// src/utils/responseHelpers.ts - Version corrigée
import { Response } from 'express';
import { translationService } from '../services/TranslationService';
import { AppTranslations } from '../types/translations';
import { User } from '../models/User';

interface LocalizedResponse {
  success: boolean;
  message: string;
  messageKey?: string;
  data?: any;
  locale: string;
  currency?: string;
}

export const sendLocalizedResponse = (
  res: Response, 
  messageKey: keyof AppTranslations,
  data?: any,
  statusCode: number = 200,
  user?: User,
  guestCountry?: string
): Response<LocalizedResponse> => {
  const locale = translationService.getLocaleForContext(user, guestCountry);
  const currency = user?.currency || 'EUR'; // Ta logique existante
  
  return res.status(statusCode).json({
    success: statusCode < 400,
    message: translationService.t(messageKey, user, guestCountry),
    messageKey: String(messageKey),
    data,
    locale,
    currency
  });
};

export const sendLocalizedError = (
  res: Response,
  messageKey: keyof AppTranslations,
  statusCode: number = 400,
  user?: User,
  guestCountry?: string
): Response<LocalizedResponse> => {
  return sendLocalizedResponse(res, messageKey, null, statusCode, user, guestCountry);
};

export { translationService } from '../services/TranslationService';