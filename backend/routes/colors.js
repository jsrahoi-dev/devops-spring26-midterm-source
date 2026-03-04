// backend/routes/colors.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/colors/next - Get random color for classification
router.get('/next', async (req, res) => {
  try {
    // Get colors user hasn't responded to yet
    const sessionId = req.session.id;

    const [rows] = await db.query(`
      SELECT c.id, c.rgb_r, c.rgb_g, c.rgb_b, c.hex
      FROM colors c
      WHERE c.id NOT IN (
        SELECT color_id FROM responses WHERE session_id = ?
      )
      ORDER BY RAND()
      LIMIT 1
    `, [sessionId]);

    if (rows.length === 0) {
      return res.json({ done: true, message: 'No more colors available' });
    }

    res.json({ color: rows[0] });
  } catch (error) {
    console.error('Error fetching color:', error);
    res.status(500).json({ error: 'Failed to fetch color' });
  }
});

// GET /api/colors/count - Count remaining colors for user
router.get('/count', async (req, res) => {
  try {
    const sessionId = req.session.id;

    const [totalRows] = await db.query('SELECT COUNT(*) as total FROM colors');
    const [answeredRows] = await db.query(
      'SELECT COUNT(*) as answered FROM responses WHERE session_id = ?',
      [sessionId]
    );

    const total = totalRows[0].total;
    const answered = answeredRows[0].answered;
    const remaining = total - answered;

    res.json({ total, answered, remaining });
  } catch (error) {
    console.error('Error counting colors:', error);
    res.status(500).json({ error: 'Failed to count colors' });
  }
});

module.exports = router;
