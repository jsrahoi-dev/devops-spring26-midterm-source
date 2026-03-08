# Layout and Language Persistence Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix root layout constraint and add language cookie persistence with auto-redirect

**Architecture:** CSS fix for root div expansion + client-side cookie management with React useEffect hook for redirect logic

**Tech Stack:** React 19, js-cookie, CSS

---

## Task 1: Fix Root Layout (Add flex-grow to #root)

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Add #root selector with flex-grow**

Add this CSS rule after the `body` selector (around line 31):

```css
#root {
  flex-grow: 1;
  width: 100%;
}
```

**Step 2: Verify the change**

Run: `cd frontend && npm run dev`
Open: http://localhost:5173
Navigate to: HOME, ABOUT, BLOG, CLASSIFY pages
Expected: All pages fill viewport width properly (no narrow constraint)

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "fix: add flex-grow to #root to fill viewport"
```

---

## Task 2: Install js-cookie Dependency

**Files:**
- Modify: `frontend/package.json` (via npm)

**Step 1: Install js-cookie**

```bash
cd frontend
npm install js-cookie
```

Expected output: `+ js-cookie@3.x.x` added to dependencies

**Step 2: Verify installation**

Run: `grep "js-cookie" package.json`
Expected: Line showing `"js-cookie": "^3.x.x"` in dependencies

**Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add js-cookie for language persistence"
```

---

## Task 3: Add Cookie Check and Auto-Redirect on Mount

**Files:**
- Modify: `frontend/src/components/LanguageSelection.jsx`

**Step 1: Import js-cookie and useEffect**

Add import at top of file (line 1-3 area):

```javascript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'js-cookie'
```

**Step 2: Add useEffect hook for cookie check**

Add this hook after the `navigate` declaration (around line 9):

```javascript
  useEffect(() => {
    const savedLanguage = Cookies.get('user_language')
    if (savedLanguage) {
      navigate('/classify')
    }
  }, [navigate])
```

**Step 3: Verify behavior**

Run: `npm run dev` (from frontend directory)

Test Case 1: No cookie exists
- Open http://localhost:5173 in incognito window
- Expected: Language selection form shown

Test Case 2: Cookie exists (simulate)
- Open browser DevTools → Console
- Run: `document.cookie = "user_language=English; max-age=2592000"`
- Refresh page
- Expected: Auto-redirect to /classify (no form shown)

**Step 4: Commit**

```bash
git add frontend/src/components/LanguageSelection.jsx
git commit -m "feat: add language cookie check with auto-redirect on mount"
```

---

## Task 4: Set Cookie on Language Submission

**Files:**
- Modify: `frontend/src/components/LanguageSelection.jsx`

**Step 1: Add cookie set in handleSubmit**

Modify the `handleSubmit` function (around line 16-34). Add the cookie set AFTER successful API call:

```javascript
  const handleSubmit = async (e) => {
    e.preventDefault()
    const selectedLanguage = language === 'Other' ? otherLanguage : language

    if (!selectedLanguage.trim() || (language === 'Other' && !otherLanguage.trim())) {
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/language', { language: selectedLanguage })
      Cookies.set('user_language', selectedLanguage, { expires: 30 }) // 30 days
      navigate('/classify')
    } catch (error) {
      console.error('Error setting language:', error)
      alert('Failed to set language. Please try again.')
    } finally {
      setLoading(false)
    }
  }
```

**Step 2: Verify cookie is set**

Run: `npm run dev`

Test:
1. Clear all cookies (DevTools → Application → Cookies → Clear)
2. Visit http://localhost:5173
3. Select "English" and submit
4. Open DevTools → Application → Cookies
5. Expected: Cookie named `user_language` with value `English` and expiration ~30 days from now

**Step 3: Commit**

```bash
git add frontend/src/components/LanguageSelection.jsx
git commit -m "feat: persist language choice in cookie with 30-day expiry"
```

---

## Task 5: End-to-End Manual Testing

**Files:**
- None (verification only)

**Step 1: Test complete flow**

```bash
cd frontend
npm run dev
```

Test Flow:
1. Clear all cookies in browser
2. Visit http://localhost:5173/
3. Verify: Language selection form shown
4. Select "Spanish" → Click "Begin"
5. Verify: Redirected to /classify
6. Navigate to /about (click ABOUT in navbar)
7. Click HOME in navbar
8. Verify: Auto-redirected to /classify (no form)
9. Check DevTools → Cookies
10. Verify: `user_language=Spanish` cookie exists with 30-day expiry

**Step 2: Test cookie expiry behavior**

1. Clear cookies
2. Set a short-lived cookie manually: `document.cookie = "user_language=test; max-age=5"`
3. Refresh / (HOME) immediately → should redirect
4. Wait 6 seconds, refresh / → should show form

**Step 3: Test edge cases**

Edge Case 1: Navigate directly to /classify without setting language
- Visit http://localhost:5173/classify directly
- Expected: App works (backend creates session), no errors

Edge Case 2: "Other" language type
1. Clear cookies
2. Visit /
3. Select "Other" → Type "Swahili"
4. Submit
5. Verify: Cookie set with value "Swahili"

**Step 4: No commit (verification only)**

---

## Success Criteria

After completing all tasks, verify:

- ✅ All pages (HOME, ABOUT, BLOG, CLASSIFY) fill viewport width
- ✅ Language selection shown only on first visit
- ✅ Subsequent visits to HOME auto-redirect to /classify
- ✅ Cookie persists for 30 days
- ✅ Cookie contains selected language value
- ✅ No console errors during navigation
- ✅ Clearing cookies restores language selection form

---

## Manual Test Script (QA/RC Verification)

After deployment, test on RC environment:

```bash
# Visit RC environment
open https://rc.rahoi.dev

# Test 1: First visit
1. Clear cookies for rc.rahoi.dev
2. Visit https://rc.rahoi.dev
3. Expect: Language selection shown
4. Select language → Expect: redirect to /classify

# Test 2: Persistence
5. Navigate to /about
6. Click HOME
7. Expect: Auto-redirect to /classify (no form)

# Test 3: Cookie inspection
8. Open DevTools → Application → Cookies → rc.rahoi.dev
9. Verify: user_language cookie exists with 30-day expiry
```

---

## Rollback Plan

If issues arise:

```bash
git revert HEAD~4..HEAD  # Revert all 4 commits
npm install              # Restore package.json state
```

Or revert specific changes:
- Remove `#root` CSS rule from `index.css`
- Remove `js-cookie` import and cookie logic from `LanguageSelection.jsx`
- `npm uninstall js-cookie`

---

## Notes

**Why cookies not localStorage?**
- Cookies work across all browsers consistently
- 30-day expiry is native to cookies
- js-cookie provides clean API

**Why client-side persistence?**
- Backend already tracks language in session
- Cookie is UX optimization only
- Reduces API calls on HOME visits

**No tests?**
- Codebase has no frontend test infrastructure
- Manual testing sufficient for UX changes
- Could add E2E tests later with Playwright

---

## End of Implementation Plan
