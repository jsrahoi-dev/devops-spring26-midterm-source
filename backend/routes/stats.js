const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/stats/personal - Get user's personal statistics
router.get('/personal', async (req, res) => {
  try {
    const sessionId = req.session.id;

    // Count total classifications
    const [totalRows] = await db.query(
      'SELECT COUNT(*) as count FROM responses WHERE session_id = ?',
      [sessionId]
    );
    const totalClassified = totalRows[0].count;

    // Count first-to-classify
    const [firstRows] = await db.query(`
      SELECT COUNT(*) as count
      FROM responses r1
      WHERE r1.session_id = ?
        AND r1.classified_at = (
          SELECT MIN(classified_at)
          FROM responses r2
          WHERE r2.color_id = r1.color_id
        )
    `, [sessionId]);
    const firstToClassify = firstRows[0].count;

    // Get controversial colors (where user disagrees with majority)
    const [controversialRows] = await db.query(`
      SELECT
        c.id,
        c.hex,
        r.user_classification as yourClassification,
        (
          SELECT user_classification
          FROM responses r2
          WHERE r2.color_id = c.id
          GROUP BY user_classification
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as majorityClassification,
        (
          SELECT COUNT(*)
          FROM responses r3
          WHERE r3.color_id = c.id
        ) as totalResponses
      FROM responses r
      JOIN colors c ON r.color_id = c.id
      WHERE r.session_id = ?
        AND r.user_classification != (
          SELECT user_classification
          FROM responses r2
          WHERE r2.color_id = c.id
          GROUP BY user_classification
          ORDER BY COUNT(*) DESC
          LIMIT 1
        )
      ORDER BY totalResponses DESC
      LIMIT 3
    `, [sessionId]);

    const controversialColors = controversialRows.map(row => ({
      id: row.id,
      hex: row.hex,
      yourClassification: row.yourClassification,
      majorityClassification: row.majorityClassification,
      disagreementCount: row.totalResponses
    }));

    res.json({
      totalClassified,
      firstToClassify,
      controversialColors
    });
  } catch (error) {
    console.error('Error fetching personal stats:', error);
    res.status(500).json({ error: 'Failed to fetch personal stats' });
  }
});

module.exports = router;
