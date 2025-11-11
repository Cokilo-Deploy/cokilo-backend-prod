"use strict";
// 2. Créer src/routes/userLanguage.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLanguageRouter = void 0;
const express_1 = __importDefault(require("express"));
const UserLanguageController_1 = require("../controllers/UserLanguageController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.userLanguageRouter = router;
// Routes pour la gestion des langues utilisateur
router.get('/language', auth_1.authMiddleware, UserLanguageController_1.UserLanguageController.getCurrentLanguage);
router.put('/language', auth_1.authMiddleware, UserLanguageController_1.UserLanguageController.updateLanguage);
router.get('/languages/supported', UserLanguageController_1.UserLanguageController.getSupportedLanguages);
// 3. Ajouter dans app.ts ou server.ts
// import { userLanguageRouter } from './routes/userLanguage';
// app.use('/api/user', userLanguageRouter);
// 4. Tests Postman pour changement de langue
/*
=== TEST 1: Récupérer langue actuelle ===
GET {{base_url}}/api/user/language
Headers: Authorization: Bearer {{token}}

=== TEST 2: Changer vers anglais ===
PUT {{base_url}}/api/user/language
Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json
Body: { "language": "en" }

=== TEST 3: Changer vers allemand ===
PUT {{base_url}}/api/user/language
Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json
Body: { "language": "de" }

=== TEST 4: Test langue invalide ===
PUT {{base_url}}/api/user/language
Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json
Body: { "language": "xx" }

=== TEST 5: Vérifier effet sur autre endpoint ===
GET {{base_url}}/api/trips
Headers: Authorization: Bearer {{token}}
(Devrait retourner dans la nouvelle langue)

=== TEST 6: Langues supportées (public) ===
GET {{base_url}}/api/user/languages/supported
*/ 
