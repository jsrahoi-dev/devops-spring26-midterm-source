// backend/routes/results.js
const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/results/mine - Get user's results with agreement stats
router.get('/mine', async (req, res) => {
  try {
    const sessionId = req.session.id;

    // Get user's responses with color info
    const [userResponses] = await db.query(`
      SELECT
        r.color_id,
        r.user_classification,
        c.rgb_r, c.rgb_g, c.rgb_b, c.hex
      FROM responses r
      JOIN colors c ON r.color_id = c.id
      WHERE r.session_id = ?
      ORDER BY r.created_at
    `, [sessionId]);

    if (userResponses.length === 0) {
      return res.json({ results: [], overall_agreement: 0 });
    }

    // Calculate agreement for each color
    const results = [];
    let totalAgreed = 0;

    for (const userResponse of userResponses) {
      // Get all responses for this color
      const [allResponses] = await db.query(`
        SELECT user_classification, COUNT(*) as count
        FROM responses
        WHERE color_id = ?
        GROUP BY user_classification
        ORDER BY count DESC
      `, [userResponse.color_id]);

      const totalResponses = allResponses.reduce((sum, r) => sum + r.count, 0);
      const mostCommon = allResponses[0];
      const userClassification = userResponse.user_classification;

      const agreedWithUser = allResponses.find(r => r.user_classification === userClassification);
      const agreementPercent = agreedWithUser
        ? Math.round((agreedWithUser.count / totalResponses) * 100)
        : 0;

      const agreed = userClassification === mostCommon.user_classification;
      if (agreed) totalAgreed++;

      results.push({
        color: {
          id: userResponse.color_id,
          rgb: { r: userResponse.rgb_r, g: userResponse.rgb_g, b: userResponse.rgb_b },
          hex: userResponse.hex
        },
        your_answer: userClassification,
        most_common: mostCommon.user_classification,
        agreement_percent: agreementPercent,
        agreed_with_majority: agreed,
        all_responses: allResponses
      });
    }

    const overallAgreement = Math.round((totalAgreed / userResponses.length) * 100);

    res.json({ results, overall_agreement: overallAgreement });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
