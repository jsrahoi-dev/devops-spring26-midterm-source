# MDX Content Pages Design

## Goal

Convert Blog and About pages from JSX components with hardcoded content to MDX-based content files for easier editing.

## Architecture

Add MDX support to the existing Vite + React application using `@mdx-js/rollup`. The current Blog and About components contain large amounts of static content mixed with component logic. By extracting content to MDX files in `frontend/src/content/`, we separate concerns and make content editing straightforward without touching React code.

The Blog component currently handles Mermaid diagram initialization via `useEffect`. This logic remains in the component wrapper, while the markdown content (including Mermaid diagram markup) moves to the MDX file.

## Technology Stack

- **MDX**: `@mdx-js/rollup` for Vite integration
- **Remark Plugin**: `remark-gfm` for GitHub-flavored markdown features (tables, strikethrough, etc.)
- **Existing**: Mermaid.js (already loaded via CDN in index.html)
- **Build Tool**: Vite with MDX rollup plugin

## Directory Structure

```
frontend/
  src/
    content/
      blog.mdx       ← Extracted blog content
      about.mdx      ← Extracted about content
    components/
      Blog.jsx       ← Thin wrapper, imports blog.mdx
      About.jsx      ← Thin wrapper, imports about.mdx
      Blog.css       ← Unchanged
      About.css      ← Unchanged
```

## Content Format

MDX files will use:
- Standard markdown syntax (headings, paragraphs, lists, links)
- HTML `<div className="mermaid">` for diagram blocks (existing pattern)
- Optional frontmatter for metadata (not required initially)

Example structure for blog.mdx:
```mdx
# A Production-Ready Color Perception SPA

## Jon Rahoi • March 8, 2026 • DevOps Spring 2026 Midterm Project

### 1. System Overview & Architecture

The Color Perception SPA is a research application...

<div className="mermaid">
{`graph TB
  User[User Browser]
  ...
`}
</div>
```

## Component Changes

**Blog.jsx** - Before:
- Contained all content inline in JSX return statement
- Had Mermaid initialization in useEffect

**Blog.jsx** - After:
- Imports BlogContent from '../content/blog.mdx'
- Keeps Mermaid initialization in useEffect
- Renders: `<div className="blog-page"><div className="blog-container"><BlogContent /></div></div>`

**About.jsx** - Before:
- Contained lorem ipsum placeholder content inline

**About.jsx** - After:
- Imports AboutContent from '../content/about.mdx'
- Renders: `<div className="about-page"><div className="about-container"><AboutContent /></div></div>`

## Configuration

**vite.config.js**:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) },
    react()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

**package.json dependencies to add**:
- `@mdx-js/rollup`: MDX compiler for Vite
- `remark-gfm`: GitHub-flavored markdown support

## Testing Strategy

- Verify dev server starts without errors (`npm run dev`)
- Check Blog page renders all content correctly
- Verify Mermaid diagrams render as interactive diagrams (not code blocks)
- Confirm About page renders markdown content
- Run production build (`npm run build`) to ensure MDX compilation works
- Test navigation between pages

## Migration Steps

1. Install MDX dependencies
2. Update Vite config with MDX plugin
3. Create `frontend/src/content/` directory
4. Extract Blog content to `blog.mdx`
5. Refactor Blog.jsx to import and render blog.mdx
6. Extract About content to `about.mdx`
7. Refactor About.jsx to import and render about.mdx
8. Test locally, verify Mermaid diagrams work
9. Commit changes
10. Deploy via RC build

## Benefits

- Content editors don't need to know React/JSX
- Markdown is easier to read and edit than JSX strings
- Standard format enables future CMS integration
- Clear separation between content and application logic
- Mermaid diagrams continue to work as-is
- No runtime overhead (MDX compiles at build time)
