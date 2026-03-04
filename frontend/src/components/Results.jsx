import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function Results() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const { data } = await axios.get('/api/results/mine')
      setResults(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching results:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading results...
    </div>
  }

  if (!results || results.results.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>
      <p>No results yet. Complete the color classification first!</p>
      <Link to="/classify">Start Classifying</Link>
    </div>
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1>Your Results</h1>

        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '48px', margin: 0, color: '#007bff' }}>
            {results.overall_agreement}%
          </h2>
          <p style={{ fontSize: '18px', color: '#666' }}>
            Overall agreement with other users
          </p>
        </div>

        <h2>Detailed Breakdown</h2>
        {results.results.map((result, idx) => (
          <div key={idx} style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: result.color.hex,
              borderRadius: '8px',
              border: '2px solid #ddd'
            }} />

            <div style={{ flex: 1 }}>
              <p style={{ margin: '5px 0' }}>
                <strong>Your answer:</strong> {result.your_answer}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Most common:</strong> {result.most_common}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Agreement:</strong> {result.agreement_percent}% of users said "{result.your_answer}"
              </p>
              {result.agreed_with_majority ? (
                <p style={{ color: 'green', margin: '5px 0' }}>✓ You agreed with the majority</p>
              ) : (
                <p style={{ color: 'orange', margin: '5px 0' }}>✗ You had a unique perspective</p>
              )}
            </div>
          </div>
        ))}

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <Link to="/explore" style={{
            padding: '15px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px'
          }}>
            Explore 3D Color Space →
          </Link>
        </div>
      </div>
    </div>
  )
}
