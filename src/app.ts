// app-minimal.ts
import express from 'express';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json());
app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur minimal sur le port ${PORT}`);
});