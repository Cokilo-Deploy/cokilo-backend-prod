"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/user.ts
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../controllers/UserController");
const ReviewController_1 = require("../controllers/ReviewController"); // Ajout de cet import
const auth_1 = require("../middleware/auth");
const uploadAvatar_1 = require("../middleware/uploadAvatar");
const router = express_1.default.Router();
router.put('/profile', auth_1.authMiddleware, UserController_1.UserController.updateProfile);
router.get('/:userId/info', UserController_1.UserController.getUserInfo);
router.get('/:userId/reviews', ReviewController_1.ReviewController.getUserReviews); // Ajout de cette route
router.post('/avatar', auth_1.authMiddleware, uploadAvatar_1.uploadAvatar.single('avatar'), UserController_1.UserController.uploadAvatar);
router.get('/stats', auth_1.authMiddleware, UserController_1.UserController.getUserStats);
exports.default = router;
