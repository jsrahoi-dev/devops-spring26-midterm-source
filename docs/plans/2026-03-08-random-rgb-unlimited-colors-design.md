# Random RGB Unlimited Color Collection Design

**Date:** March 8, 2026
**Status:** Approved
**Branch:** fix/stats-and-cube-issues

---

## Overview

Refactor the color classification system from 20 pre-selected colors to unlimited random RGB color exploration across the full 16.7M color space.

## Problems

### Current Architecture Issues:
1. **Limited to 20 colors** - Users can only classify pre-seeded colors
2. **Session persistence broken** - Each classification creates new session (27 users = 27 classifications)
3. **Stats don't update** - Personal stats always show 0/20, 0 firsts
4. **Color cube doesn't update** - Static visualization of pre-selected colors
5. **Nginx proxy trust** - Express doesn't trust proxy, secure cookies fail

### User Vision:
- Collect data on **all 16.7 million RGB colors**
- Truly random color generation (not pre-selected)
- Stats reflect unlimited color space ("X / 16.7M")
- Personal and global views in color cube

---

## Solution Architecture

### Database Schema Changes

**Modify `responses` table - make it self-contained:**

```sql
-- Migration: Add RGB columns to responses table
ALTER TABLE responses
  DROP FOREIGN KEY responses_ibfk_2,  -- Remove color_id FK
  DROP COLUMN color_id,
  ADD COLUMN rgb_r TINYINT UNSIGNED NOT NULL AFTER session_id,
  ADD COLUMN rgb_g TINYINT UNSIGNED NOT NULL AFTER rgb_r,
  ADD COLUMN rgb_b TINYINT UNSIGNED NOT NULL AFTER rgb_g,
  ADD COLUMN hex VARCHAR(7) NOT NULL AFTER rgb_b,
  ADD INDEX idx_rgb (rgb_r, rgb_g, rgb_b);
```

