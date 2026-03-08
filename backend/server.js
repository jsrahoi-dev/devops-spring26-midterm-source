require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db/connection');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: false, // We created it manually
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Trust nginx reverse proxy for secure cookies and session persistence
app.set('trust proxy', 1);

app.use(session({
  key: 'color_session',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

const languageRoutes = require('./routes/language');
app.use('/api/language', languageRoutes);

const colorsRoutes = require('./routes/colors');
app.use('/api/colors', colorsRoutes);

const responsesRoutes = require('./routes/responses');
app.use('/api/responses', responsesRoutes);

const resultsRoutes = require('./routes/results');
app.use('/api/results', resultsRoutes);

const visualizeRoutes = require('./routes/visualize');
app.use('/api/visualize', visualizeRoutes);

const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'public')));

// Handle React routing - send all other requests to index.html
// This catches all GET requests that haven't been handled by API routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
