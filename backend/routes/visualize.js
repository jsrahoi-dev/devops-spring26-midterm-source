// backend/routes/visualize.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/visualize/data - Get colors with metrics (personal or global view)
router.get('/data', async (req, res) => {
  try {
    const view = req.query.view || 'global';
    const sessionId = req.session.id;

    let distinctColorsQuery;
    let queryParams;

    if (view === 'personal') {
      // Get distinct RGBs for current session only
      distinctColorsQuery = `
        SELECT DISTINCT rgb_r, rgb_g, rgb_b, hex
        FROM responses
        WHERE session_id = ?
      `;
      queryParams = [sessionId];
    } else {
      // Get all distinct RGBs (global view)
      distinctColorsQuery = `
        SELECT DISTINCT rgb_r, rgb_g, rgb_b, hex
        FROM responses
      `;
      queryParams = [];
    }

    const [distinctColors] = await db.query(distinctColorsQuery, queryParams);
    const visualizationData = [];

    for (const color of distinctColors) {
      // Get all responses for this RGB combination
      const [responses] = await db.query(`
        SELECT user_classification, COUNT(*) as count
        FROM responses
        WHERE rgb_r = ? AND rgb_g = ? AND rgb_b = ?
        GROUP BY user_classification
        ORDER BY count DESC
      `, [color.rgb_r, color.rgb_g, color.rgb_b]);

      if (responses.length === 0) continue;

      const totalResponses = responses.reduce((sum, r) => sum + r.count, 0);
      const mostCommon = responses[0];

      // Calculate controversy (entropy-like measure)
      const proportions = responses.map(r => r.count / totalResponses);
      const controversy = -proportions.reduce((sum, p) => sum + (p * Math.log2(p)), 0);
      const normalizedControversy = Math.min(controversy / Math.log2(responses.length), 1);
      const agreement = 1 - normalizedControversy;

      visualizationData.push({
        rgb: { r: color.rgb_r, g: color.rgb_g, b: color.rgb_b },
        hex: color.hex,
        responses: totalResponses,
        most_common: mostCommon.user_classification,
        controversy: Math.round(normalizedControversy * 100),
        agreement: Math.round(agreement * 100),
        distribution: responses
      });
    }

    res.json({ colors: visualizationData, view });
  } catch (error) {
    console.error('Error fetching visualization data:', error);
    res.status(500).json({ error: 'Failed to fetch visualization data' });
  }
});

module.exports = router;
