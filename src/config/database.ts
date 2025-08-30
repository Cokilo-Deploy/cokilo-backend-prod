import { Sequelize } from 'sequelize';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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

// Sequelize simplifié
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'baggage_sharing',
  logging: false,
  pool: {
    max: 3,
    min: 0,
    acquire: 60000,
    idle: 10000,
  }
});

// Supprimez le test de connexion Pool qui cause le timeout
// db.connect() - SUPPRIMÉ

// Gardez seulement le test Sequelize
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Base de données connectée');
  } catch (error) {
    console.error('Erreur connexion DB:', error);
    throw error;
  }
};

export { sequelize };