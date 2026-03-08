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
  const { color_id, classification } = req.body;

  if (!color_id || !classification) {
    return res.status(400).json({ error: 'color_id and classification are required' });
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

    // Check if color exists
    const [colorRows] = await db.query('SELECT id FROM colors WHERE id = ?', [color_id]);
    if (colorRows.length === 0) {
      return res.status(404).json({ error: 'Color not found' });
    }

    // Check if already responded
    const [existingRows] = await db.query(
      'SELECT id FROM responses WHERE session_id = ? AND color_id = ?',
      [sessionId, color_id]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'Already responded to this color' });
    }

    // Check if this will be the first classification
    const [firstCheckRows] = await db.query(
      'SELECT COUNT(*) as count FROM responses WHERE color_id = ?',
      [color_id]
    );
    const wasFirst = firstCheckRows[0].count === 0;

    // Insert response
    await db.query(
      'INSERT INTO responses (session_id, color_id, user_classification) VALUES (?, ?, ?)',
      [sessionId, color_id, classification]
    );

    res.json({ success: true, wasFirst });
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
});

module.exports = router;