**New `responses` structure:**
- `id` - INT PRIMARY KEY AUTO_INCREMENT
- `session_id` - VARCHAR(128) FK to sessions
- `rgb_r` - TINYINT UNSIGNED (0-255)
- `rgb_g` - TINYINT UNSIGNED (0-255)
- `rgb_b` - TINYINT UNSIGNED (0-255)
- `hex` - VARCHAR(7) (e.g., #A3B2C5)
- `user_classification` - ENUM(...)
- `created_at` - TIMESTAMP
- `classified_at` - TIMESTAMP
- INDEX: `idx_rgb (rgb_r, rgb_g, rgb_b)`
- INDEX: `idx_session (session_id)`

**Keep `colors` table:**
- Don't use it actively
- Preserve for potential future studies with pre-defined color sets
- No breaking changes to existing table

---

## Backend Changes

### 1. Fix Session Persistence

**File:** `backend/server.js`

Add before session middleware:
```javascript
app.set('trust proxy', 1);  // Trust nginx reverse proxy for secure cookies
```

**Why:** Express needs to trust the proxy (nginx) to properly handle secure cookies and session persistence. Without this, each request appears to come from nginx instead of the user, breaking sessions.

### 2. Update `/api/colors/next` Endpoint

**File:** `backend/routes/colors.js`

**Current behavior:** Query `colors` table for unclassified colors

**New behavior:**
```javascript
GET /api/colors/next
→ Generate random RGB: r=random(0-255), g=random(0-255), b=random(0-255)
→ Convert to hex: #RRGGBB
→ Check if current user already classified this exact RGB combo
→ If yes, regenerate (avoid showing same color twice in a row)
→ Return { rgb_r, rgb_g, rgb_b, hex }
→ Never return { done: true } (unlimited colors)
```

**Algorithm:**
1. Generate random RGB
2. Query: `SELECT 1 FROM responses WHERE session_id = ? AND rgb_r = ? AND rgb_g = ? AND rgb_b = ? LIMIT 1`
3. If exists, regenerate (max 3 attempts, then accept collision)
4. Return color object

### 3. Update `/api/responses` Endpoint

**File:** `backend/routes/responses.js`

**Current behavior:** Save with `color_id` FK

**New behavior:**
```javascript
POST /api/responses
Body: { rgb_r, rgb_g, rgb_b, hex, classification }

Validation:
- rgb_r, rgb_g, rgb_b: integers 0-255
- hex: matches RGB values
- classification: valid enum value

Logic:
1. Ensure session saved
2. Validate RGB range (0-255)
3. Check duplicate: SELECT WHERE session_id = ? AND rgb_r = ? AND rgb_g = ? AND rgb_b = ?
4. If duplicate, return 409 Conflict
5. Check if first: SELECT COUNT(*) FROM responses WHERE rgb_r = ? AND rgb_g = ? AND rgb_b = ?
6. wasFirst = (count === 0)
7. INSERT INTO responses (session_id, rgb_r, rgb_g, rgb_b, hex, user_classification)
8. Return { success: true, wasFirst }
```

**Note:** Remove `color_id` validation logic

### 4. Update `/api/stats/personal` Endpoint

**File:** `backend/routes/stats.js`

**Simplified response:**
```json
{
  "totalClassified": 42,      // COUNT(*) WHERE session_id = ?
  "firstToClassify": 7        // COUNT(*) WHERE session_id = ? AND is_first
}
```

**Remove:**
- Controversial colors section (complexity not needed)

**First-to-classify query:**
```sql
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
```

### 5. Update `/api/stats/global` Endpoint

**File:** `backend/routes/stats.js`

**New response:**
```json
{
  "totalClassifications": 847,           // COUNT(*) FROM responses
  "uniqueUsers": 42,                     // COUNT(DISTINCT session_id)
  "totalColorsClassified": 512,          // COUNT(DISTINCT rgb_r, rgb_g, rgb_b)
  "mostClassifiedColor": {
    "rgb": { "r": 255, "g": 0, "b": 0 },
    "hex": "#FF0000",
    "count": 12
  }
}
```

**Queries:**
- Total classifications: `SELECT COUNT(*) FROM responses`
- Unique users: `SELECT COUNT(DISTINCT session_id) FROM responses`
- Distinct colors: `SELECT COUNT(DISTINCT CONCAT(rgb_r, '-', rgb_g, '-', rgb_b)) FROM responses`
- Most classified:
  ```sql
  SELECT rgb_r, rgb_g, rgb_b, hex, COUNT(*) as count
  FROM responses
  GROUP BY rgb_r, rgb_g, rgb_b, hex
  ORDER BY count DESC
  LIMIT 1
  ```

**Remove:**
- `totalColors` field (no longer relevant)
- `percentageCovered` field (replaced by formatted display in frontend)

### 6. Update `/api/visualize/data` Endpoint

**File:** `backend/routes/visualize.js`

**Add query parameter:**
```
GET /api/visualize/data?view=personal|global
```

**Logic:**
```javascript
if (view === 'personal') {
  // Get distinct RGBs for current session
  SELECT DISTINCT rgb_r, rgb_g, rgb_b, hex
  FROM responses
  WHERE session_id = ?
} else {
  // Get all distinct RGBs (global)
  SELECT DISTINCT rgb_r, rgb_g, rgb_b, hex
  FROM responses
}

For each unique RGB:
  - Count total responses
  - Calculate most common classification
  - Calculate controversy/agreement metrics
  - Return { rgb: {r, g, b}, hex, responses, most_common, controversy, agreement }
```

**Response:**
```json
{
  "colors": [
    {
      "rgb": { "r": 163, "g": 178, "b": 197 },
      "hex": "#A3B2C5",
      "responses": 8,
      "most_common": "blue",
      "controversy": 25,
      "agreement": 75
    }
  ],
  "view": "personal"
}
```

---

## Frontend Changes

### 1. Update `StatsView.jsx`

**Your Stats Section:**
```jsx
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
```

**Changes:**
- Remove "/20" denominator
- Remove controversial colors section entirely

**Platform Stats Section:**
```jsx
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
<div className="stat-item">
  <span className="stat-icon">🔥</span>
  <span className="stat-label">Most Classified:</span>
  <span className="stat-value">
    <div className="color-swatch-inline" style={{ backgroundColor: globalStats.mostClassifiedColor.hex }}></div>
    {globalStats.mostClassifiedColor.hex} ({globalStats.mostClassifiedColor.count})
  </span>
</div>
```

**Helper function:**
```javascript
function formatColorCount(count) {
  return `${count.toLocaleString()} / 16.7M`;
}
```

**Changes:**
- Replace "Coverage" percentage with "Colors Classified: X / 16.7M"
- Format large numbers with commas
- Update most classified to show RGB hex

### 2. Update `ColorCube3D.jsx`

**Add view toggle:**
```jsx
const [view, setView] = useState('global');

// Toggle buttons
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

**Update data fetching:**
```javascript
useEffect(() => {
  axios.get(`/api/visualize/data?view=${view}`)
    .then(res => setColors(res.data.colors))
    .catch(err => console.error(err));
}, [view]);  // Re-fetch when view changes
```

**Styling:**
- Position toggle above canvas
- Highlight active button
- Smooth transition when switching views

### 3. Update `LeftPanel.jsx`

**Change completion message:**

**Current:**
```jsx
if (!color) {
  return (
    <div className="left-panel">
      <h2>🎉 All colors classified!</h2>
      <p>Check out your stats on the right →</p>
    </div>
  );
}
```

**New:**
```jsx
// Never show completion state - always show next random color
// If color is null (error state), show error instead
```

**Remove the "done" state entirely** - there are always more colors to classify.

### 4. Update `ColorClassifier.jsx`

**Handle API changes:**

**Current:**
```javascript
const { data } = await axios.get('/api/colors/next');
if (data.done) {
  setColor(null);  // Show completion
}
```

**New:**
```javascript
const { data } = await axios.get('/api/colors/next');
// data always contains { rgb_r, rgb_g, rgb_b, hex }
setColor(data);
```

**Submit classification:**
```javascript
await axios.post('/api/responses', {
  rgb_r: color.rgb_r,
  rgb_g: color.rgb_g,
  rgb_b: color.rgb_b,
  hex: color.hex,
  classification
});
```

**Remove:**
- `color_id` from request body
- Completion state handling

---

## Migration Strategy

### Step 1: Database Migration

**Run on QA and RC databases:**
```sql
-- Add RGB columns to responses
ALTER TABLE responses
  ADD COLUMN rgb_r_new TINYINT UNSIGNED AFTER session_id,
  ADD COLUMN rgb_g_new TINYINT UNSIGNED AFTER rgb_r_new,
  ADD COLUMN rgb_b_new TINYINT UNSIGNED AFTER rgb_g_new,
  ADD COLUMN hex_new VARCHAR(7) AFTER rgb_b_new;

-- Backfill from colors table
UPDATE responses r
JOIN colors c ON r.color_id = c.id
SET r.rgb_r_new = c.rgb_r,
    r.rgb_g_new = c.rgb_g,
    r.rgb_b_new = c.rgb_b,
    r.hex_new = c.hex;

-- Make columns NOT NULL
ALTER TABLE responses
  MODIFY COLUMN rgb_r_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN rgb_g_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN rgb_b_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN hex_new VARCHAR(7) NOT NULL;

-- Drop FK and old column
ALTER TABLE responses
  DROP FOREIGN KEY responses_ibfk_2,
  DROP COLUMN color_id;

-- Rename new columns
ALTER TABLE responses
  CHANGE COLUMN rgb_r_new rgb_r TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN rgb_g_new rgb_g TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN rgb_b_new rgb_b TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN hex_new hex VARCHAR(7) NOT NULL;

-- Add index
ALTER TABLE responses
  ADD INDEX idx_rgb (rgb_r, rgb_g, rgb_b);
```

### Step 2: Deploy Code Changes

1. Backend changes (session trust, API updates)
2. Frontend changes (stats display, cube toggle)
3. Deploy to RC for testing
4. Deploy to production after validation

### Step 3: Data Cleanup (Optional)

**Keep old data:**
- Existing responses remain (now with RGB values from backfill)
- New responses use random RGB generation

**OR reset for fresh start:**
```sql
TRUNCATE TABLE responses;  -- Clear all old data
```

Recommendation: Keep old data - it's still valid classification data.

---

## Testing Plan

### Backend Testing

1. **Session persistence:**
   - Classify a color
   - Check cookie in DevTools
   - Classify another color
   - Verify stats increment (not reset to 0)

2. **Random RGB generation:**
   - Call `/api/colors/next` 10 times
   - Verify different RGB values each time
   - Verify valid range (0-255)

3. **First-to-classify:**
   - Fresh session classifies new random color
   - Verify `wasFirst: true`
   - Different session classifies same RGB
   - Verify `wasFirst: false`

4. **Stats accuracy:**
   - Classify 5 colors
   - Check `/api/stats/personal` shows 5
   - Check `/api/stats/global` totalColorsClassified increases

### Frontend Testing

1. **Stats display:**
   - Verify no "/20" shown
   - Verify "X / 16.7M" format
   - Verify stats update after each classification

2. **Color cube toggle:**
   - Switch between Personal/Global views
   - Verify different data loads
   - Verify smooth transition

3. **Continuous classification:**
   - Classify 25+ colors
   - Verify no "all done" message
   - Verify new colors keep appearing

---

## Success Criteria

- ✅ Users can classify unlimited random RGB colors
- ✅ Sessions persist across requests (stats accumulate)
- ✅ Personal stats show accurate counts (no "/20")
- ✅ Global stats show "X / 16.7M" format
- ✅ Color cube has Personal/Global toggle
- ✅ Color cube updates with new classifications
- ✅ No "all colors classified" message ever shown
- ✅ First-to-classify tracking works for random colors

---

## Out of Scope

- Color similarity detection (don't warn if user gets similar colors)
- Color space sampling strategies (purely random, not strategic)
- Analytics on RGB distribution patterns
- Export classified colors as dataset
- Color naming consensus algorithms

---

## Rollback Plan

If issues arise:

1. **Revert migration:**
   ```sql
   ALTER TABLE responses
     ADD COLUMN color_id INT,
     ADD FOREIGN KEY (color_id) REFERENCES colors(id),
     DROP COLUMN rgb_r,
     DROP COLUMN rgb_g,
     DROP COLUMN rgb_b,
     DROP COLUMN hex;
   ```

2. **Restore from backup** (recommended approach)

3. **Or accept data loss** and truncate responses table

---

## End of Design Document
