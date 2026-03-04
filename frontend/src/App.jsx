import { Routes, Route } from 'react-router-dom'
import LanguageSelection from './components/LanguageSelection'
import ColorClassifier from './components/ColorClassifier'
import Results from './components/Results'
import ColorCube3D from './components/ColorCube3D'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LanguageSelection />} />
        <Route path="/classify" element={<ColorClassifier />} />
        <Route path="/results" element={<Results />} />
        <Route path="/explore" element={<ColorCube3D />} />
      </Routes>
    </div>
  )
}

export default App
