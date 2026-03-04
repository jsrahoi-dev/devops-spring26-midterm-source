// backend/routes/language.js
const express = require('express');
const router = express.Router();

// POST /api/language - Set user's native language
router.post('/', (req, res) => {
  const { language } = req.body;

  if (!language || language.trim() === '') {
    return res.status(400).json({ error: 'Language is required' });
  }

  req.session.language = language.trim();
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to save language' });
    }
    res.json({ success: true, language: req.session.language });
  });
});

// GET /api/language - Get user's language
router.get('/', (req, res) => {
  res.json({ language: req.session.language || null });
});

module.exports = router;
