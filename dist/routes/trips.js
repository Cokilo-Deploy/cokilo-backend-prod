"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripRouter = void 0;
//src/routes/trips.ts - TON CODE ORIGINAL avec juste l'import ajouté
const express_1 = __importDefault(require("express"));
const TripController_1 = require("../controllers/TripController");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const router = express_1.default.Router();
exports.tripRouter = router;
router.get('/', auth_1.optionalAuthMiddleware, TripController_1.TripController.getAllTrips);
router.post('/', auth_1.authMiddleware, permissions_1.requireVerifiedIdentity, TripController_1.TripController.createTrip);
