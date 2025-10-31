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
import { setIO } from './socket/socketInstance'; 
import userRoutes from './routes/user';
import { verificationRouter } from './routes/verification';
import stripeConnectRoutes from './routes/stripeConnect';
import stripeConnectWebhookRoutes from './routes/webhooks'; 
import NotificationRoutes from './routes/notification';
import { userLanguageRouter } from './routes/userLanguage';
import supportRoutes from './routes/support';
import { adminRouter } from './routes/admin';
import { locationRouter } from './routes/locations';
import cors from 'cors';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '8080', 10);


// Configuration CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'https://admin.cokilo.com','https://cokilo.com','http://cokilo.com'],
  credentials: true,
};

app.use(cors(corsOptions));

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
app.use('/api/locations', locationRouter);
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
app.use('/api/admin', adminRouter);

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
    console.log('1. Démarrage du serveur...');
    
    console.log('2. Tentative de connexion à la base de données...');
    await connectDB();
    console.log('3. Base de données connectée avec succès');

    console.log('4. Synchronisation des modèles...');
    await syncModels();
    console.log('5. Modèles synchronisés avec succès');

    console.log('6. Création dossiers uploads...');
    const uploadsDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('7. Dossier uploads/chat créé');
    } else {
      console.log('7. Dossier uploads/chat existe déjà');
    }

    console.log('8. Initialisation Socket.IO...');
    chatSocketServer = new ChatSocketServer(server);

    // 🆕 AJOUT : Enregistrer l'instance io pour NotificationService
    // Accéder à l'instance io du ChatSocketServer
    const io = (chatSocketServer as any).io;
    if (io) {
      setIO(io);
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

  } catch (error:any) {
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

export default app;