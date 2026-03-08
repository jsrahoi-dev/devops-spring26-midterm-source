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
