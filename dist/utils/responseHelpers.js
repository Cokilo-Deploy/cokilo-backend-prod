"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLocalizedError = exports.sendLocalizedResponse = void 0;
const TranslationService_1 = require("../services/TranslationService");
const sendLocalizedResponse = (res, messageKey, data, statusCode = 200, user, req) => {
    const locale = TranslationService_1.translationService.getLocaleForContext(user);
    const currency = user?.currency || 'EUR';
    console.log('=== RESPONSE HELPERS ===');
    console.log('Locale détecté:', locale);
    console.log('Message key:', messageKey);
    return res.status(statusCode).json({
        success: statusCode < 400,
        message: TranslationService_1.translationService.t(messageKey, user, undefined),
        messageKey: String(messageKey),
        data,
        locale,
        currency
    });
};
exports.sendLocalizedResponse = sendLocalizedResponse;
const sendLocalizedError = (res, messageKey, statusCode = 400, user) => {
    return (0, exports.sendLocalizedResponse)(res, messageKey, null, statusCode, user);
};
exports.sendLocalizedError = sendLocalizedError;
