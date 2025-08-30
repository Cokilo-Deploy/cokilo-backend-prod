//src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/database';
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

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middlewares existants
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use(express.json());

// NOUVEAU: Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/auth', authRouter);
app.use('/api/trips', tripRouter);
app.use('/api/transactions', authMiddleware, transactionRouter);
app.use('/api/wallet', walletRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    socketio: 'Active'
  });
});

// Gestion des erreurs pour les uploads
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
    await connectDB();
    console.log('✅ Base de données connectée');

    await syncModels();
    console.log('✅ Modèles synchronisés');

    // NOUVEAU: Créer les dossiers uploads si nécessaires
    const uploadsDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Dossier uploads/chat créé');
    }

    // Initialiser Socket.IO
    chatSocketServer = new ChatSocketServer(server);
    console.log('✅ Socket.IO Chat Server initialisé');
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur démarré sur http://192.168.1.66:${PORT}`);
      console.log(`📁 Fichiers statiques: /uploads`);
      console.log(`📡 WebSocket Chat: ws://192.168.1.66:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

startServer();

export default app;