import express from 'express';
import cors from 'cors';
import pool from './db/pool.js';
import authRoutes from './routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ ok: true, users: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Database connection failed' });
  }
});

app.use('/api/auth', authRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});