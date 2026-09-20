import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone`,
      [name, email.toLowerCase(), phone, passwordHash]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    const user = result.rows[0];
    const valid = user && (await bcrypt.compare(password, user.password_hash));

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;