import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function ColorClassifier() {
  const [color, setColor] = useState(null)
  const [count, setCount] = useState({ answered: 0, remaining: 5 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const classifications = [
    'pink', 'red', 'orange', 'yellow', 'green',
    'blue', 'purple', 'brown', 'black', 'white', 'grey'
  ]

  useEffect(() => {
    fetchColor()
    fetchCount()
  }, [])

  const fetchColor = async () => {
    try {
      const { data } = await axios.get('/api/colors/next')
      if (data.done) {
        navigate('/results')
      } else {
        setColor(data.color)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching color:', error)
    }
  }

  const fetchCount = async () => {
    try {
      const { data } = await axios.get('/api/colors/count')
      setCount(data)
    } catch (error) {
      console.error('Error fetching count:', error)
    }
  }

  const handleClassification = async (classification) => {
    try {
      await axios.post('/api/responses', {
        color_id: color.id,
        classification
      })

      if (count.answered + 1 >= 5) {
        navigate('/results')
      } else {
        setLoading(true)
        await fetchColor()
        await fetchCount()
      }
    } catch (error) {
      console.error('Error submitting classification:', error)
      alert('Failed to save your answer. Please try again.')
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading...
    </div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p>Color {count.answered + 1} of 5</p>
      </div>

      <div style={{
        flex: 1,
        backgroundColor: color?.hex || '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{
          color: 'white',
          textShadow: '0 0 10px rgba(0,0,0,0.5)',
          fontSize: '24px',
          marginBottom: '30px'
        }}>
          What color is this?
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          maxWidth: '600px',
          padding: '20px'
        }}>
          {classifications.map(classification => (
            <button
              key={classification}
              onClick={() => handleClassification(classification)}
              style={{
                padding: '15px',
                fontSize: '16px',
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {classification}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
