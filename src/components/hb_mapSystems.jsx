/**
 * System Map Component for Homebase Terminal
 * Handles the MAP tab system listing and launch functionality
 */

const MapSystems = () => {
  // Available systems from SCA database
  const systemOptions = [
    {
      name: 'KEPLER-442',
      star: 'K-TYPE ORANGE',
      radiation: 'MODERATE',
      threat: 'LOW',
      distance: '1,194 LY',
      seed: 44201
    },
    {
      name: 'VEGA-7',
      star: 'A-TYPE BLUE-WHITE',
      radiation: 'HIGH',
      threat: 'MEDIUM',
      distance: '25 LY',
      seed: 70001
    },
    {
      name: "BARNARD'S REFUGE",
      star: 'M-TYPE RED',
      radiation: 'LOW',
      threat: 'UNKNOWN',
      distance: '6 LY',
      seed: 88302
    }
  ];

  const handleLaunch = (system) => {
    // TODO: Implement launch logic with ship state
    console.log('Launching to system:', system);
  };

  return (
    <div className="system-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {systemOptions.map((sys, idx) => (
        <div key={idx} className="system-item holo-box" style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div className="holo-text" style={{ fontSize: '10px', fontWeight: '600' }}>{sys.name}</div>
            <button className="small-btn" style={{ fontSize: '8px', padding: '3px 8px' }} onClick={() => handleLaunch(sys)}>
              LAUNCH
            </button>
          </div>
          <div className="text-muted" style={{ fontSize: '7px', lineHeight: '1.3' }}>
            STAR: {sys.star}
            <br />
            RADIATION: {sys.radiation} | THREAT: {sys.threat}
            <br />
            DISTANCE: {sys.distance}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MapSystems;
