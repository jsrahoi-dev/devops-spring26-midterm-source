# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign color classification UI with split-screen layout, add navigation, implement personal/global stats tracking, and integrate 3D cube toggle.

**Architecture:** Component-based React refactor with new Layout wrapper, split ColorClassifier into LeftPanel/RightPanel, add stats API endpoints to Express backend, track first-to-classify and controversial colors.

**Tech Stack:** React, React Router, Express.js, MySQL, Axios

---

## Prerequisites

Create feature branch and set up work environment.

**Step 1: Create feature branch**

```bash
cd /Users/unotest/dev/grad_school/devops/midterm/devops-spring26-midterm-source
git checkout -b feature/ui-redesign
```

**Step 2: Verify current structure**

```bash
# Check frontend structure
ls -la frontend/src/components/

# Check backend structure
ls -la backend/routes/
```

Expected: ColorClassifier.jsx, ColorCube3D.jsx, LanguageSelection.jsx, Results.jsx exist

**Step 3: Install any missing dependencies (if needed)**

```bash
cd frontend
npm install
cd ../backend
npm install
```

---

## Task 1: Database Schema Update

**Files:**
- Create: `backend/db/migrations/001_add_classified_at.sql`
- Test: Manual SQL verification

**Step 1: Create migration file**

```bash
mkdir -p backend/db/migrations
```

Create `backend/db/migrations/001_add_classified_at.sql`:

```sql
-- Add timestamp to track when classifications occur
ALTER TABLE responses
ADD COLUMN classified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index for first-to-classify queries
CREATE INDEX idx_classified_at ON responses(color_id, classified_at);
```

**Step 2: Apply migration to local dev database**

```bash
# Using docker-compose
docker-compose exec db mysql -u root -pdev_password color_app < backend/db/migrations/001_add_classified_at.sql
```

**Step 3: Verify migration**

```bash
docker-compose exec db mysql -u root -pdev_password color_app -e "DESCRIBE responses;"
```

Expected: See `classified_at` column in output

**Step 4: Commit**

```bash
git add backend/db/migrations/001_add_classified_at.sql
git commit -m "feat(db): add classified_at timestamp to responses table"
```

---

## Task 2: Backend - Personal Stats API

**Files:**
- Create: `backend/routes/stats.js`
- Modify: `backend/server.js` (add route)
- Test: Manual curl test

**Step 1: Create stats route file**

Create `backend/routes/stats.js`:

```javascript
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
```

**Step 2: Register route in server.js**

Modify `backend/server.js`, add after other route registrations:

```javascript
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);
```

**Step 3: Test endpoint with curl**

```bash
# Start dev server
docker-compose up -d

# Test endpoint (should return zeros for new session)
curl -c cookies.txt http://localhost:3000/api/stats/personal
```

Expected: `{"totalClassified":0,"firstToClassify":0,"controversialColors":[]}`

**Step 4: Commit**

```bash
git add backend/routes/stats.js backend/server.js
git commit -m "feat(api): add personal stats endpoint"
```

---

## Task 3: Backend - Global Stats API

**Files:**
- Modify: `backend/routes/stats.js`
- Test: Manual curl test

**Step 1: Add global stats endpoint**

Add to `backend/routes/stats.js`:

```javascript
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
```

**Step 2: Test endpoint**

```bash
curl http://localhost:3000/api/stats/global
```

Expected: JSON with totalColors: 20, other stats based on database state

**Step 3: Commit**

```bash
git add backend/routes/stats.js
git commit -m "feat(api): add global stats endpoint"
```

---

## Task 4: Backend - Update Response Endpoint

**Files:**
- Modify: `backend/routes/responses.js`
- Test: Manual curl test

**Step 1: Modify POST /api/responses to check first classification**

In `backend/routes/responses.js`, update the insert section:

```javascript
// After the "Check if already responded" block, before Insert response
// Check if this will be the first classification
const [firstCheckRows] = await db.query(
  'SELECT COUNT(*) as count FROM responses WHERE color_id = ?',
  [color_id]
);
const wasFirst = firstCheckRows[0].count === 0;

// Insert response (existing code stays the same)
await db.query(
  'INSERT INTO responses (session_id, color_id, user_classification) VALUES (?, ?, ?)',
  [sessionId, color_id, classification]
);

// Modified response to include wasFirst
res.json({ success: true, wasFirst });
```

