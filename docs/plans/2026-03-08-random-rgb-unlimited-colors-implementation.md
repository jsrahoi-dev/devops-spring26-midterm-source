# Random RGB Unlimited Color Collection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor from 20 pre-selected colors to unlimited random RGB color exploration across 16.7M color space

**Architecture:** Denormalize responses table with RGB columns, generate random colors on-the-fly, fix session persistence with proxy trust, update stats for unlimited colors

**Tech Stack:** Node.js, Express, MySQL, React 19, Three.js

---

## Task 1: Fix Session Persistence (Trust Proxy)

**Files:**
- Modify: `backend/server.js`

**Step 1: Add trust proxy setting**

Add this line BEFORE the `app.use(session(...))` call (around line 27):

```javascript
app.use(express.json());

// Trust nginx reverse proxy for secure cookies and session persistence
app.set('trust proxy', 1);

app.use(session({
```

**Step 2: Verify placement**

Run: `grep -A 3 "trust proxy" backend/server.js`
Expected: Shows the line before session middleware

**Step 3: Commit**

```bash
git add backend/server.js
git commit -m "fix: trust nginx proxy for session persistence"
```

---

## Task 2: Create Database Migration File

**Files:**
- Create: `backend/db/migrations/002_rgb_unlimited_colors.sql`

**Step 1: Create migration file**

```sql
-- Migration 002: Add RGB columns to responses table for unlimited color collection
-- This allows storing any RGB color without pre-seeding the colors table

-- Step 1: Add RGB columns (nullable initially for backfill)
ALTER TABLE responses
  ADD COLUMN rgb_r_new TINYINT UNSIGNED AFTER session_id,
  ADD COLUMN rgb_g_new TINYINT UNSIGNED AFTER rgb_r_new,
  ADD COLUMN rgb_b_new TINYINT UNSIGNED AFTER rgb_g_new,
  ADD COLUMN hex_new VARCHAR(7) AFTER rgb_b_new;

-- Step 2: Backfill from colors table
UPDATE responses r
JOIN colors c ON r.color_id = c.id
SET r.rgb_r_new = c.rgb_r,
    r.rgb_g_new = c.rgb_g,
    r.rgb_b_new = c.rgb_b,
    r.hex_new = c.hex;

-- Step 3: Make columns NOT NULL (now that backfill is complete)
ALTER TABLE responses
  MODIFY COLUMN rgb_r_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN rgb_g_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN rgb_b_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN hex_new VARCHAR(7) NOT NULL;

-- Step 4: Drop FK constraint and color_id column
ALTER TABLE responses
  DROP FOREIGN KEY responses_ibfk_2;

ALTER TABLE responses
  DROP COLUMN color_id;

-- Step 5: Rename new columns to final names
ALTER TABLE responses
  CHANGE COLUMN rgb_r_new rgb_r TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN rgb_g_new rgb_g TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN rgb_b_new rgb_b TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN hex_new hex VARCHAR(7) NOT NULL;

-- Step 6: Add index for RGB lookups
ALTER TABLE responses
  ADD INDEX idx_rgb (rgb_r, rgb_g, rgb_b);

-- Rollback script (if needed):
-- ALTER TABLE responses DROP INDEX idx_rgb;
-- ALTER TABLE responses ADD COLUMN color_id INT;
-- ALTER TABLE responses ADD FOREIGN KEY (color_id) REFERENCES colors(id);
-- ALTER TABLE responses DROP COLUMN rgb_r, DROP COLUMN rgb_g, DROP COLUMN rgb_b, DROP COLUMN hex;
```

**Step 2: Verify file created**

Run: `cat backend/db/migrations/002_rgb_unlimited_colors.sql | head -20`
Expected: Shows migration SQL

**Step 3: Commit**

```bash
git add backend/db/migrations/002_rgb_unlimited_colors.sql
git commit -m "feat: add migration for RGB columns in responses table"
```

---

