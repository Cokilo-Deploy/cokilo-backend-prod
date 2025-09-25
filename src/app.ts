//src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB, sequelize } from './config/database';
import { syncModels } from './models';
import transactionRouter from './routes/transactions';
import { authRouter } from './routes/auth';
import { tripRouter } from './routes/trips';
import { authMiddleware } from './middleware/auth';
import walletRoutes from './routes/wallet';
import webhookRoutes from './routes/webhooks';
import chatRouter from './routes/chat';
import http from 'http';
import { ChatSocketServer } from './socket/chatSocket';
import userRoutes from './routes/user';
import { verificationRouter } from './routes/verification';
import stripeConnectRoutes from './routes/stripeConnect';
import stripeConnectWebhookRoutes from './routes/webhooks'; 
import NotificationRoutes from './routes/notification';
import { userLanguageRouter } from './routes/userLanguage';
import supportRoutes from './routes/support';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middlewares
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use(express.json());

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/auth', authRouter);
app.use('/api/trips', tripRouter);
app.use('/api/transactions', authMiddleware, transactionRouter);
app.use('/api/wallet', walletRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/users', userRoutes);
app.use('/api/verification', verificationRouter);
app.use('/api/stripe-connect', stripeConnectRoutes);
app.use('/api/webhooks', stripeConnectWebhookRoutes); 
app.use('/api/notifications', NotificationRoutes);
app.use('/api/user', userLanguageRouter);
app.use('/api/support', supportRoutes);

// Gestion des erreurs
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux (max 2MB)' });
  }
  
  if (err.message === 'Seulement les images sont autorisées') {
    return res.status(400).json({ error: err.message });
  }
  
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

let chatSocketServer: ChatSocketServer;

const startServer = async () => {
  try {
    console.log('Démarrage du serveur...');
    
    // Connexion à la base de données
    await connectDB();
    console.log('Base de données connectée');

    // Synchronisation des modèles
    await syncModels();
    console.log('Modèles synchronisés');

    // Créer les dossiers uploads si nécessaires
    const uploadsDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Dossier uploads/chat créé');
    }

    // Initialiser Socket.IO
    chatSocketServer = new ChatSocketServer(server);
    console.log('Socket.IO Chat Server initialisé');
    
    // Démarrer le serveur
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`Fichiers statiques: /uploads`);
      console.log(`WebSocket Chat: ws://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
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

export default app;