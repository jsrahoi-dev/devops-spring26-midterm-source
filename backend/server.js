require('dotenv').config();
const express = require('express');
const db = require('./db/connection');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
