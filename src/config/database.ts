import { Sequelize } from 'sequelize';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Configuration DB utilisée:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PORT:', process.env.DB_PORT);

// Pool avec timeout augmenté
export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'baggage_sharing',
  max: 3,                    // Réduit
  idleTimeoutMillis: 60000,  // Augmenté à 60s
  connectionTimeoutMillis: 60000, // Augmenté à 60s
});


const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'baggage_sharing',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 3,
    min: 0,
    acquire: 60000,
    idle: 10000,
  }
});



// Gardez seulement le test Sequelize
// Dans config/database.ts
export const connectDB = async () => {
  try {
    console.log('Tentative d\'authentification DB...');
    
    // Ajouter un timeout de 30 secondes
    const authPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout connexion DB (30s)')), 30000)
    );
    
    await Promise.race([authPromise, timeoutPromise]);
    console.log('Authentification DB réussie');
    
  } catch (error) {
    console.error('Erreur connexion DB:', error);
    throw error;
  }
};

export { sequelize };