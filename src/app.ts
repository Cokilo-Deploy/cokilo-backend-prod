// app-minimal.ts
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
import  NotificationRoutes from'./routes/notification';
import { userLanguageRouter } from './routes/userLanguage';
import supportRoutes from './routes/support';



dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json());
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

app.get('/', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur minimal sur le port ${PORT}`);
});