**Step 2: Test with curl**

```bash
# Get a color
COLOR_ID=$(curl -s -c cookies.txt http://localhost:3000/api/colors/next | jq -r '.color.id')

# Submit classification
curl -s -b cookies.txt -X POST http://localhost:3000/api/responses \
  -H "Content-Type: application/json" \
  -d "{\"color_id\": $COLOR_ID, \"classification\": \"red\"}"
```

Expected: `{"success":true,"wasFirst":true}` (or false if already classified)

**Step 3: Commit**

```bash
git add backend/routes/responses.js
git commit -m "feat(api): return wasFirst flag in response endpoint"
```

---

## Task 5: Frontend - Create Navbar Component

**Files:**
- Create: `frontend/src/components/Navbar.jsx`
- Create: `frontend/src/components/Navbar.css`
- Test: Visual verification

**Step 1: Create Navbar component**

Create `frontend/src/components/Navbar.jsx`:

```jsx
import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">Color Perception Study</Link>
        </div>
        <div className="navbar-links">
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/about" className="nav-link">ABOUT</Link>
          <Link to="/blog" className="nav-link">BLOG</Link>
        </div>
      </div>
    </nav>
  )
}
```

**Step 2: Create Navbar styles**

Create `frontend/src/components/Navbar.css`:

```css
.navbar {
  height: 60px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-logo a {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-decoration: none;
}

.navbar-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #333;
}
```

**Step 3: Test by temporarily adding to App.jsx**

Modify `frontend/src/App.jsx` temporarily:

```jsx
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="App">
      <Navbar />
      {/* existing Routes... */}
    </div>
  )
}
```

**Step 4: Visual verification**

```bash
# Ensure dev server running
docker-compose up

# Visit http://localhost:3000
```

Expected: See navbar at top with logo and HOME/ABOUT/BLOG links

**Step 5: Revert temporary change, commit**

```bash
git add frontend/src/components/Navbar.jsx frontend/src/components/Navbar.css
git commit -m "feat(ui): add Navbar component"
```

---

## Task 6: Frontend - Create Layout Component

**Files:**
- Create: `frontend/src/components/Layout.jsx`
- Create: `frontend/src/components/Layout.css`
- Test: Visual verification

**Step 1: Create Layout wrapper**

Create `frontend/src/components/Layout.jsx`:

```jsx
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  )
}
```

**Step 2: Create Layout styles**

Create `frontend/src/components/Layout.css`:

```css
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
```

**Step 3: Update App.jsx to use Layout**

Modify `frontend/src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LanguageSelection from './components/LanguageSelection'
import ColorClassifier from './components/ColorClassifier'
import Results from './components/Results'
import ColorCube3D from './components/ColorCube3D'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LanguageSelection />} />
          <Route path="/classify" element={<ColorClassifier />} />
          <Route path="/results" element={<Results />} />
          <Route path="/explore" element={<ColorCube3D />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
```

**Step 4: Visual verification**

Visit http://localhost:3000 - navbar should appear on all pages

**Step 5: Commit**

```bash
git add frontend/src/components/Layout.jsx frontend/src/components/Layout.css frontend/src/App.jsx
git commit -m "feat(ui): add Layout wrapper with Navbar"
```

---

## Task 7: Frontend - Create About Page

**Files:**
- Create: `frontend/src/components/About.jsx`
- Create: `frontend/src/components/About.css`
- Modify: `frontend/src/App.jsx`
- Test: Visual verification

**Step 1: Create About component**

Create `frontend/src/components/About.jsx`:

```jsx
import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1>About This Project</h1>

        <section className="about-section">
          <h2>Purpose</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </section>

        <section className="about-section">
          <h2>Research Goals</h2>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
            in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
            doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
            veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
        </section>
      </div>
    </div>
  )
}
```

**Step 2: Create About styles**

Create `frontend/src/components/About.css`:

```css
.about-page {
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
}

.about-container h1 {
  font-size: 36px;
  margin-bottom: 30px;
  color: #333;
}

.about-section {
  margin-bottom: 30px;
}

.about-section h2 {
  font-size: 24px;
  margin-bottom: 15px;
  color: #444;
}

.about-section p {
  font-size: 16px;
  line-height: 1.6;
  color: #666;
}
```

