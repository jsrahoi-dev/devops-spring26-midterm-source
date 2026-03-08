import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LanguageSelection from './components/LanguageSelection'
import ColorClassifier from './components/ColorClassifier'
import Results from './components/Results'
import ColorCube3D from './components/ColorCube3D'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LanguageSelection />} />
          <Route path="/classify" element={<ColorClassifier />} />
          <Route path="/results" element={<Results />} />
          <Route path="/explore" element={<ColorCube3D />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
