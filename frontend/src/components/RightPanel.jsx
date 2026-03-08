import { useState } from 'react'
import ViewToggle from './ViewToggle'
import StatsView from './StatsView'
import ColorCube3D from './ColorCube3D'
import './RightPanel.css'

export default function RightPanel({ onStatsRefresh }) {
  const [activeView, setActiveView] = useState('stats')

  return (
    <div className="right-panel">
      <ViewToggle activeView={activeView} onViewChange={setActiveView} />

      <div className="right-panel-content">
        {activeView === 'stats' && <StatsView key={onStatsRefresh} />}
        {activeView === 'cube' && <ColorCube3D />}
      </div>
    </div>
  )
}
