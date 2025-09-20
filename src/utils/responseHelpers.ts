// 3. CORRIGER src/utils/responseHelpers.ts - Version propre
import { Response } from 'express';
import { AppTranslations } from '../types/translations';
import { User } from '../models/User';
import { translationService } from '../services/TranslationService';

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
  req?: any
): Response<LocalizedResponse> => {
  const acceptLanguage = req?.headers['accept-language'] as string;
  const locale = translationService.getLocaleForContext(user, acceptLanguage);
  const currency = user?.currency || 'EUR';
  
  console.log('=== RESPONSE HELPERS ===');
  console.log('Accept-Language:', acceptLanguage);
  console.log('Locale détecté:', locale);
  console.log('Message key:', messageKey);
  
  return res.status(statusCode).json({
    success: statusCode < 400,
    message: translationService.t(messageKey, user, undefined, acceptLanguage),
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
  user?: User
): Response<LocalizedResponse> => {
  return sendLocalizedResponse(res, messageKey, null, statusCode, user);
};
