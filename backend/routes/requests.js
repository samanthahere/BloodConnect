import express from 'express';
import pool from '../db/pool.js';
import requireAuth from '../middleware/auth.js';
import { COMPATIBLE_DONORS, eligibleCutoffDate } from '../utils/bloodCompatibility.js';

const router = express.Router();

// Which patient groups can a donor of this group give blood to?
function recipientGroupsFor(donorGroup) {
  return Object.entries(COMPATIBLE_DONORS)
    .filter(([, donors]) => donors.includes(donorGroup))
    .map(([recipient]) => recipient);
}

// Load a donor's profile and whether they can donate right now
async function getDonorProfile(userId) {
  const result = await pool.query(
    `SELECT *,
       (is_available AND (last_donated_at IS NULL OR last_donated_at <= $2)) AS eligible
     FROM donor_profiles
     WHERE user_id = $1`,
    [userId, eligibleCutoffDate()]
  );
  return result.rows[0];
}

// Create a blood request
router.post('/', requireAuth, async (req, res) => {
  const { blood_group, district, hospital, units_needed, needed_by } = req.body;

  if (!Object.hasOwn(COMPATIBLE_DONORS, blood_group)) {
    return res.status(400).json({ error: 'Invalid blood group' });
  }
  if (!district || !hospital) {
    return res.status(400).json({ error: 'District and hospital are required' });
  }
  const units = Number(units_needed);
  if (!Number.isInteger(units) || units < 1 || units > 10) {
    return res.status(400).json({ error: 'Units must be between 1 and 10' });
  }
  const validDate =
    typeof needed_by === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(needed_by) &&
    !isNaN(new Date(needed_by).getTime());
  if (!validDate) {
    return res.status(400).json({ error: 'needed_by must be a date like 2026-09-30' });
  }
  const today = new Date().toLocaleDateString('en-CA');
  if (needed_by < today) {
    return res.status(400).json({ error: 'Date cannot be in the past' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO blood_requests
         (requester_id, blood_group, district, hospital, units_needed, needed_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.userId, blood_group, district, hospital, units, needed_by]
    );
    res.status(201).json({ request: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Open requests that I (as a donor) can help with
router.get('/open', requireAuth, async (req, res) => {
  try {
    const profile = await getDonorProfile(req.userId);
    if (!profile) {
      return res.status(404).json({ error: 'Create your donor profile first' });
    }
    if (!profile.eligible) {
      return res.json({ eligible: false, requests: [] });
    }

    const result = await pool.query(
      `SELECT r.id, r.blood_group, r.district, r.hospital,
              r.units_needed, r.needed_by, r.created_at,
              rr.status AS my_response
       FROM blood_requests r
       LEFT JOIN request_responses rr
         ON rr.request_id = r.id AND rr.donor_id = $1
       WHERE r.status = 'open'
         AND r.needed_by >= CURRENT_DATE
         AND r.blood_group = ANY($2)
         AND LOWER(r.district) = LOWER($3)
         AND r.requester_id <> $1
       ORDER BY r.needed_by ASC
       LIMIT 50`,
      [req.userId, recipientGroupsFor(profile.blood_group), profile.district]
    );
    res.json({ eligible: true, requests: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// My own requests, with contact details of donors who accepted
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
         COALESCE(
           json_agg(
             json_build_object('name', u.name, 'phone', u.phone, 'area', dp.area)
           ) FILTER (WHERE rr.status = 'accepted'),
           '[]'
         ) AS accepted_donors
       FROM blood_requests r
       LEFT JOIN request_responses rr ON rr.request_id = r.id
       LEFT JOIN users u ON u.id = rr.donor_id
       LEFT JOIN donor_profiles dp ON dp.user_id = u.id
       WHERE r.requester_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [req.userId]
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Donor accepts or declines a request
router.post('/:id/respond', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ error: 'Invalid request id' });
  }
  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be accepted or declined' });
  }

  try {
    const profile = await getDonorProfile(req.userId);
    if (!profile) {
      return res.status(404).json({ error: 'Create your donor profile first' });
    }
    if (!profile.eligible) {
      return res.status(403).json({ error: 'You are not eligible to donate right now' });
    }

    const found = await pool.query(
      `SELECT * FROM blood_requests
       WHERE id = $1 AND status = 'open' AND needed_by >= CURRENT_DATE`,
      [requestId]
    );
    const bloodRequest = found.rows[0];
    if (!bloodRequest) {
      return res.status(404).json({ error: 'Request not found or closed' });
    }
    if (bloodRequest.requester_id === req.userId) {
      return res.status(400).json({ error: 'You cannot respond to your own request' });
    }

    const canDonate =
      COMPATIBLE_DONORS[bloodRequest.blood_group].includes(profile.blood_group) &&
      bloodRequest.district.toLowerCase() === profile.district.toLowerCase();
    if (!canDonate) {
      return res
        .status(403)
        .json({ error: 'This request does not match your blood group or district' });
    }

    const result = await pool.query(
      `INSERT INTO request_responses (request_id, donor_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (request_id, donor_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING id, request_id, status`,
      [requestId, req.userId, status]
    );
    res.json({ response: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;