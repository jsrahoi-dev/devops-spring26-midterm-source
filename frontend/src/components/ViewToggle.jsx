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
