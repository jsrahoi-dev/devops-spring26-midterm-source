// backend/routes/colors.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/colors/next - Generate random RGB color
router.get('/next', async (req, res) => {
  try {
    const sessionId = req.session.id;
    let rgb_r, rgb_g, rgb_b, hex;
    let attempts = 0;
    const maxAttempts = 3;

    // Try to generate a color the user hasn't classified yet
    // After maxAttempts, just return whatever we generated
    while (attempts < maxAttempts) {
      // Generate random RGB values (0-255)
      rgb_r = Math.floor(Math.random() * 256);
      rgb_g = Math.floor(Math.random() * 256);
      rgb_b = Math.floor(Math.random() * 256);

      // Convert to hex
      hex = '#' +
        rgb_r.toString(16).padStart(2, '0').toUpperCase() +
        rgb_g.toString(16).padStart(2, '0').toUpperCase() +
        rgb_b.toString(16).padStart(2, '0').toUpperCase();

      // Check if user already classified this exact RGB combination
      const [existing] = await db.query(`
        SELECT id FROM responses
        WHERE session_id = ? AND rgb_r = ? AND rgb_g = ? AND rgb_b = ?
        LIMIT 1
      `, [sessionId, rgb_r, rgb_g, rgb_b]);

      if (existing.length === 0) {
        // User hasn't seen this color yet
        break;
      }

      attempts++;
    }

    // Return the color
    res.json({
      rgb_r,
      rgb_g,
      rgb_b,
      hex
    });
  } catch (error) {
    console.error('Error generating color:', error);
    res.status(500).json({ error: 'Failed to generate color' });
  }
});

module.exports = router;
