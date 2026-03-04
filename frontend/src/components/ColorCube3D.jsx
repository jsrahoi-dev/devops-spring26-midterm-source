import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'

function ColorPoint({ position, color, data, onClick }) {
  return (
    <mesh position={position} onClick={() => onClick(data)}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function ColorCube({ colors, mode }) {
  const [selected, setSelected] = useState(null)

  const getColorPoints = () => {
    return colors.map(c => ({
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: vizData } = await axios.get('/api/visualize/data')
      setData(vizData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching visualization data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading 3D visualization...
    </div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0 }}>3D Color Space</h1>
          <Link to="/results">← Back to Results</Link>
        </div>

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
      </div>

      <div style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <Canvas camera={{ position: [2, 2, 2], fov: 75 }}>
          {data && <ColorCube colors={data.colors} mode={mode} />}
        </Canvas>
      </div>
    </div>
  )
}