**Step 3: Add route to App.jsx**

Modify `frontend/src/App.jsx`:

```jsx
import About from './components/About'

// Inside Routes, add:
<Route path="/about" element={<About />} />
```

**Step 4: Visual verification**

Visit http://localhost:3000/about

**Step 5: Commit**

```bash
git add frontend/src/components/About.jsx frontend/src/components/About.css frontend/src/App.jsx
git commit -m "feat(ui): add About page with placeholder content"
```

---

## Task 8: Frontend - Create Blog Page

**Files:**
- Create: `frontend/src/components/Blog.jsx`
- Create: `frontend/src/components/Blog.css`
- Modify: `frontend/src/App.jsx`
- Test: Visual verification

**Step 1: Create Blog component**

Create `frontend/src/components/Blog.jsx`:

```jsx
import './Blog.css'

export default function Blog() {
  return (
    <div className="blog-page">
      <div className="blog-container">
        <h1>DevOps Journey</h1>

        <article className="blog-post">
          <h2>Building a Cloud-Native Color Perception App</h2>
          <p className="blog-meta">March 8, 2026</p>

          <section>
            <h3>AWS Infrastructure</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Deployed to
              Amazon EC2 with RDS MySQL database. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </section>

          <section>
            <h3>CI/CD Pipeline</h3>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              dolore eu fugiat nulla pariatur. GitHub Actions automated deployment with
              Docker containerization.
            </p>
          </section>

          <section>
            <h3>Challenges & Learnings</h3>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
              doloremque laudantium. Learned about semantic versioning, blue-green
              deployments, and container orchestration.
            </p>
          </section>

          <section>
            <h3>Future Improvements</h3>
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.
              Planning to add Kubernetes, implement auto-scaling, and add monitoring dashboards.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
```

**Step 2: Create Blog styles**

Create `frontend/src/components/Blog.css`:

```css
.blog-page {
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
}

.blog-container h1 {
  font-size: 36px;
  margin-bottom: 30px;
  color: #333;
}

.blog-post {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.blog-post h2 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #333;
}

.blog-meta {
  font-size: 14px;
  color: #999;
  margin-bottom: 25px;
}

.blog-post section {
  margin-bottom: 25px;
}

.blog-post h3 {
  font-size: 20px;
  margin-bottom: 12px;
  color: #444;
}

.blog-post p {
  font-size: 16px;
  line-height: 1.6;
  color: #666;
}
```

**Step 3: Add route to App.jsx**

Modify `frontend/src/App.jsx`:

```jsx
import Blog from './components/Blog'

// Inside Routes, add:
<Route path="/blog" element={<Blog />} />
```

**Step 4: Visual verification**

Visit http://localhost:3000/blog

**Step 5: Commit**

```bash
git add frontend/src/components/Blog.jsx frontend/src/components/Blog.css frontend/src/App.jsx
git commit -m "feat(ui): add Blog page with DevOps writeup placeholder"
```

---

## Task 9: Frontend - Create StatsView Component

**Files:**
- Create: `frontend/src/components/StatsView.jsx`
- Create: `frontend/src/components/StatsView.css`
- Test: Storybook-style test (component in isolation)

**Step 1: Create StatsView component**

Create `frontend/src/components/StatsView.jsx`:

```jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import './StatsView.css'

export default function StatsView() {
  const [personalStats, setPersonalStats] = useState(null)
  const [globalStats, setGlobalStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [personalRes, globalRes] = await Promise.all([
        axios.get('/api/stats/personal'),
        axios.get('/api/stats/global')
      ])

      setPersonalStats(personalRes.data)
      setGlobalStats(globalRes.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load statistics')
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="stats-view loading">Loading stats...</div>
  }

  if (error) {
    return <div className="stats-view error">{error}</div>
  }

  return (
    <div className="stats-view">
      <section className="stats-section personal-stats">
        <h3>Your Stats</h3>
        <div className="stat-item">
          <span className="stat-icon">🎨</span>
          <span className="stat-label">Colors Classified:</span>
          <span className="stat-value">{personalStats.totalClassified}/20</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🥇</span>
          <span className="stat-label">First to Classify:</span>
          <span className="stat-value">{personalStats.firstToClassify}</span>
        </div>

        {personalStats.controversialColors.length > 0 && (
          <div className="controversial-section">
            <h4>⚡ Most Controversial:</h4>
            {personalStats.controversialColors.map(color => (
              <div key={color.id} className="controversial-item">
                <div
                  className="color-swatch"
                  style={{ backgroundColor: color.hex }}
                ></div>
                <div className="controversial-details">
                  <div className="color-hex">{color.hex}</div>
                  <div className="classifications">
                    You: <strong>{color.yourClassification}</strong> |
                    Most: <strong>{color.majorityClassification}</strong>
                  </div>
                  <div className="disagreement">
                    {color.disagreementCount} people disagreed
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stats-section global-stats">
        <h3>Platform Stats</h3>
        <div className="stat-item">
          <span className="stat-icon">📊</span>
          <span className="stat-label">Total Classifications:</span>
          <span className="stat-value">{globalStats.totalClassifications}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">👥</span>
          <span className="stat-label">Unique Users:</span>
          <span className="stat-value">{globalStats.uniqueUsers}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌈</span>
          <span className="stat-label">Coverage:</span>
          <span className="stat-value">
            {globalStats.percentageCovered}% ({globalStats.totalColors})
          </span>
        </div>
        {globalStats.mostClassifiedColor && (
          <div className="stat-item">
            <span className="stat-icon">🔥</span>
            <span className="stat-label">Most Classified:</span>
            <span className="stat-value">
              <div
                className="color-swatch-inline"
                style={{ backgroundColor: globalStats.mostClassifiedColor.hex }}
              ></div>
              {globalStats.mostClassifiedColor.hex} ({globalStats.mostClassifiedColor.count})
            </span>
          </div>
        )}
      </section>
    </div>
  )
}
```

**Step 2: Create StatsView styles**

Create `frontend/src/components/StatsView.css`:

```css
.stats-view {
  padding: 20px;
  overflow-y: auto;
  height: 100%;
}

.stats-view.loading,
.stats-view.error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.stats-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stats-section h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #ddd;
  padding-bottom: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  gap: 10px;
}

.stat-icon {
  font-size: 24px;
}

.stat-label {
  flex: 1;
  color: #666;
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.controversial-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.controversial-section h4 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #555;
}

.controversial-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 10px;
}

.color-swatch {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  border: 2px solid #ddd;
  flex-shrink: 0;
}

.color-swatch-inline {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #ddd;
  display: inline-block;
}

.controversial-details {
  flex: 1;
}

.color-hex {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.classifications {
  font-size: 14px;
  color: #666;
  margin-bottom: 2px;
}

.classifications strong {
  color: #333;
  text-transform: capitalize;
}

.disagreement {
  font-size: 12px;
  color: #999;
}
```

**Step 3: Test component (temporarily add to a route)**

For testing, temporarily modify App.jsx to add a test route:

```jsx
import StatsView from './components/StatsView'

// Add route:
<Route path="/test-stats" element={<StatsView />} />
```

**Step 4: Visual verification**

Visit http://localhost:3000/test-stats

Expected: See stats sections (may be empty if no data)

**Step 5: Remove test route, commit**

```bash
git add frontend/src/components/StatsView.jsx frontend/src/components/StatsView.css
git commit -m "feat(ui): add StatsView component for personal and global stats"
```

---

## Task 10: Frontend - Create ViewToggle Component

**Files:**
- Create: `frontend/src/components/ViewToggle.jsx`
- Create: `frontend/src/components/ViewToggle.css`
- Test: Visual verification

**Step 1: Create ViewToggle component**

Create `frontend/src/components/ViewToggle.jsx`:

```jsx
import './ViewToggle.css'

export default function ViewToggle({ activeView, onViewChange }) {
  return (
    <div className="view-toggle">
      <button
        className={`toggle-button ${activeView === 'stats' ? 'active' : ''}`}
        onClick={() => onViewChange('stats')}
      >
        📊 Stats
      </button>
      <button
        className={`toggle-button ${activeView === 'cube' ? 'active' : ''}`}
        onClick={() => onViewChange('cube')}
      >
        🎨 Cube
      </button>
    </div>
  )
}
```