## Task 3: Run Migration Locally (Docker Compose)

**Files:**
- None (database operation)

**Step 1: Connect to local MySQL**

```bash
docker-compose exec db mysql -u root -ptest color_app
```

Expected: MySQL prompt appears

**Step 2: Show current responses structure**

```sql
DESCRIBE responses;
```

Expected: Shows color_id column, no RGB columns

**Step 3: Run migration**

```sql
SOURCE /backend/db/migrations/002_rgb_unlimited_colors.sql;
```

Expected: Multiple "Query OK" messages, no errors

**Step 4: Verify new structure**

```sql
DESCRIBE responses;
```

Expected: Shows rgb_r, rgb_g, rgb_b, hex columns; no color_id

**Step 5: Exit MySQL**

```sql
exit;
```

**Step 6: Document completion**

No commit needed (database change only)

---

## Task 4: Update `/api/colors/next` Endpoint

**Files:**
- Modify: `backend/routes/colors.js`

**Step 1: Replace endpoint logic**

Replace the entire `router.get('/next', ...)` function with:

```javascript
// GET /api/colors/next - Generate random RGB color for classification
router.get('/next', async (req, res) => {
  try {
    const sessionId = req.session.id;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (attempts < MAX_ATTEMPTS) {
      // Generate random RGB (0-255 for each channel)
      const rgb_r = Math.floor(Math.random() * 256);
      const rgb_g = Math.floor(Math.random() * 256);
      const rgb_b = Math.floor(Math.random() * 256);

      // Convert to hex
      const hex = '#' +
        rgb_r.toString(16).padStart(2, '0') +
        rgb_g.toString(16).padStart(2, '0') +
        rgb_b.toString(16).padStart(2, '0');

      // Check if user already classified this exact RGB
      const [existing] = await db.query(`
        SELECT 1 FROM responses
        WHERE session_id = ? AND rgb_r = ? AND rgb_g = ? AND rgb_b = ?
        LIMIT 1
      `, [sessionId, rgb_r, rgb_g, rgb_b]);

      if (existing.length === 0) {
        // Not yet classified by this user - return it
        return res.json({ rgb_r, rgb_g, rgb_b, hex: hex.toUpperCase() });
      }

      attempts++;
    }

    // After 3 attempts, just return a color (collision unlikely)
    const rgb_r = Math.floor(Math.random() * 256);
    const rgb_g = Math.floor(Math.random() * 256);
    const rgb_b = Math.floor(Math.random() * 256);
    const hex = '#' +
      rgb_r.toString(16).padStart(2, '0') +
      rgb_g.toString(16).padStart(2, '0') +
      rgb_b.toString(16).padStart(2, '0');

    res.json({ rgb_r, rgb_g, rgb_b, hex: hex.toUpperCase() });
  } catch (error) {
    console.error('Error generating random color:', error);
    res.status(500).json({ error: 'Failed to generate color' });
  }
});
```

**Step 2: Remove `/count` endpoint**

Delete the `router.get('/count', ...)` function entirely (no longer needed).

**Step 3: Test locally**

Run: `curl http://localhost:3000/api/colors/next`
Expected: JSON with rgb_r, rgb_g, rgb_b, hex (random values)

**Step 4: Test multiple calls**

Run: `for i in {1..5}; do curl -s http://localhost:3000/api/colors/next | jq '.hex'; done`
Expected: 5 different hex colors

**Step 5: Commit**

```bash
git add backend/routes/colors.js
git commit -m "feat: generate random RGB colors instead of querying colors table"
```

---

## Task 5: Update `/api/responses` Endpoint

**Files:**
- Modify: `backend/routes/responses.js`

**Step 1: Update request body destructuring**

Change line 13 from:
```javascript
const { color_id, classification } = req.body;
```

To:
```javascript
const { rgb_r, rgb_g, rgb_b, hex, classification } = req.body;
```

**Step 2: Update validation**

