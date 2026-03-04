// backend/routes/visualize.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/visualize/data - Get all colors with controversy/agreement metrics
router.get('/data', async (req, res) => {
  try {
    const [colors] = await db.query('SELECT id, rgb_r, rgb_g, rgb_b, hex FROM colors');

    const visualizationData = [];

    for (const color of colors) {
      // Get all responses for this color
      const [responses] = await db.query(`
        SELECT user_classification, COUNT(*) as count
        FROM responses
        WHERE color_id = ?
        GROUP BY user_classification
        ORDER BY count DESC
      `, [color.id]);

      if (responses.length === 0) {
        // No responses yet, add with default values
        visualizationData.push({
          id: color.id,
          rgb: { r: color.rgb_r, g: color.rgb_g, b: color.rgb_b },
          hex: color.hex,
          responses: 0,
          most_common: null,
          controversy: 0,
          agreement: 0
        });
        continue;
      }

      const totalResponses = responses.reduce((sum, r) => sum + r.count, 0);
      const mostCommon = responses[0];

      // Calculate controversy (entropy-like measure)
      // Higher when responses are evenly distributed
      const proportions = responses.map(r => r.count / totalResponses);
      const controversy = -proportions.reduce((sum, p) => sum + (p * Math.log2(p)), 0);
      const normalizedControversy = Math.min(controversy / Math.log2(responses.length), 1);

      // Agreement is inverse of controversy
      const agreement = 1 - normalizedControversy;

      visualizationData.push({
        id: color.id,
        rgb: { r: color.rgb_r, g: color.rgb_g, b: color.rgb_b },
        hex: color.hex,
        responses: totalResponses,
        most_common: mostCommon.user_classification,
        controversy: Math.round(normalizedControversy * 100),
        agreement: Math.round(agreement * 100),
        distribution: responses
      });
    }

    res.json({ colors: visualizationData });
  } catch (error) {
    console.error('Error fetching visualization data:', error);
    res.status(500).json({ error: 'Failed to fetch visualization data' });
  }
});

module.exports = router;
