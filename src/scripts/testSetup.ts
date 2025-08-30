// src/scripts/testSetup.ts
import { sequelize } from '../config/database';
import { User, Trip } from '../models';
import { getUserAccessInfo } from '../utils/userAccess';

const testSetup = async () => {
  try {
    console.log('🔍 Test connexion DB...');
    await sequelize.authenticate();
    console.log('✅ Connexion OK');

    console.log('🔄 Sync modèles...');
    await sequelize.sync({ force: true }); // ATTENTION: force = supprime données
    console.log('✅ Modèles synchronisés');

    console.log('👤 Création utilisateur test...');
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33123456789',
    });

    console.log('🔐 Test permissions...');
    const accessInfo = getUserAccessInfo(user);
    console.log('Access info:', accessInfo);

    console.log('🎉 Setup complet !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
};

testSetup();