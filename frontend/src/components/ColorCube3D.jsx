import { useState, useEffect } from 'react'
import axios from 'axios'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import './ColorCube3D.css'

function ColorPoint({ position, color, data, onClick }) {
  return (
    <mesh position={position} onClick={() => onClick(data)}>
      <sphereGeometry args={[0.08, 20, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  )
}

function ColorCube({ colors, mode }) {
  const [selected, setSelected] = useState(null)

  const getColorPoints = () => {
    // Filter/sort colors based on mode
    let filteredColors = [...colors]

    if (mode === 'controversial') {
      // Sort by controversy (highest first) and take top 50
      filteredColors = filteredColors
        .sort((a, b) => b.controversy - a.controversy)
        .slice(0, 50)
    } else if (mode === 'agreement') {
      // Sort by agreement (highest first) and take top 50
      filteredColors = filteredColors
        .sort((a, b) => b.agreement - a.agreement)
        .slice(0, 50)
    }
    // mode === 'explore' shows all colors

    return filteredColors.map(c => ({
      position: [c.rgb.r / 255 * 2 - 1, c.rgb.g / 255 * 2 - 1, c.rgb.b / 255 * 2 - 1],
      color: c.hex,
      data: c
    }))
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {getColorPoints().map((point, idx) => (
        <ColorPoint
          key={idx}
          position={point.position}
          color={point.color}
          data={point.data}
          onClick={setSelected}
        />
      ))}

      <OrbitControls />

      {selected && (
        <Html position={[0, 0, 0]}>
          <div style={{
            background: 'white',
            padding: '10px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <strong>{selected.hex}</strong>
            <p>Most common: {selected.most_common}</p>
            <p>Controversy: {selected.controversy}%</p>
          </div>
        </Html>
      )}
    </>
  )
}

export default function ColorCube3D() {
  const [data, setData] = useState(null)
  const [mode, setMode] = useState('explore')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('global')

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/visualize/data?view=${view}`)
        if (!cancelled) {
          setData(response.data)
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching visualization data:', err)
          setError(err.response?.data?.error || 'Failed to load visualization data')
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [view])  // Re-fetch when view changes

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading 3D visualization...
    </div>
  }

  if (error) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px', textAlign: 'center' }}>
      <h2>Error loading visualization</h2>
      <p>{error}</p>
    </div>
  }

  if (!data || !data.colors || data.colors.length === 0) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px', textAlign: 'center' }}>
      <h2>No data available yet</h2>
      <p>Colors will appear here once classifications have been submitted.</p>
      <p>Try classifying some colors first!</p>
    </div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0 }}>3D Color Space</h1>

        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setMode('explore')}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'explore' ? '#007bff' : '#e0e0e0',
              color: mode === 'explore' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Explore All
          </button>
          <button
            onClick={() => setMode('controversial')}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'controversial' ? '#007bff' : '#e0e0e0',
              color: mode === 'controversial' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Most Controversial
          </button>
          <button
            onClick={() => setMode('agreement')}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'agreement' ? '#007bff' : '#e0e0e0',
              color: mode === 'agreement' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Most Agreement
          </button>
        </div>

        <div className="cube-view-toggle">
          <button
            className={view === 'personal' ? 'active' : ''}
            onClick={() => {
              setView('personal')
              setLoading(true)
            }}
          >
            My Colors
          </button>
          <button
            className={view === 'global' ? 'active' : ''}
            onClick={() => {
              setView('global')
              setLoading(true)
            }}
          >
            All Colors
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '600px', backgroundColor: '#1a1a1a' }}>
        <Canvas
          camera={{ position: [2, 2, 2], fov: 75 }}
          style={{ width: '100%', height: '100%' }}
        >
          {data && <ColorCube colors={data.colors} mode={mode} />}
        </Canvas>
      </div>
    </div>
  )
}
