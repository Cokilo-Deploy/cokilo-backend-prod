// 2. Créer src/routes/userLanguage.ts

import express from 'express';
import { UserLanguageController } from '../controllers/UserLanguageController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Routes pour la gestion des langues utilisateur
router.get('/language', authMiddleware, UserLanguageController.getCurrentLanguage);
router.put('/language', authMiddleware, UserLanguageController.updateLanguage);
router.get('/languages/supported', UserLanguageController.getSupportedLanguages);

export { router as userLanguageRouter };

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