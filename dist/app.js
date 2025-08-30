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
const user_1 = __importDefault(require("./routes/user"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);
// Middlewares existants
app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }), webhooks_1.default);
app.use(express_1.default.json());
// NOUVEAU: Servir les fichiers statiques (uploads)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Route de test ultra simple
app.get('/', (req, res) => {
    res.json({
        message: 'CoKilo API Server - Version avec Chat',
        status: 'Running',
        features: ['Socket.io', 'Chat temps réel']
    });
});
// Debug middleware pour login
app.use((req, res, next) => {
    if (req.path === '/api/auth/login') {
        console.log('🔍 Login request - Headers:', req.headers);
        console.log('🔍 Login request - Body:', req.body);
        console.log('🔍 Login request - Content-Type:', req.headers['content-type']);
    }
    next();
});
// Route de test POST directe
app.post('/test-direct', (req, res) => {
    console.log('🎯 Route test directe appelée !');
    res.json({
        success: true,
        message: 'Route directe fonctionne !',
        timestamp: new Date().toISOString()
    });
});
// Routes existantes
app.use('/api/auth', auth_1.authRouter);
app.use('/api/trips', trips_1.tripRouter);
app.use('/api/transactions', auth_2.authMiddleware, transactions_1.default);
app.use('/api/wallet', wallet_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/users', user_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        socketio: 'Active'
    });
});
// Gestion des erreurs pour les uploads
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
        await (0, database_1.connectDB)();
        console.log('✅ Base de données connectée');
        await (0, models_1.syncModels)();
        console.log('✅ Modèles synchronisés');
        // NOUVEAU: Créer les dossiers uploads si nécessaires
        const uploadsDir = path_1.default.join(__dirname, '../uploads/chat');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            console.log('✅ Dossier uploads/chat créé');
        }
        // Initialiser Socket.IO
        chatSocketServer = new chatSocket_1.ChatSocketServer(server);
        console.log('✅ Socket.IO Chat Server initialisé');
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Serveur démarré sur http://192.168.1.66:${PORT}`);
            console.log(`📁 Fichiers statiques: /uploads`);
            console.log(`📡 WebSocket Chat: ws://192.168.1.66:${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
