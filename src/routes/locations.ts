import { Router } from 'express';
import { LocationController } from '../controllers/LocationController';

const locationRouter = Router();

// Routes publiques (pas besoin d'authentification)
locationRouter.get('/countries', LocationController.getCountries);
locationRouter.get('/:countryCode', LocationController.getLocationsByCountry);

export { locationRouter };