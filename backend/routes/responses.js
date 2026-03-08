// backend/routes/responses.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const VALID_CLASSIFICATIONS = [
  'pink', 'red', 'orange', 'yellow', 'green',
  'blue', 'purple', 'brown', 'black', 'white', 'grey'
];

// POST /api/responses - Submit a color classification
router.post('/', async (req, res) => {
  const { rgb_r, rgb_g, rgb_b, hex, classification } = req.body;

  // Validate required fields
  if (rgb_r === undefined || rgb_g === undefined || rgb_b === undefined || !hex || !classification) {
    return res.status(400).json({
      error: 'rgb_r, rgb_g, rgb_b, hex, and classification are required'
    });
  }

  // Validate RGB ranges
  if (rgb_r < 0 || rgb_r > 255 || rgb_g < 0 || rgb_g > 255 || rgb_b < 0 || rgb_b > 255) {
    return res.status(400).json({
      error: 'RGB values must be between 0 and 255'
    });
  }

  if (!VALID_CLASSIFICATIONS.includes(classification)) {
    return res.status(400).json({
      error: 'Invalid classification',
      valid: VALID_CLASSIFICATIONS
    });
  }

  try {
    // Ensure session is saved to database before inserting response
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const sessionId = req.session.id;

    // Check if already responded to this specific RGB color
    const [existingRows] = await db.query(
      'SELECT id FROM responses WHERE session_id = ? AND rgb_r = ? AND rgb_g = ? AND rgb_b = ?',
      [sessionId, rgb_r, rgb_g, rgb_b]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'Already responded to this color' });
    }

    // Check if this will be the first classification for this RGB color
    const [firstCheckRows] = await db.query(
      'SELECT COUNT(*) as count FROM responses WHERE rgb_r = ? AND rgb_g = ? AND rgb_b = ?',
      [rgb_r, rgb_g, rgb_b]
    );
    const wasFirst = firstCheckRows[0].count === 0;

    // Insert response with RGB values
    await db.query(
      'INSERT INTO responses (session_id, rgb_r, rgb_g, rgb_b, hex, user_classification) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, rgb_r, rgb_g, rgb_b, hex, classification]
    );

    res.json({ success: true, wasFirst });
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
});

module.exports = router;
