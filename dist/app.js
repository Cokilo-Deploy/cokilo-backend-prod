"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/app.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = require("./config/database");
const models_1 = require("./models");
const transactions_1 = __importDefault(require("./routes/transactions"));
const auth_1 = require("./routes/auth");
const trips_1 = require("./routes/trips");
const auth_2 = require("./middleware/auth");
const wallet_1 = __importDefault(require("./routes/wallet"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const chat_1 = __importDefault(require("./routes/chat"));
const http_1 = __importDefault(require("http"));
const chatSocket_1 = require("./socket/chatSocket");
const socketInstance_1 = require("./socket/socketInstance");
const user_1 = __importDefault(require("./routes/user"));
const verification_1 = require("./routes/verification");
const stripeConnect_1 = __importDefault(require("./routes/stripeConnect"));
const webhooks_2 = __importDefault(require("./routes/webhooks"));
const notification_1 = __importDefault(require("./routes/notification"));
const userLanguage_1 = require("./routes/userLanguage");
const support_1 = __importDefault(require("./routes/support"));
const admin_1 = require("./routes/admin");
const locations_1 = require("./routes/locations");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = parseInt(process.env.PORT || '8080', 10);
// Configuration CORS
const corsOptions = {
    origin: ['http://localhost:3000', 'https://admin.cokilo.com', 'https://cokilo.com', 'http://cokilo.com'],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
// Middlewares
app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }), webhooks_1.default);
app.use(express_1.default.json());
// Servir les fichiers statiques (uploads)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes de base
app.get('/', (req, res) => {
    res.json({
        message: 'CoKilo API Server',
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});
// Debug middleware pour login
app.use((req, res, next) => {
    if (req.path === '/api/auth/login') {
        console.log('Login request - Headers:', req.headers);
        console.log('Login request - Body:', req.body);
        console.log('Login request - Content-Type:', req.headers['content-type']);
    }
    next();
});
// Routes API
app.use('/api/auth', auth_1.authRouter);
app.use('/api/trips', trips_1.tripRouter);
app.use('/api/locations', locations_1.locationRouter);
app.use('/api/transactions', auth_2.authMiddleware, transactions_1.default);
app.use('/api/wallet', wallet_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/users', user_1.default);
app.use('/api/verification', verification_1.verificationRouter);
app.use('/api/stripe-connect', stripeConnect_1.default);
app.use('/api/webhooks', webhooks_2.default);
app.use('/api/notifications', notification_1.default);
app.use('/api/user', userLanguage_1.userLanguageRouter);
app.use('/api/support', support_1.default);
app.use('/api/admin', admin_1.adminRouter);
// Gestion des erreurs
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Fichier trop volumineux (max 2MB)' });
    }
    if (err.message === 'Seulement les images sont autorisées') {
        return res.status(400).json({ error: err.message });
    }
    console.error('Erreur serveur:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});
let chatSocketServer;
const startServer = async () => {
    try {
        console.log('1. Démarrage du serveur...');
        console.log('2. Tentative de connexion à la base de données...');
        await (0, database_1.connectDB)();
        console.log('3. Base de données connectée avec succès');
        console.log('4. Synchronisation des modèles...');
        await (0, models_1.syncModels)();
        console.log('5. Modèles synchronisés avec succès');
        console.log('6. Création dossiers uploads...');
        const uploadsDir = path_1.default.join(__dirname, '../uploads/chat');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            console.log('7. Dossier uploads/chat créé');
        }
        else {
            console.log('7. Dossier uploads/chat existe déjà');
        }
        console.log('8. Initialisation Socket.IO...');
        chatSocketServer = new chatSocket_1.ChatSocketServer(server);
        // 🆕 AJOUT : Enregistrer l'instance io pour NotificationService
        // Accéder à l'instance io du ChatSocketServer
        const io = chatSocketServer.io;
        if (io) {
            (0, socketInstance_1.setIO)(io);
            console.log('8b. Instance Socket.IO enregistrée pour les notifications');
        }
        console.log('9. Socket.IO Chat Server initialisé');
        console.log('10. Démarrage du serveur HTTP...');
        server.listen(PORT, '0.0.0.0', () => {
            console.log('11. ✅ SERVEUR DÉMARRÉ AVEC SUCCÈS');
            console.log(`✅ Port: ${PORT}`);
            console.log(`✅ Fichiers statiques: /uploads`);
            console.log(`✅ WebSocket Chat actif`);
        });
    }
    catch (error) {
        console.error('💥 ERREUR CRITIQUE AU DÉMARRAGE:', error);
        console.error('💥 Type:', error.name);
        console.error('💥 Message:', error.message);
        console.error('💥 Stack:', error.stack);
        process.exit(1);
    }
};
// Gestionnaires d'erreurs globaux
process.on('uncaughtException', (error) => {
    console.error('Erreur non interceptée:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejetée:', reason);
    process.exit(1);
});
startServer();
exports.default = app;
