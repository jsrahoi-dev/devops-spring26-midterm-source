import { useState, useEffect } from 'react'
import axios from 'axios'
import './StatsView.css'

export default function StatsView() {
  const [personalStats, setPersonalStats] = useState(null)
  const [globalStats, setGlobalStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchStats = async () => {
      try {
        const [personalRes, globalRes] = await Promise.all([
          axios.get('/api/stats/personal'),
          axios.get('/api/stats/global')
        ])

        if (isMounted) {
          setPersonalStats(personalRes.data)
          setGlobalStats(globalRes.data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
        if (isMounted) {
          setError('Failed to load statistics')
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading || !personalStats || !globalStats) {
    return <div className="stats-view loading">Loading stats...</div>
  }

  if (error) {
    return <div className="stats-view error">{error}</div>
  }

  return (
    <div className="stats-view">
      <section className="stats-section personal-stats">
        <h3>Your Stats</h3>
        <div className="stat-item">
          <span className="stat-icon">🎨</span>
          <span className="stat-label">Colors Classified:</span>
          <span className="stat-value">{personalStats.totalClassified}/20</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🥇</span>
          <span className="stat-label">First to Classify:</span>
          <span className="stat-value">{personalStats.firstToClassify}</span>
        </div>

        {personalStats.controversialColors.length > 0 && (
          <div className="controversial-section">
            <h4>⚡ Most Controversial:</h4>
            {personalStats.controversialColors.map(color => (
              <div key={color.id} className="controversial-item">
                <div
                  className="color-swatch"
                  style={{ backgroundColor: color.hex }}
                ></div>
                <div className="controversial-details">
                  <div className="color-hex">{color.hex}</div>
                  <div className="classifications">
                    You: <strong>{color.yourClassification}</strong> |
                    Most: <strong>{color.majorityClassification}</strong>
                  </div>
                  <div className="disagreement">
                    {color.disagreementCount} people disagreed
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
          <span className="stat-label">Coverage:</span>
          <span className="stat-value">
            {globalStats.percentageCovered}% ({globalStats.totalColors})
          </span>
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
    </div>
  )
}
