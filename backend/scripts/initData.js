const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_DIR = path.join(__dirname, '../data');

async function initializeData() {
  console.log('Initializing backend data files...\n');

  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('✓ Data directory created');

    // Create default admin user
    const defaultUsers = [
      {
        id: 'user_admin',
        username: 'admin',
        email: 'admin@surge.game',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
    ];

    await writeJSONFile('users.json', defaultUsers);
    console.log('✓ Created users.json with default admin user');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!\n');

    // Create default config
    const defaultConfig = {
      difficultyCurve: {
        trivial: { dc: 0 },
        easy: { dc: 3 },
        normal: { dc: 8 },
        hard: { dc: 12 },
        deadly: { dc: 16 },
        impossible: { dc: 20 }
      },
      lootMultipliers: {
        criticalSuccess: { min: 2.0, max: 3.0 },
        success: { min: 1.0, max: 1.5 },
        partialSuccess: { min: 0.5, max: 0.8 },
        failure: { min: 0.0, max: 0.2 }
      },
      encounterRates: {
        trader: { weight: 20, cooldown: 300 },
        pirate: { weight: 15, cooldown: 600 },
        derelict: { weight: 10, cooldown: 900 },
        anomaly: { weight: 5, cooldown: 1200 }
      },
      riskCalculation: {
        wakeWeight: 40,
        locationWeight: 30,
        timeWeight: 15,
        eventWeight: 10,
        missionWeight: 5
      },
      dynamicScheduler: {
        lowRisk: { threshold: 20, interval: 60 },
        moderateRisk: { threshold: 40, interval: 30 },
        highRisk: { threshold: 60, interval: 15 },
        criticalRisk: { threshold: 80, interval: 5 },
        extremeRisk: { threshold: 100, interval: 2 }
      }
    };

    await writeJSONFile('config.json', defaultConfig);
    console.log('✓ Created config.json with default settings');

    // Create empty event files
    await writeJSONFile('events_poi.json', []);
    console.log('✓ Created events_poi.json');

    await writeJSONFile('events_dynamic.json', []);
    console.log('✓ Created events_dynamic.json');

    await writeJSONFile('events_mission.json', []);
    console.log('✓ Created events_mission.json');

    // Create empty missions file
    await writeJSONFile('missions.json', []);
    console.log('✓ Created missions.json');

    console.log('\n✅ Initialization complete!');
    console.log('\nYou can now start the server with: npm start');
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

async function writeJSONFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// Run initialization
initializeData();
