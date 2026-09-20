import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import donorRoutes from './routes/donors.js';
import requestRoutes from './routes/requests.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

// Slow down password guessing: max 100 auth requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});