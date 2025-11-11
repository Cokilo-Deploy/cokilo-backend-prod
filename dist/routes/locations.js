"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationRouter = void 0;
const express_1 = require("express");
const LocationController_1 = require("../controllers/LocationController");
const locationRouter = (0, express_1.Router)();
exports.locationRouter = locationRouter;
// Routes publiques (pas besoin d'authentification)
locationRouter.get('/countries', LocationController_1.LocationController.getCountries);
locationRouter.get('/:countryCode', LocationController_1.LocationController.getLocationsByCountry);
