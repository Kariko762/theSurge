import { useState, useMemo } from 'react'
import UniverseViewer from './UniverseViewer.jsx'
import GalaxyViewer from './GalaxyViewer.jsx'
import { generateUniverse } from '../lib/galaxyGenerator.js'

/**
 * Galaxy Map Component for Homebase Terminal
 * Handles Universe and Galaxy viewers
 */

const MapGalaxies = ({ onLaunch }) => {
  const [selectedGalaxy, setSelectedGalaxy] = useState(null);

  // Generate universe (memoized)
  const universe = useMemo(() => generateUniverse(5), []);

  const handleSelectSystem = (system) => {
    // Jump to ship at this system
    if (onLaunch) {
      onLaunch(system.seed);
    }
  };

  const handleSelectGalaxy = (galaxy) => {
    setSelectedGalaxy(galaxy);
  };

  // If a galaxy is selected, show Galaxy Viewer fullscreen
  if (selectedGalaxy) {
    return (
      <div className="no-scanlines" style={{ width: '100%', height: '100%' }}>
        <GalaxyViewer
          galaxy={selectedGalaxy}
          currentSystemId="HOMEBASE"
          onClose={() => setSelectedGalaxy(null)}
          onSelectSystem={handleSelectSystem}
          onLaunch={onLaunch}
        />
      </div>
    );
  }

  // Otherwise show Universe Viewer fullscreen
  return (
    <UniverseViewer
      onClose={() => {}} // No close button needed since we're in MAP tab
      onSelectGalaxy={handleSelectGalaxy}
    />
  );
};

export default MapGalaxies;