Replace lines 15-24 with:
```javascript
if (rgb_r === undefined || rgb_g === undefined || rgb_b === undefined || !hex || !classification) {
  return res.status(400).json({ error: 'rgb_r, rgb_g, rgb_b, hex, and classification are required' });
}

// Validate RGB range
if (rgb_r < 0 || rgb_r > 255 || rgb_g < 0 || rgb_g > 255 || rgb_b < 0 || rgb_b > 255) {
  return res.status(400).json({ error: 'RGB values must be between 0 and 255' });
}

if (!VALID_CLASSIFICATIONS.includes(classification)) {
  return res.status(400).json({
    error: 'Invalid classification',
    valid: VALID_CLASSIFICATIONS
  });
}
```

**Step 3: Remove color existence check**

Delete lines 37-41 (the `SELECT id FROM colors WHERE id = ?` query).

**Step 4: Update duplicate check**

Replace lines 43-47 with:
```javascript
const [existingRows] = await db.query(
  'SELECT id FROM responses WHERE session_id = ? AND rgb_r = ? AND rgb_g = ? AND rgb_b = ?',
  [sessionId, rgb_r, rgb_g, rgb_b]
);
```

**Step 5: Update first-to-classify check**

Replace lines 53-58 with:
```javascript
const [firstCheckRows] = await db.query(
  'SELECT COUNT(*) as count FROM responses WHERE rgb_r = ? AND rgb_g = ? AND rgb_b = ?',
  [rgb_r, rgb_g, rgb_b]
);
const wasFirst = firstCheckRows[0].count === 0;
```

**Step 6: Update insert statement**

Replace lines 60-64 with:
```javascript
await db.query(
  'INSERT INTO responses (session_id, rgb_r, rgb_g, rgb_b, hex, user_classification) VALUES (?, ?, ?, ?, ?, ?)',
  [sessionId, rgb_r, rgb_g, rgb_b, hex, classification]
);
```

**Step 7: Test locally**

```bash
curl -X POST http://localhost:3000/api/responses \
  -H "Content-Type: application/json" \
  -d '{"rgb_r": 255, "rgb_g": 0, "rgb_b": 0, "hex": "#FF0000", "classification": "red"}'
```

Expected: `{"success":true,"wasFirst":true}` or `wasFirst:false`

**Step 8: Commit**

```bash
git add backend/routes/responses.js
git commit -m "feat: accept RGB values instead of color_id in responses endpoint"
```

---

## Task 6: Update `/api/stats/personal` Endpoint

**Files:**
- Modify: `backend/routes/stats.js`

**Step 1: Simplify personal stats query**

Replace the entire `router.get('/personal', ...)` function with:

```javascript
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
```

**Step 2: Test endpoint**

Run: `curl http://localhost:3000/api/stats/personal`
Expected: `{"totalClassified":0,"firstToClassify":0}` (or actual counts)

**Step 3: Commit**

```bash
git add backend/routes/stats.js
git commit -m "feat: simplify personal stats (remove controversial colors)"
```

---

## Task 7: Update `/api/stats/global` Endpoint

**Files:**
- Modify: `backend/routes/stats.js`

**Step 1: Update global stats query**

Replace the entire `router.get('/global', ...)` function with:

```javascript
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

    // Total distinct colors classified
    const [distinctColorsRows] = await db.query(`
      SELECT COUNT(DISTINCT CONCAT(rgb_r, '-', rgb_g, '-', rgb_b)) as count
      FROM responses
    `);
    const totalColorsClassified = distinctColorsRows[0].count;

    // Most classified color
    const [mostClassifiedRows] = await db.query(`
      SELECT rgb_r, rgb_g, rgb_b, hex, COUNT(*) as count
      FROM responses
      GROUP BY rgb_r, rgb_g, rgb_b, hex
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
          hex: mostClassifiedRows[0].hex,
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
```

**Step 2: Test endpoint**

Run: `curl http://localhost:3000/api/stats/global | jq '.'`
Expected: JSON with totalClassifications, uniqueUsers, totalColorsClassified, mostClassifiedColor