**Step 2: Create ViewToggle styles**

Create `frontend/src/components/ViewToggle.css`:

```css
.view-toggle {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-button {
  flex: 1;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-button:hover {
  background: #e8e8e8;
}

.toggle-button.active {
  background: #4CAF50;
  color: white;
}

.toggle-button:first-child {
  border-right: 1px solid #ddd;
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/ViewToggle.jsx frontend/src/components/ViewToggle.css
git commit -m "feat(ui): add ViewToggle component for stats/cube switching"
```

---

## Task 11: Frontend - Create LeftPanel Component

**Files:**
- Create: `frontend/src/components/LeftPanel.jsx`
- Create: `frontend/src/components/LeftPanel.css`
- Test: Visual verification

**Step 1: Create LeftPanel component**

Create `frontend/src/components/LeftPanel.jsx`:

```jsx
import './LeftPanel.css'

export default function LeftPanel({ color, onClassify, loading }) {
  const classifications = [
    'pink', 'red', 'orange', 'yellow', 'green',
    'blue', 'purple', 'brown', 'black', 'white', 'grey'
  ]

  if (loading) {
    return (
      <div className="left-panel" style={{ backgroundColor: '#ccc' }}>
        <div className="loading-message">Loading color...</div>
      </div>
    )
  }

  return (
    <div className="left-panel" style={{ backgroundColor: color?.hex || '#fff' }}>
      <div className="classification-container">
        <h2 className="classification-prompt">What color is this?</h2>

        <div className="classification-buttons">
          {classifications.map(classification => (
            <button
              key={classification}
              onClick={() => onClassify(classification)}
              className="classification-button"
            >
              {classification}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create LeftPanel styles**

Create `frontend/src/components/LeftPanel.css`:

```css
.left-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: calc(100vh - 60px);
}

