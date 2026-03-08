# Frontend Layout and Language Persistence Fixes

**Date:** March 8, 2026
**Status:** Approved
**Branch:** fix/layout-and-language-persistence

---

## Overview

Fix three frontend issues reported after RC deployment:
1. Root div not filling viewport (layout constraint)
2. Language selection shown on every HOME visit (no persistence)
3. Clarify that color limit removal and layout width differences are intentional

## Problems

### 1. Root Layout Constraint
- `div#root` doesn't have `flex-grow: 1`
- Body is a flex container but root doesn't expand to fill it
- All page content appears constrained/narrow

### 2. Language Re-selection
- User sets language on first visit
- Navigates to ABOUT/BLOG, then back to HOME
- Language selection form shown again (poor UX)
- No cookie/localStorage persistence

### 3. Perceived Issues (Actually Intentional)
- **Color limit:** Backend already serves unlimited colors, frontend handles completion gracefully
- **Layout width:** Classify is full-width split-screen (by design), About/Blog are centered prose (by design)

## Solutions

### 1. Root Layout Fix

**File:** `frontend/src/index.css`

**Change:**
```css
#root {
  flex-grow: 1;
  /* existing properties */
}
```

**Impact:** All pages fill viewport properly.

### 2. Language Cookie Persistence

**Approach:** Cookie-based persistence with auto-redirect

**Dependencies:**
- Add `js-cookie` package: `npm install js-cookie`

**File:** `frontend/src/components/LanguageSelection.jsx`

**Changes:**
1. Import `js-cookie`
2. On mount: check for `user_language` cookie
3. If cookie exists: auto-redirect to `/classify`
4. On submit: save language to cookie (30-day expiry)

**Flow:**
```
User visits / (HOME)
  ↓
LanguageSelection mounts
  ↓
Check Cookies.get('user_language')
  ↓
If exists → navigate('/classify')
If not → show language form
  ↓
User submits language
  ↓
POST /api/language (backend session)
Cookies.set('user_language', lang, 30 days)
  ↓
navigate('/classify')
```

**Cookie Details:**
- Name: `user_language`
- Expiry: 30 days
- Scope: Default (current domain)
- Purpose: Client-side UX optimization (backend still tracks language in session)

### 3. No Changes Required

**Color limit:** Already unlimited - backend query returns all unclassified colors until `{done: true}`

**Layout width:** Intentional design difference:
- Classify: Full-width split-screen for color + stats
- About/Blog/Home: Centered containers for readable prose

## Testing

**Root layout:**
- Visit all pages (HOME, ABOUT, BLOG, CLASSIFY)
- Verify content fills viewport width appropriately

**Language persistence:**
1. Clear cookies/localStorage
2. Visit `/` → language form shown
3. Select language → redirects to `/classify`
4. Navigate to `/about`
5. Click HOME in navbar
6. **Expected:** Auto-redirect to `/classify` (no form shown)
7. Clear cookies
8. Visit `/` again → form shown again

**Edge cases:**
- Cookie expired after 30 days → form shown
- User clears cookies → form shown
- JavaScript disabled → form shown (no redirect)

## Success Criteria

- ✅ All pages fill viewport (no narrow constraint)
- ✅ Language selection shown only once per 30-day period
- ✅ Returning to HOME after navigation auto-redirects to classify
- ✅ No console errors
- ✅ Cookie set with correct expiry

## Out of Scope

- Backend language validation (already handled)
- Language change UI (user can clear cookies manually)
- Multi-language UI (only tracks user's native language)
- Session vs cookie sync (backend uses session, frontend uses cookie for UX)

---

## Implementation Notes

**Package installation:**
```bash
cd frontend
npm install js-cookie
```

**Files modified:**
1. `frontend/src/index.css` - Add `flex-grow: 1` to `#root`
2. `frontend/src/components/LanguageSelection.jsx` - Cookie check and set logic
3. `frontend/package.json` - Add `js-cookie` dependency

**No database changes required.**
**No backend changes required.**

---

## End of Design Document
