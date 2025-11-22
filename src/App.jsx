import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginFrame from './components/LoginFrame'
import HomebaseTerminal from './components/HomebaseTerminal'
import ShipCommandConsole from './components/ShipCommandConsole'
import GalaxyCreator from './components/GalaxyCreator'
import Login from './components/admin/Login'
import AdminPanel from './components/admin/AdminPanel'
import { exampleSeeds } from './lib/systemGenerator'

function GameApp() {
  const [currentFrame, setCurrentFrame] = useState('login')
  const [expeditionSeed, setExpeditionSeed] = useState(exampleSeeds()[0])
  const [spawnPosition, setSpawnPosition] = useState(null) // null = default edge spawn
  const [showGalaxyCreator, setShowGalaxyCreator] = useState(false)
  
  // Dev Mode state - persisted in localStorage
  const [devMode, setDevMode] = useState(() => {
    const saved = localStorage.getItem('devMode')
    return saved !== null ? saved === 'true' : true
  })
  
  // Persist dev mode to localStorage
  useEffect(() => {
    localStorage.setItem('devMode', devMode.toString())
  }, [devMode])
  
  const toggleDevMode = () => setDevMode(prev => !prev)

  return (
    <div className="app">
      {/* Dev Tool: Galaxy Creator */}
      {showGalaxyCreator && <GalaxyCreator onClose={() => setShowGalaxyCreator(false)} />}
      
      {/* Keyboard shortcut listener */}
      <div
        tabIndex={0}
        style={{ width: '100%', height: '100%', outline: 'none' }}
      >
        {/* Render Current Frame */}
        {currentFrame === 'login' && <LoginFrame onLogin={() => setCurrentFrame('homebase')} />}
        {currentFrame === 'homebase' && (
          <HomebaseTerminal
            onLaunch={(seed, position) => {
              if (seed) setExpeditionSeed(seed)
              setSpawnPosition(position || null)
              setCurrentFrame('ship')
            }}
            onCreateGalaxy={() => setShowGalaxyCreator(true)}
            devMode={devMode}
            onDevModeToggle={toggleDevMode}
            onNavigate={setCurrentFrame}
            setExpeditionSeed={setExpeditionSeed}
          />
        )}
        {currentFrame === 'ship' && (
          <ShipCommandConsole 
            onNavigate={setCurrentFrame} 
            initialSeed={expeditionSeed}
            initialPosition={spawnPosition}
            devMode={devMode}
            onDevModeToggle={toggleDevMode}
            onCreateGalaxy={() => setShowGalaxyCreator(true)}
          />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Game Routes */}
        <Route path="/" element={<GameApp />} />
        
        {/* Admin Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
