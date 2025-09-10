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
import { QueryTypes } from 'sequelize';
import stripeConnectRoutes from './routes/stripeConnect';
import stripeConnectWebhookRoutes from './routes/webhooks'; 




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
app.use('/api/verification', verificationRouter);
app.use('/api/stripe-connect', stripeConnectRoutes);
app.use('/api/webhooks', stripeConnectWebhookRoutes); 

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
try {
  const tables = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    { type: QueryTypes.SELECT }
  );
  console.log('📋 Tables trouvées:', tables);

  // Création des tables manquantes
  console.log('🔧 Création des tables manquantes...');
  
  // Table wallets
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      balance NUMERIC(10,2) DEFAULT 0.00,
      currency VARCHAR(3) DEFAULT 'EUR',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  // Table chat_conversations
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id SERIAL PRIMARY KEY,
      "transactionId" INTEGER REFERENCES transactions(id),
      "user1Id" INTEGER NOT NULL REFERENCES users(id),
      "user2Id" INTEGER NOT NULL REFERENCES users(id),
      "lastMessageAt" TIMESTAMP WITH TIME ZONE,
      status VARCHAR(255) DEFAULT 'active',
      "isArchived" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  // Table chat_messages
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      "conversationId" INTEGER NOT NULL REFERENCES chat_conversations(id),
      "senderId" INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      "messageType" VARCHAR(255) DEFAULT 'text',
      "attachmentUrl" VARCHAR(255),
      "isRead" BOOLEAN DEFAULT false,
      "readAt" TIMESTAMP WITH TIME ZONE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
`);

  // Ajoutez cette table dans votre code de création
  await sequelize.query(`
  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    type VARCHAR(255) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT,
    status VARCHAR(255) DEFAULT 'completed',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
  );
`);

await sequelize.query(`
  CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(255),
    bank_name VARCHAR(255),
    bank_code VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT
  );
`);
  
// Dans votre bloc de création de tables existant dans src/app.ts, ajoutez :

// Table reviews
await sequelize.query(`
  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    "transactionId" INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    "reviewerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "revieweeId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    "isPublic" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("transactionId", "reviewerId")
  );
`);  
  console.log('✅ Tables créées avec succès');

} catch (error) {
  console.error('❌ Erreur listage/création tables:', error);
}
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