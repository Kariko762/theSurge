import { useState } from 'react'
import LoginFrame from './components/LoginFrame'
import HomebaseTerminal from './components/HomebaseTerminal'
import ShipCommandConsole from './components/ShipCommandConsole'
import GalaxyCreator from './components/GalaxyCreator'
import { exampleSeeds } from './lib/systemGenerator'

function App() {
  const [currentFrame, setCurrentFrame] = useState('login')
  const [expeditionSeed, setExpeditionSeed] = useState(exampleSeeds()[0])
  const [showGalaxyCreator, setShowGalaxyCreator] = useState(false)

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
            onLaunch={(seed) => {
              if (seed) setExpeditionSeed(seed)
              setCurrentFrame('ship')
            }}
            onCreateGalaxy={() => setShowGalaxyCreator(true)}
          />
        )}
        {currentFrame === 'ship' && (
          <ShipCommandConsole onNavigate={setCurrentFrame} initialSeed={expeditionSeed} />
        )}
      </div>
    </div>
  )
}

export default App
