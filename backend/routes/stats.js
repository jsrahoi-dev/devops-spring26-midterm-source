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

    // Count first-to-classify (user was first to classify specific RGB)
    const [firstRows] = await db.query(`
      SELECT COUNT(*) as count
      FROM responses r1
      WHERE r1.session_id = ?
        AND r1.classified_at = (
          SELECT MIN(classified_at)
          FROM responses r2
          WHERE r2.rgb_r = r1.rgb_r
            AND r2.rgb_g = r1.rgb_g
            AND r2.rgb_b = r1.rgb_b
        )
    `, [sessionId]);
    const firstToClassify = firstRows[0].count;

    res.json({
      totalClassified,
      firstToClassify
    });
  } catch (error) {
    console.error('Error fetching personal stats:', error);
    res.status(500).json({ error: 'Failed to fetch personal stats' });
  }
});

// GET /api/stats/global - Get platform-wide statistics
router.get('/global', async (req, res) => {
  try {
    // Total classifications
    const [totalClassificationsRows] = await db.query(
      'SELECT COUNT(*) as count FROM responses'
    );
    const totalClassifications = totalClassificationsRows[0].count;

    // Unique users
    const [uniqueUsersRows] = await db.query(
      'SELECT COUNT(DISTINCT session_id) as count FROM responses'
    );
    const uniqueUsers = uniqueUsersRows[0].count;

    // Total colors classified (distinct RGB combinations)
    const [totalColorsRows] = await db.query(`
      SELECT COUNT(DISTINCT CONCAT(rgb_r, '-', rgb_g, '-', rgb_b)) as count
      FROM responses
    `);
    const totalColorsClassified = totalColorsRows[0].count;

    // Most classified color
    const [mostClassifiedRows] = await db.query(`
      SELECT
        rgb_r,
        rgb_g,
        rgb_b,
        COUNT(*) as count
      FROM responses
      GROUP BY rgb_r, rgb_g, rgb_b
      ORDER BY count DESC
      LIMIT 1
    `);

    const mostClassifiedColor = mostClassifiedRows.length > 0
      ? {
          rgb: {
            r: mostClassifiedRows[0].rgb_r,
            g: mostClassifiedRows[0].rgb_g,
            b: mostClassifiedRows[0].rgb_b
          },
          count: mostClassifiedRows[0].count
        }
      : null;

    res.json({
      totalClassifications,
      uniqueUsers,
      totalColorsClassified,
      mostClassifiedColor
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
});

module.exports = router;
