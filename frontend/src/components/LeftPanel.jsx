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