**Step 3: Commit**

```bash
git add backend/routes/stats.js
git commit -m "feat: update global stats for unlimited RGB color space"
```

---

## Task 8: Update `/api/visualize/data` Endpoint

**Files:**
- Modify: `backend/routes/visualize.js`

**Step 1: Add view parameter handling**

Replace the entire `router.get('/data', ...)` function with:

```javascript
// GET /api/visualize/data - Get colors with metrics (personal or global view)
router.get('/data', async (req, res) => {
  try {
    const view = req.query.view || 'global';
    const sessionId = req.session.id;

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
      const proportions = responses.map(r => r.count / totalResponses);
      const controversy = -proportions.reduce((sum, p) => sum + (p * Math.log2(p)), 0);
      const normalizedControversy = Math.min(controversy / Math.log2(responses.length), 1);
      const agreement = 1 - normalizedControversy;

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
```

**Step 2: Test personal view**

Run: `curl 'http://localhost:3000/api/visualize/data?view=personal' | jq '.view'`
Expected: `"personal"`

**Step 3: Test global view**

Run: `curl 'http://localhost:3000/api/visualize/data?view=global' | jq '.view'`
Expected: `"global"`

**Step 4: Commit**

```bash
git add backend/routes/visualize.js
git commit -m "feat: add personal/global view toggle to visualize endpoint"
```

---

## Task 9: Update `StatsView.jsx` Component

**Files:**
- Modify: `frontend/src/components/StatsView.jsx`

**Step 1: Add formatColorCount helper**

Add this function at the top of the component (after imports, before export):

```javascript
function formatColorCount(count) {
  if (!count) return '0 / 16.7M';
  return `${count.toLocaleString()} / 16.7M`;
}
```

**Step 2: Update Personal Stats section**

Replace lines 52-88 (Your Stats section) with:

```jsx
<section className="stats-section personal-stats">
  <h3>Your Stats</h3>
  <div className="stat-item">
    <span className="stat-icon">🎨</span>
    <span className="stat-label">Colors Classified:</span>
    <span className="stat-value">{personalStats.totalClassified}</span>
  </div>
  <div className="stat-item">
    <span className="stat-icon">🥇</span>
    <span className="stat-label">First to Classify:</span>
    <span className="stat-value">{personalStats.firstToClassify}</span>
  </div>
</section>
```

**Step 3: Update Global Stats section**

Replace lines 90-122 (Platform Stats section) with:

```jsx
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
    <span className="stat-label">Colors Classified:</span>
    <span className="stat-value">{formatColorCount(globalStats.totalColorsClassified)}</span>
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
```

**Step 4: Verify no compilation errors**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add frontend/src/components/StatsView.jsx
git commit -m "feat: update stats display for unlimited colors (remove /20, add X/16.7M)"
```

---

## Task 10: Update `ColorCube3D.jsx` Component

**Files:**
- Modify: `frontend/src/components/ColorCube3D.jsx`

**Step 1: Add view state and toggle UI**

Find the component's state declarations and add:

```javascript
const [view, setView] = useState('global');
```

**Step 2: Update useEffect to include view dependency**

Change the useEffect hook to fetch based on view:

```javascript
useEffect(() => {
  axios.get(`/api/visualize/data?view=${view}`)
    .then(response => {
      setColorData(response.data.colors);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching visualization data:', error);
      setLoading(false);
    });
}, [view]);  // Re-fetch when view changes
```

**Step 3: Add toggle buttons above canvas**

Add this JSX before the `<Canvas>` element:

```jsx
<div className="cube-view-toggle">
  <button
    className={view === 'personal' ? 'active' : ''}
    onClick={() => setView('personal')}
  >
    My Colors
  </button>
  <button
    className={view === 'global' ? 'active' : ''}
    onClick={() => setView('global')}
  >
    All Colors
  </button>
