const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/colors - Get a random color
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT color_id, color_name, hex_code FROM colors ORDER BY RAND() LIMIT 1'
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'No colors found in database'
      });
    }

    res.json({
      color: rows[0]
    });
  } catch (error) {
    console.error('Error fetching random color:', error);
    res.status(500).json({
      error: 'Failed to fetch random color'
    });
  }
});

// GET /api/colors/:id - Get a specific color by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT color_id, color_name, hex_code FROM colors WHERE color_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Color not found'
      });
    }

    res.json({
      color: rows[0]
    });
  } catch (error) {
    console.error('Error fetching color:', error);
    res.status(500).json({
      error: 'Failed to fetch color'
    });
  }
});

module.exports = router;
