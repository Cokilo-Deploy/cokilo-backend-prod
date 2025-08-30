// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // Erreurs de validation Sequelize
  if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Données invalides';
  }

  // Erreurs JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  }

  // Erreurs Stripe
  if (error.name === 'StripeError') {
    statusCode = 400;
    message = 'Erreur de paiement';
  }

  // Log des erreurs en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erreur:', error);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};

// src/middleware/notFound.ts
export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} non trouvée`,
    },
  });
};