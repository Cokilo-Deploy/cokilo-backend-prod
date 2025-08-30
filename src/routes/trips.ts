import express from 'express';
import { TripController } from '../controllers/TripController';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth';
import { requireVerifiedIdentity } from '../middleware/permissions';

const router = express.Router();

router.get('/', optionalAuthMiddleware, TripController.getAllTrips);
router.post('/', authMiddleware, requireVerifiedIdentity, TripController.createTrip);

export { router as tripRouter };