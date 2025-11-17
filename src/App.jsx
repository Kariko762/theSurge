import { useState } from 'react'
import LoginFrame from './components/LoginFrame'
import HomebaseTerminal from './components/HomebaseTerminal'
import ShipCommandConsole from './components/ShipCommandConsole'
import { exampleSeeds } from './lib/systemGenerator'

function App() {
  const [currentFrame, setCurrentFrame] = useState('login')
  const [expeditionSeed, setExpeditionSeed] = useState(exampleSeeds()[0])

  return (
    <div className="app">
      {/* Render Current Frame */}
      {currentFrame === 'login' && <LoginFrame onLogin={() => setCurrentFrame('homebase')} />}
      {currentFrame === 'homebase' && (
        <HomebaseTerminal
          onLaunch={(seed) => {
            if (seed) setExpeditionSeed(seed)
            setCurrentFrame('ship')
          }}
        />
      )}
      {currentFrame === 'ship' && (
        <ShipCommandConsole onNavigate={setCurrentFrame} initialSeed={expeditionSeed} />
      )}
    </div>
  )
}

export default App