.loading-message {
  color: white;
  font-size: 24px;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.classification-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.classification-prompt {
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  font-size: 32px;
  text-align: center;
  margin-bottom: 40px;
}

.classification-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.classification-button {
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: pointer;
  text-transform: capitalize;
  transition: all 0.2s;
}

.classification-button:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.classification-button:active {
  transform: scale(0.98);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .classification-prompt {
    font-size: 24px;
  }

  .classification-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/LeftPanel.jsx frontend/src/components/LeftPanel.css
git commit -m "feat(ui): add LeftPanel component for color classification"
```

---

## Task 12: Frontend - Create RightPanel Component

**Files:**
- Create: `frontend/src/components/RightPanel.jsx`
- Create: `frontend/src/components/RightPanel.css`
- Test: Visual verification

**Step 1: Create RightPanel component**

Create `frontend/src/components/RightPanel.jsx`:

```jsx
import { useState } from 'react'
import ViewToggle from './ViewToggle'
import StatsView from './StatsView'
import ColorCube3D from './ColorCube3D'
import './RightPanel.css'

export default function RightPanel({ onStatsRefresh }) {
  const [activeView, setActiveView] = useState('stats')

  return (
    <div className="right-panel">
      <ViewToggle activeView={activeView} onViewChange={setActiveView} />

      <div className="right-panel-content">
        {activeView === 'stats' && <StatsView key={onStatsRefresh} />}
        {activeView === 'cube' && <ColorCube3D />}
      </div>
    </div>
  )
}
```

**Step 2: Create RightPanel styles**

Create `frontend/src/components/RightPanel.css`:

```css
.right-panel {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 20px;
  min-height: calc(100vh - 60px);
  overflow: hidden;
}

.right-panel-content {
  flex: 1;
  overflow: auto;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .right-panel {
    min-height: auto;
    height: 50vh;
  }
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/RightPanel.jsx frontend/src/components/RightPanel.css
git commit -m "feat(ui): add RightPanel component with toggle functionality"
```

---

## Task 13: Frontend - Refactor ColorClassifier

**Files:**
- Modify: `frontend/src/components/ColorClassifier.jsx`
- Create: `frontend/src/components/ColorClassifier.css`
- Test: Full integration test

**Step 1: Refactor ColorClassifier to use split layout**

Replace content of `frontend/src/components/ColorClassifier.jsx`:

```jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import './ColorClassifier.css'

export default function ColorClassifier() {
  const [color, setColor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  useEffect(() => {
    fetchColor()
  }, [])

  const fetchColor = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/colors/next')

      if (data.done) {
        // All colors classified - still show interface with stats
        setColor(null)
        setLoading(false)
      } else {
        setColor(data.color)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching color:', error)
      setLoading(false)
    }
  }

  const handleClassification = async (classification) => {
    if (!color) return

    try {
      const response = await axios.post('/api/responses', {
        color_id: color.id,
        classification
      })

      // Show badge if user was first
      if (response.data.wasFirst) {
        console.log('🥇 You were first to classify this color!')
        // Could add toast notification here
      }

      // Refresh stats
      setStatsRefreshKey(prev => prev + 1)

      // Fetch next color
      await fetchColor()
    } catch (error) {
      console.error('Error submitting classification:', error)
      alert('Failed to save your answer. Please try again.')
    }
  }

  return (
    <div className="color-classifier">
      <LeftPanel
        color={color}
        onClassify={handleClassification}
        loading={loading}
      />
      <RightPanel onStatsRefresh={statsRefreshKey} />
    </div>
  )
}
```

**Step 2: Create ColorClassifier styles**

Create `frontend/src/components/ColorClassifier.css`:

```css
.color-classifier {
  display: flex;
  width: 100%;
  height: calc(100vh - 60px);
}

.color-classifier > * {
  width: 50%;
}

/* Mobile responsive - stack vertically */
@media (max-width: 768px) {
  .color-classifier {
    flex-direction: column;
    height: auto;
  }

  .color-classifier > * {
    width: 100%;
  }
}
```

**Step 3: Test full integration**

```bash
# Ensure dev server running
docker-compose up

# Visit http://localhost:3000/classify
```

Expected:
- Left half shows color with classification buttons
- Right half shows stats with toggle to cube
- Clicking classification saves and updates stats

**Step 4: Commit**

```bash
git add frontend/src/components/ColorClassifier.jsx frontend/src/components/ColorClassifier.css
git commit -m "feat(ui): refactor ColorClassifier to split-screen layout"
```

---

## Task 14: Frontend - Update Home Page

**Files:**
- Modify: `frontend/src/components/LanguageSelection.jsx` (or create new Home.jsx)
- Test: Visual verification

**Step 1: Decide approach**

Option A: Rename LanguageSelection to Home and keep language selection
Option B: Create new Home page and keep LanguageSelection separate

Going with Option A (simpler):

**Step 2: Update component to be more welcoming**

Modify `frontend/src/components/LanguageSelection.jsx` (just add welcome text, keep existing functionality):

Add at the top of the return statement:

```jsx
return (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '40px' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>Color Perception Study</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        Help us understand how people perceive and name colors across different languages and cultures.
      </p>
    </div>

    {/* existing language selection UI below this */}
```

**Step 3: Visual verification**

Visit http://localhost:3000

**Step 4: Commit**

```bash
git add frontend/src/components/LanguageSelection.jsx
git commit -m "feat(ui): add welcoming intro text to home page"
```

---

## Task 15: Testing & Verification

**Files:**
- Test: End-to-end workflow
- Document: Test results

**Step 1: Test classification flow**

```bash
# Start fresh session
# Visit http://localhost:3000
# 1. Select language
# 2. Classify a color
# 3. Check stats update
# 4. Toggle to cube view
# 5. Toggle back to stats
# 6. Continue classifying
```

**Step 2: Test stats accuracy**

```bash
# Classify several colors
# Check "Total Classified" matches number classified
# Open incognito window, classify same color
# Original window should show controversy if different classification
```

**Step 3: Test navigation**

```bash
# Click HOME, ABOUT, BLOG in navbar
# Verify all pages load
# Navbar should be present on all pages
```

**Step 4: Test responsive design**

```bash
# Resize browser to mobile width (<768px)
# Classification page should stack vertically
# Buttons should still be clickable
# Stats should be scrollable
```

**Step 5: Document any issues**

Create test notes file if issues found.

**Step 6: Commit any fixes**

```bash
# If fixes needed:
git add <files>
git commit -m "fix: <description>"
```

---

## Task 16: Build & Local Testing

**Files:**
- Test: Docker build
- Test: Production mode

**Step 1: Build frontend for production**

```bash
cd frontend
npm run build
```

Expected: `dist/` directory created with built assets

**Step 2: Test with docker-compose**

```bash
# From project root
docker-compose down
docker-compose build
docker-compose up
```

**Step 3: Verify app works at http://localhost:3000**

Test all features in production mode.

**Step 4: Check for console errors**

Open browser DevTools, check for JavaScript errors.

**Step 5: Commit if build config changes needed**

```bash
# If any changes needed
git add <files>
git commit -m "build: fix production build issues"
```

---

## Task 17: Documentation

**Files:**
- Create: `docs/UI_REDESIGN.md`
- Update: `README.md` (if needed)

**Step 1: Create UI redesign documentation**

Create `docs/UI_REDESIGN.md`:

```markdown
# UI Redesign - Split Screen Layout

## Overview

The color classification interface has been redesigned with a split-screen layout and statistics tracking.

## Features

### Split-Screen Layout
- Left 50%: Full-screen color background with classification buttons
- Right 50%: Stats panel with toggle to 3D cube visualization

### Navigation
- Persistent navbar on all pages
- HOME: Landing page with language selection
- ABOUT: Project description
- BLOG: DevOps project writeup

### Statistics Tracking

**Personal Stats:**
- Total colors classified
- Count of colors you were first to classify
- Most controversial colors (where your classification differs from majority)

**Global Stats:**
- Total classifications across all users
- Unique users count
- Coverage percentage
- Most classified color

### Toggle View
- Switch between Stats and 3D Cube visualization
- State managed within classification session

## API Endpoints

### GET /api/stats/personal
Returns user's personal statistics based on session.

### GET /api/stats/global
Returns platform-wide statistics.

### POST /api/responses
Modified to return `wasFirst` flag indicating if user was first to classify the color.

## Database Changes

Added `classified_at` timestamp column to `responses` table to track first classifications.

## Components

- `Layout.jsx` - Wrapper with navbar
- `Navbar.jsx` - Top navigation
- `ColorClassifier.jsx` - Main classification page
- `LeftPanel.jsx` - Color display and classification buttons
- `RightPanel.jsx` - Stats/cube container
- `ViewToggle.jsx` - Toggle between views
- `StatsView.jsx` - Statistics display
- `About.jsx` - About page
- `Blog.jsx` - Blog page

## Testing

1. Classify colors and verify stats update
2. Check "first to classify" badge
3. Toggle between stats and cube views
4. Navigate between pages using navbar
5. Test responsive design on mobile

## Future Enhancements

- Toast notifications for "first to classify"
- Leaderboards
- Export statistics
- Real-time updates
```

**Step 2: Update main README if needed**

Check if `README.md` needs updates for new features.

**Step 3: Commit documentation**

```bash
git add docs/UI_REDESIGN.md
git commit -m "docs: add UI redesign documentation"
```

---

## Task 18: Final Review & PR Preparation

**Files:**
- Review: All changes
- Test: Complete workflow
- Prepare: PR description

**Step 1: Review all commits**

```bash
git log --oneline origin/main..HEAD
```

Expected: See all feature commits in logical order

**Step 2: Final end-to-end test**

```bash
# Fresh browser session
# Test complete user journey:
# 1. Home -> language selection
# 2. Classify all 20 colors
# 3. Check stats accuracy
# 4. Toggle cube view
# 5. Navigate to About/Blog
# 6. Check responsive on mobile
```

**Step 3: Check for console errors/warnings**

Open DevTools, look for any issues.

**Step 4: Create PR description**

Save to `PR_DESCRIPTION.md`:

```markdown
# UI Redesign: Split-Screen Layout, Navigation & Stats

## Summary

Implements comprehensive UI redesign with split-screen classification interface, navigation system, and user statistics tracking.

## Changes

### Frontend
- ✅ Split-screen layout (50% color, 50% stats/cube)
- ✅ Persistent navigation bar (HOME | ABOUT | BLOG)
- ✅ Personal stats (classified count, first-to-classify, controversial colors)
- ✅ Global stats (total classifications, users, coverage)
- ✅ Toggle between stats and 3D cube views
- ✅ About and Blog pages with placeholder content
- ✅ Removed artificial 5-color limit
- ✅ Responsive design for mobile

### Backend
- ✅ `/api/stats/personal` endpoint
- ✅ `/api/stats/global` endpoint
- ✅ Modified `/api/responses` to return `wasFirst` flag
- ✅ Database migration: added `classified_at` column

### Components Created
- `Layout.jsx` - Navigation wrapper
- `Navbar.jsx` - Top navigation bar
- `LeftPanel.jsx` - Color classification area
- `RightPanel.jsx` - Stats/cube container
- `ViewToggle.jsx` - Toggle component
- `StatsView.jsx` - Statistics display
- `About.jsx` - About page
- `Blog.jsx` - Blog page

## Testing

- ✅ Classification flow works end-to-end
- ✅ Stats update correctly after each classification
- ✅ First-to-classify tracking accurate
- ✅ Controversy calculation works
- ✅ Toggle between stats and cube functional
- ✅ Navigation works across all pages
- ✅ Responsive on mobile devices
- ✅ No console errors

## Screenshots

[Add screenshots if desired]

## Database Migration

Run migration on QA/RC environments:
```sql
ALTER TABLE responses ADD COLUMN classified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX idx_classified_at ON responses(color_id, classified_at);
```

## Deployment

1. Merge PR to main
2. Merge main to rc branch
3. Semantic release creates RC tag
4. RC workflow deploys to https://rc.rahoi.dev
5. Run database migration on RC
6. Test on RC environment
```

**Step 5: Push branch**

```bash
git push -u origin feature/ui-redesign
```

**Step 6: Create PR on GitHub**

Go to GitHub and create PR from `feature/ui-redesign` to `main`.

---

## Task 19: Post-Merge - RC Deployment

**Files:**
- Execute: Merge workflow
- Test: RC environment

**Step 1: After PR is merged to main**

```bash
git checkout main
git pull origin main
```

**Step 2: Merge to rc branch**

```bash
git checkout rc
git merge main
git push origin rc
```

**Step 3: Watch semantic release**

Semantic release will analyze commits and create version tag (e.g., `v1.1.0-rc1`).

**Step 4: Monitor RC workflow**

Visit: https://github.com/jsrahoi-dev/devops-spring26-midterm-source/actions

Watch for:
- RC Release workflow (builds image)
- RC Deployment workflow (deploys to RC)

**Step 5: Run database migration on RC**

```bash
ssh -i ~/.ssh/color-perception-key.pem ec2-user@52.14.53.114 \
  "docker run --rm mysql:8 mysql -h color-perception-db.c908ea8wy9z2.us-east-2.rds.amazonaws.com -u admin -pAKIA5CVOWGXDHXAIV3ED color_app_rc < /dev/stdin" << 'EOF'
ALTER TABLE responses ADD COLUMN classified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX idx_classified_at ON responses(color_id, classified_at);
EOF
```

**Step 6: Test on RC environment**

Once DNS propagates, visit: https://rc.rahoi.dev

Test all features:
- Classification flow
- Stats accuracy
- Toggle functionality
- Navigation
- Responsive design

**Step 7: Document RC deployment**

Create deployment notes if issues encountered.

---

## Completion Checklist

- [ ] Database migration applied (local, RC)
- [ ] All components created and tested
- [ ] Backend API endpoints functional
- [ ] Stats calculations accurate
- [ ] Split-screen layout works
- [ ] Navigation bar on all pages
- [ ] About and Blog pages created
- [ ] Toggle between stats/cube works
- [ ] Responsive design verified
- [ ] No console errors
- [ ] Documentation complete
- [ ] PR created and merged
- [ ] RC deployment successful
- [ ] RC environment tested

---

## Total Estimated Time

- Database migration: 15 min
- Backend APIs: 1.5 hours
- Frontend components: 4-5 hours
- Testing & fixes: 1-2 hours
- Documentation: 30 min
- PR & deployment: 30 min

**Total: 8-10 hours**

---

## Notes

- Use conventional commits for semantic versioning
- Test locally before pushing
- Database migrations must run on both QA and RC
- Stats are per-environment (QA vs RC separate)
- First-to-classify tracks timestamp order
- Controversy shows top 3 disagreements

---

End of Implementation Plan
