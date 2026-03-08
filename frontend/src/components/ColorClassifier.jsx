import { useState, useEffect } from 'react'
import axios from 'axios'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import './ColorClassifier.css'

export default function ColorClassifier() {
  const [color, setColor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  useEffect(() => {
    fetchColor()
  }, [])

  const fetchColor = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/colors/next')

      // Always expect { rgb_r, rgb_g, rgb_b, hex }
      setColor(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching color:', error)
      setLoading(false)
    }
  }

  const handleClassification = async (classification) => {
    if (!color) return

    try {
      // Send RGB values instead of color_id
      const response = await axios.post('/api/responses', {
        rgb_r: color.rgb_r,
        rgb_g: color.rgb_g,
        rgb_b: color.rgb_b,
        classification
      })

      // Show badge if user was first
      if (response.data.wasFirst) {
        console.log('🥇 You were first to classify this color!')
        // Could add toast notification here
      }

      // Refresh stats
      setStatsRefreshKey(prev => prev + 1)

      // Fetch next color
      await fetchColor()
    } catch (error) {
      console.error('Error submitting classification:', error)
      alert('Failed to save your answer. Please try again.')
    }
  }

  return (
    <div className="color-classifier">
      <LeftPanel
        color={color}
        onClassify={handleClassification}
        loading={loading}
      />
      <RightPanel onStatsRefresh={statsRefreshKey} />
    </div>
  )
}
