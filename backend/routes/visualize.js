// backend/routes/visualize.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/visualize/data - Get colors with metrics (personal or global view)
router.get('/data', async (req, res) => {
  try {
    const view = req.query.view || 'global';
    if (!['personal', 'global'].includes(view)) {
      return res.status(400).json({ error: 'Invalid view parameter. Must be "personal" or "global"' });
    }
    const sessionId = req.session.id;
    if (view === 'personal' && !sessionId) {
      return res.status(401).json({ error: 'Session required for personal view' });
    }

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

    // Note: This has an N+1 query pattern (one query per color). For better performance,
    // this could be refactored to use a single GROUP BY query. Acceptable for current scale.
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
      let normalizedControversy, agreement;
      if (responses.length === 1) {
        // Only one classification type - perfect agreement, no controversy
        normalizedControversy = 0;
        agreement = 1;
      } else {
        const proportions = responses.map(r => r.count / totalResponses);
        const controversy = -proportions.reduce((sum, p) => sum + (p * Math.log2(p)), 0);
        normalizedControversy = Math.min(controversy / Math.log2(responses.length), 1);
        agreement = 1 - normalizedControversy;
      }

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
