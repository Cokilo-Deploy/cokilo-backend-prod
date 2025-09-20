//src/routes/user.ts
import express from 'express';
import { UserController } from '../controllers/UserController';
import { ReviewController } from '../controllers/ReviewController'; // Ajout de cet import
import { authMiddleware } from '../middleware/auth';
import { uploadAvatar } from '../middleware/uploadAvatar';

const router = express.Router();

router.put('/profile', authMiddleware, UserController.updateProfile);
router.get('/:userId/info', UserController.getUserInfo);
router.get('/:userId/reviews', ReviewController.getUserReviews); // Ajout de cette route
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), UserController.uploadAvatar);
router.get('/stats', authMiddleware, UserController.getUserStats);

export default router;