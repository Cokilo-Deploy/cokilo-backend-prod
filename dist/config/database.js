"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.connectDB = exports.db = void 0;
const sequelize_1 = require("sequelize");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Pool avec timeout augmenté
exports.db = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'baggage_sharing',
    max: 3, // Réduit
    idleTimeoutMillis: 60000, // Augmenté à 60s
    connectionTimeoutMillis: 60000, // Augmenté à 60s
});
// Sequelize simplifié
const sequelize = new sequelize_1.Sequelize({
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
exports.sequelize = sequelize;
// Supprimez le test de connexion Pool qui cause le timeout
// db.connect() - SUPPRIMÉ
// Gardez seulement le test Sequelize
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Base de données connectée');
    }
    catch (error) {
        console.error('Erreur connexion DB:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