</div>
```

**Step 4: Add CSS for toggle**

Add to `frontend/src/components/ColorCube3D.css`:

```css
.cube-view-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  justify-content: center;
}

.cube-view-toggle button {
  padding: 8px 16px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.cube-view-toggle button.active {
  background: #667eea;
  color: white;
}

.cube-view-toggle button:hover {
  transform: scale(1.05);
}
```

**Step 5: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add frontend/src/components/ColorCube3D.jsx frontend/src/components/ColorCube3D.css
git commit -m "feat: add personal/global toggle to color cube visualization"
```

---

## Task 11: Update `ColorClassifier.jsx` Component

**Files:**
- Modify: `frontend/src/components/ColorClassifier.jsx`

**Step 1: Remove "done" state handling**

Replace the `fetchColor` function (lines 16-33) with:

```javascript
const fetchColor = async () => {
  try {
    setLoading(true);
    const { data } = await axios.get('/api/colors/next');
    // data always contains { rgb_r, rgb_g, rgb_b, hex }
    setColor(data);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching color:', error);
    setLoading(false);
  }
}
```

**Step 2: Update handleClassification to send RGB**

Replace the `handleClassification` function (lines 35-59) with:

```javascript
const handleClassification = async (classification) => {
  if (!color) return;

  try {
    const response = await axios.post('/api/responses', {
      rgb_r: color.rgb_r,
      rgb_g: color.rgb_g,
      rgb_b: color.rgb_b,
      hex: color.hex,
      classification
    });

    // Show badge if user was first
    if (response.data.wasFirst) {
      console.log('🥇 You were first to classify this color!');
      // Could add toast notification here
    }

    // Refresh stats
    setStatsRefreshKey(prev => prev + 1);

    // Fetch next color
    await fetchColor();
  } catch (error) {
    console.error('Error submitting classification:', error);
    alert('Failed to save your answer. Please try again.');
  }
}
```

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/components/ColorClassifier.jsx
git commit -m "feat: send RGB values instead of color_id, remove done state"
```

---

## Task 12: Update `LeftPanel.jsx` Component

**Files:**
- Modify: `frontend/src/components/LeftPanel.jsx`

**Step 1: Remove completion state**

Delete lines 17-28 (the `if (!color)` block that shows "All colors classified!").

**Step 2: Change loading to show when no color**

Update the component to treat `!color` as loading state:

```javascript
if (loading || !color) {
  return (
    <div className="left-panel" style={{ backgroundColor: '#ccc' }}>
      <div className="loading-message">Loading color...</div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/components/LeftPanel.jsx
git commit -m "feat: remove color completion state (unlimited colors)"
```

---

## Task 13: Build and Test Locally

**Files:**
- None (testing only)

**Step 1: Build frontend**

```bash
cd frontend
npm run build
```

Expected: Build succeeds, creates `dist/` folder

**Step 2: Copy build to backend public/**

```bash
rm -rf ../backend/public/*
cp -r dist/* ../backend/public/
```

**Step 3: Start backend server**

```bash
cd ../backend
node server.js
```

Expected: "Server running on port 3000"

**Step 4: Test in browser**

Open: http://localhost:3000

**Test checklist:**
- [x] Language selection works
- [x] Random color appears (check hex in DevTools)
- [x] Classify a color
- [x] Stats increment (not stuck at 0)
- [x] Classify another color
- [x] Stats increment again (session persists)
- [x] Toggle cube view (Personal/Global)
- [x] No "/20" shown in stats
- [x] Shows "X / 16.7M" format

**Step 5: Test session persistence**

1. Classify 3 colors
2. Check stats (should show 3)
3. Refresh page
4. Check stats (should still show 3)

Expected: Stats persist across page refresh

**Step 6: Document testing complete**

No commit needed (verification only)

---

## Task 14: Run Migration on RC Database

**Files:**
- None (database operation)

**Step 1: Connect to RC database**

```bash
mysql -h <DB_HOST> -u <DB_USER> -p<DB_PASSWORD> color_app_rc
```

Expected: MySQL prompt

**Step 2: Show current structure**

```sql
DESCRIBE responses;
```

Expected: Shows color_id, no RGB columns

**Step 3: Run migration**

Copy/paste the entire migration from `backend/db/migrations/002_rgb_unlimited_colors.sql`

Expected: Multiple "Query OK" messages

**Step 4: Verify new structure**

```sql
DESCRIBE responses;
SELECT COUNT(*) FROM responses;
SELECT rgb_r, rgb_g, rgb_b, hex FROM responses LIMIT 5;
```

Expected: Shows RGB columns, data backfilled from colors table

**Step 5: Exit MySQL**

```sql
exit;
```

**Step 6: Document completion**

Migration complete on RC database

---

## Task 15: Deploy to RC and Test

**Files:**
- None (deployment)

**Step 1: Push branch to GitHub**

```bash
git push origin fix/stats-and-cube-issues
```

**Step 2: Create PR to main**

```bash
gh pr create --base main --title "feat: unlimited random RGB color collection" --body "## Summary
- Refactor from 20 pre-selected colors to unlimited RGB color space
- Fix session persistence (trust proxy)
- Database migration: add RGB columns to responses
- Update all APIs and frontend for random color generation
- Add personal/global toggle to color cube
- Stats show X / 16.7M format

## Database Migration
- Migration file: backend/db/migrations/002_rgb_unlimited_colors.sql
- Already run on RC database
- Backfills existing data from colors table

## Testing
- [x] Local testing complete
- [ ] RC testing pending
- [ ] Session persistence verified
- [ ] Stats update correctly
- [ ] Color cube toggle works"
```

**Step 3: Merge to main**

After approval, merge PR

**Step 4: Merge main to rc**

```bash
git checkout rc
git pull origin rc
git merge origin/main
git push origin rc
```

**Step 5: Wait for automatic deployment**

Monitor: https://github.com/jsrahoi-dev/devops-spring26-midterm-infra/actions/workflows/rc-build.yml

Expected: Deployment succeeds

**Step 6: Test on RC**

Visit: https://rc.rahoi.dev

**Test checklist:**
- [x] Classify colors
- [x] Stats increment
- [x] Session persists
- [x] No "/20" shown
- [x] Shows "X / 16.7M"
- [x] Cube toggle works
- [x] Different users = different sessions (not 1:1 with classifications)

**Step 7: Document success**

All tests pass on RC environment

---

## Success Criteria

After completing all tasks:

- ✅ Users can classify unlimited random RGB colors
- ✅ Sessions persist (stats accumulate across page refreshes)
- ✅ Personal stats show counts without "/20"
- ✅ Global stats show "X / 16.7M" format
- ✅ Color cube has Personal/Global toggle
- ✅ Color cube updates with new classifications
- ✅ No "all colors classified" message
- ✅ First-to-classify tracking works
- ✅ Each classification doesn't create new unique user (session fix works)

---

## Rollback Plan

If critical issues arise on RC:

1. **Revert code:**
   ```bash
   git revert <merge-commit-sha>
   git push origin rc
   ```

2. **Revert database (if needed):**
   ```sql
   -- On RC database
   ALTER TABLE responses ADD COLUMN color_id INT;
   UPDATE responses r
   JOIN colors c ON r.hex = c.hex
   SET r.color_id = c.id;
   ALTER TABLE responses ADD FOREIGN KEY (color_id) REFERENCES colors(id);
   ALTER TABLE responses DROP COLUMN rgb_r, DROP COLUMN rgb_g, DROP COLUMN rgb_b, DROP COLUMN hex;
   ```

3. **Or restore from backup:**
   - AWS RDS automated backup
   - Point-in-time recovery to before migration

---

## End of Implementation Plan
