import { useState, useEffect } from 'react'
import axios from 'axios'
import './StatsView.css'

function formatColorCount(count) {
  if (!count) return '0 / 16.7M';
  return `${count.toLocaleString()} / 16.7M`;
}

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
          <span className="stat-value">{personalStats.totalClassified}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🥇</span>
          <span className="stat-label">First to Classify:</span>
          <span className="stat-value">{personalStats.firstToClassify}</span>
        </div>
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
          <span className="stat-label">Colors Classified:</span>
          <span className="stat-value">{formatColorCount(globalStats.totalColors)}</span>
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
