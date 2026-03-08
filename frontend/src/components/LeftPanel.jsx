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

  if (!color) {
    return (
      <div className="left-panel" style={{ backgroundColor: '#f0f0f0' }}>
        <div className="classification-container">
          <h2 className="classification-prompt">🎉 All colors classified!</h2>
          <p style={{ color: 'white', textAlign: 'center', fontSize: '18px', textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}>
            Check out your stats on the right →
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="left-panel" style={{ backgroundColor: color.hex }}>
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
