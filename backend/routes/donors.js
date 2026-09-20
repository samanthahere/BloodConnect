import express from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';
import { COMPATIBLE_DONORS, eligibleCutoffDate } from '../utils/bloodCompatibility.js';

const router = express.Router();

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Create or update my donor profile
router.put('/me', requireAuth, async (req, res) => {
  const { blood_group, district, area, last_donated_at, is_available } = req.body;

  if (!BLOOD_GROUPS.includes(blood_group)) {
    return res.status(400).json({ error: 'Invalid blood group' });
  }
  if (!district) {
    return res.status(400).json({ error: 'District is required' });
  }
  if (last_donated_at) {
    const date = new Date(last_donated_at);
    if (isNaN(date.getTime()) || date > new Date()) {
      return res.status(400).json({ error: 'Invalid last donation date' });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO donor_profiles
         (user_id, blood_group, district, area, last_donated_at, is_available)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         blood_group = EXCLUDED.blood_group,
         district = EXCLUDED.district,
         area = EXCLUDED.area,
         last_donated_at = EXCLUDED.last_donated_at,
         is_available = EXCLUDED.is_available
       RETURNING *`,
      [
        req.userId,
        blood_group,
        district,
        area || null,
        last_donated_at || null,
        is_available ?? true,
      ]
    );
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get my donor profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM donor_profiles WHERE user_id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Search eligible donors for a patient's blood group in a district
router.get('/search', requireAuth, async (req, res) => {
  const { blood_group, district } = req.query;

  if (!Object.hasOwn(COMPATIBLE_DONORS, blood_group)) {
    return res.status(400).json({ error: 'Invalid blood group' });
  }
  if (!district) {
    return res.status(400).json({ error: 'District is required' });
  }

  try {
    const result = await pool.query(
      `SELECT dp.id, u.name, dp.blood_group, dp.district, dp.area, dp.last_donated_at
       FROM donor_profiles dp
       JOIN users u ON u.id = dp.user_id
       WHERE dp.blood_group = ANY($1)
         AND LOWER(dp.district) = LOWER($2)
         AND dp.is_available = TRUE
         AND (dp.last_donated_at IS NULL OR dp.last_donated_at <= $3)
         AND dp.user_id <> $4
       ORDER BY (dp.blood_group = $5) DESC, dp.last_donated_at ASC NULLS FIRST
       LIMIT 50`,
      [
        COMPATIBLE_DONORS[blood_group],
        district,
        eligibleCutoffDate(),
        req.userId,
        blood_group,
      ]
    );
    res.json({ donors: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;