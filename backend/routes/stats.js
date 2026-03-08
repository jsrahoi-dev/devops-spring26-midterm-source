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
    // Total colors
    const [totalColorsRows] = await db.query('SELECT COUNT(*) as count FROM colors');
    const totalColors = totalColorsRows[0].count;

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

    // Coverage (colors with at least one classification)
    const [coverageRows] = await db.query(`
      SELECT COUNT(DISTINCT color_id) as count
      FROM responses
    `);
    const colorsClassified = coverageRows[0].count;
    const percentageCovered = totalColors > 0
      ? ((colorsClassified / totalColors) * 100).toFixed(1)
      : 0;

    // Most classified color
    const [mostClassifiedRows] = await db.query(`
      SELECT c.id, c.hex, COUNT(*) as count
      FROM responses r
      JOIN colors c ON r.color_id = c.id
      GROUP BY c.id, c.hex
      ORDER BY count DESC
      LIMIT 1
    `);

    const mostClassifiedColor = mostClassifiedRows.length > 0
      ? {
          id: mostClassifiedRows[0].id,
          hex: mostClassifiedRows[0].hex,
          count: mostClassifiedRows[0].count
        }
      : null;

    res.json({
      totalColors,
      totalClassifications,
      uniqueUsers,
      percentageCovered: parseFloat(percentageCovered),
      mostClassifiedColor
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
});

module.exports = router;
