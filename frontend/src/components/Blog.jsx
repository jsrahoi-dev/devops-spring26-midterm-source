import './Blog.css'
import { useEffect, useRef } from 'react'
import BlogContent from '../content/blog.mdx'

export default function Blog() {
  const mermaidRef = useRef(false)

  useEffect(() => {
    // Initialize and render Mermaid diagrams
    if (window.mermaid && !mermaidRef.current) {
      mermaidRef.current = true
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        themeVariables: {
          fontSize: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }
      })
      window.mermaid.run()
    }
  }, [])

  return (
    <div className="blog-page">
      <div className="blog-container">
        <BlogContent />
      </div>
    </div>
  )
}
