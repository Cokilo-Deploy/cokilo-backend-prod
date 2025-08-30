"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/scripts/testSetup.ts
const database_1 = require("../config/database");
const models_1 = require("../models");
const userAccess_1 = require("../utils/userAccess");
const testSetup = async () => {
    try {
        console.log('🔍 Test connexion DB...');
        await database_1.sequelize.authenticate();
        console.log('✅ Connexion OK');
        console.log('🔄 Sync modèles...');
        await database_1.sequelize.sync({ force: true }); // ATTENTION: force = supprime données
        console.log('✅ Modèles synchronisés');
        console.log('👤 Création utilisateur test...');
        const user = await models_1.User.create({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+33123456789',
        });
        console.log('🔐 Test permissions...');
        const accessInfo = (0, userAccess_1.getUserAccessInfo)(user);
        console.log('Access info:', accessInfo);
        console.log('🎉 Setup complet !');
    }
    catch (error) {
        console.error('❌ Erreur:', error);
    }
    finally {
        await database_1.sequelize.close();
    }
};
testSetup();
