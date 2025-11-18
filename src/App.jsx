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
      
      {/* Galaxy Creator Icon Button - Top Right */}
      {currentFrame === 'homebase' && (
        <button
          onClick={() => setShowGalaxyCreator(true)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            background: 'rgba(0, 20, 40, 0.8)',
            border: '1px solid #34e0ff',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 20px rgba(52, 224, 255, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(52, 224, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(52, 224, 255, 0.3)';
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ filter: 'drop-shadow(0 0 4px rgba(52, 224, 255, 0.8))' }}>
            {/* Central Sun */}
            <circle cx="20" cy="20" r="5" fill="#ffaa00" />
            <circle cx="20" cy="20" r="6" fill="none" stroke="#ffaa00" strokeWidth="0.5" opacity="0.6" />
            
            {/* Inner orbit path */}
            <circle cx="20" cy="20" r="10" fill="none" stroke="#34e0ff" strokeWidth="0.5" opacity="0.3" />
            {/* Inner planet */}
            <circle cx="30" cy="20" r="1.5" fill="#34e0ff" />
            
            {/* Middle orbit path */}
            <circle cx="20" cy="20" r="14" fill="none" stroke="#34e0ff" strokeWidth="0.5" opacity="0.3" />
            {/* Middle planet */}
            <circle cx="20" cy="6" r="2" fill="#34e0ff" />
            
            {/* Outer orbit path */}
            <circle cx="20" cy="20" r="18" fill="none" stroke="#34e0ff" strokeWidth="0.5" opacity="0.3" />
            {/* Outer planet */}
            <circle cx="10" cy="30" r="1.5" fill="#34e0ff" />
          </svg>
        </button>
      )}
      
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
