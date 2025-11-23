import { InfoIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function EventSystemGuide() {
  return (
    <div style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
          Event System Guide
        </h2>
        <div className="status-badge status-info" style={{ padding: '0.5rem 1rem' }}>
          END-TO-END WORKFLOW
        </div>
      </div>

      {/* Introduction */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <InfoIcon size={32} />
          <div>
            <h3 style={{ color: 'var(--neon-cyan)', margin: '0 0 0.75rem 0', fontSize: '1.3rem' }}>
              How Events Flow Through The System
            </h3>
            <p style={{ color: '#ccc', lineHeight: '1.7', margin: 0 }}>
              This guide explains the complete lifecycle of an event from trigger to output. 
              Events are the core of the dynamic storytelling system, creating emergent gameplay 
              through procedural encounters, challenges, and consequences.
            </p>
          </div>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.2rem' }}>
          Event Lifecycle Pipeline
        </h3>

        <div style={{ position: 'relative' }}>
          {/* Stage 1: TRIGGER */}
          <div className="glass-card" style={{ 
            padding: '1.5rem', 
            marginBottom: '1rem',
            background: 'rgba(0, 255, 255, 0.05)',
            borderColor: 'rgba(0, 255, 255, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'var(--neon-cyan)',
                color: '#000',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                boxShadow: '0 0 20px var(--neon-cyan)'
              }}>1</div>
              <h4 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.1rem' }}>
                TRIGGER EVALUATION
              </h4>
            </div>
            <p style={{ color: '#aaa', margin: '0 0 1rem 0', lineHeight: '1.6' }}>
              The Event Scheduler checks conditions every 5-15 seconds. When a player action occurs 
              (mining, scanning, combat), the system evaluates which events can trigger based on:
            </p>
            <ul style={{ color: '#888', marginLeft: '3.5rem', lineHeight: '1.8' }}>
              <li><strong style={{ color: '#00ff88' }}>Trigger Type:</strong> poi_action, dynamic, mission, time_based, location_based</li>
              <li><strong style={{ color: '#00ff88' }}>Weight:</strong> Higher weights = more likely (0.1 = rare, 10 = common)</li>
              <li><strong style={{ color: '#00ff88' }}>Conditions:</strong> Player state, location, resources, previous events</li>
              <li><strong style={{ color: '#00ff88' }}>Enabled State:</strong> Only enabled events can trigger</li>
            </ul>
            <div className="code-preview" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              <pre>{`{
  "trigger": {
    "type": "poi_action",
    "weight": 2.5,
    "conditions": { "action": "mining", "location": "asteroid_belt" }
  }
}`}</pre>
            </div>
          </div>

          {/* Arrow Down */}
          <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--neon-cyan)', fontSize: '2rem' }}>
            ↓
          </div>

          {/* Stage 2: SCENARIO */}
          <div className="glass-card" style={{ 
            padding: '1.5rem', 
            marginBottom: '1rem',
            background: 'rgba(255, 170, 0, 0.05)',
            borderColor: 'rgba(255, 170, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: '#ffaa00',
                color: '#000',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                boxShadow: '0 0 20px #ffaa00'
              }}>2</div>
              <h4 style={{ color: '#ffaa00', margin: 0, fontSize: '1.1rem' }}>
                SCENARIO PRESENTATION
              </h4>
            </div>
            <p style={{ color: '#aaa', margin: '0 0 1rem 0', lineHeight: '1.6' }}>
              The event scenario is displayed to the player through the Terminal Modal. This includes:
            </p>
            <ul style={{ color: '#888', marginLeft: '3.5rem', lineHeight: '1.8' }}>
              <li><strong style={{ color: '#ffaa00' }}>Title:</strong> Eye-catching event name ("Unstable Asteroid Detected")</li>
              <li><strong style={{ color: '#ffaa00' }}>Description:</strong> Rich narrative text setting the scene</li>
              <li><strong style={{ color: '#ffaa00' }}>Location:</strong> Where this is happening (adds context)</li>
              <li><strong style={{ color: '#ffaa00' }}>Characters:</strong> NPCs or AI personas involved</li>
            </ul>
            <div className="code-preview" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              <pre>{`{
  "scenario": {
    "title": "Unstable Asteroid Detected",
    "description": "Your mining laser strikes an unusual ore vein. The asteroid begins to fracture, revealing volatile pockets of compressed gas. You have seconds to decide.",
    "location": "Asteroid Belt - Sector 7",
    "characters": ["Ship AI - VERA"]
  }
}`}</pre>
            </div>
          </div>

          {/* Arrow Down */}
          <div style={{ textAlign: 'center', margin: '1rem 0', color: '#ffaa00', fontSize: '2rem' }}>
            ↓
          </div>

          {/* Stage 3: BRANCHES */}
          <div className="glass-card" style={{ 
            padding: '1.5rem', 
            marginBottom: '1rem',
            background: 'rgba(255, 0, 255, 0.05)',
            borderColor: 'rgba(255, 0, 255, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: '#ff00ff',
                color: '#000',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                boxShadow: '0 0 20px #ff00ff'
              }}>3</div>
              <h4 style={{ color: '#ff00ff', margin: 0, fontSize: '1.1rem' }}>
                BRANCH SELECTION
              </h4>
            </div>
            <p style={{ color: '#aaa', margin: '0 0 1rem 0', lineHeight: '1.6' }}>
              Player chooses from available branches (choices). Each branch can have an optional skill check:
            </p>
            <ul style={{ color: '#888', marginLeft: '3.5rem', lineHeight: '1.8' }}>
              <li><strong style={{ color: '#ff00ff' }}>Simple Branch:</strong> Direct narrative outcome (no challenge)</li>
              <li><strong style={{ color: '#ff00ff' }}>Challenge Branch:</strong> Skill check required with weighted sub-scenarios</li>
              <li><strong style={{ color: '#ff00ff' }}>Difficulty:</strong> trivial, easy, medium, hard, very_hard, extreme</li>
              <li><strong style={{ color: '#ff00ff' }}>Skills:</strong> piloting, engineering, combat, science, perception, etc.</li>
              <li><strong style={{ color: '#ff00ff' }}>DRE Roll:</strong> 1d20 + skill bonuses + equipment vs. target DC</li>
            </ul>
            <div className="code-preview" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              <pre>{`{
  "branches": [
    {
      "id": "investigate",
      "label": "Investigate the anomaly",
      "challenge": {
        "mode": "skillCheck",
        "difficulty": "hard",
        "skills": ["perception", "science"],
        "baseTarget": 16
      },
      "subScenarios": [
        { "outcomeType": "success", "weight": 0.6, ... },
        { "outcomeType": "failure", "weight": 0.4, ... }
      ]
    },
    {
      "id": "leave",
      "label": "Leave immediately",
      "challenge": null,
      "outcomes": [
        { "weight": 1.0, "narrative": "You safely retreat...", ... }
      ]
    }
  ]
}`}</pre>
            </div>
          </div>

          {/* Arrow Down */}
          <div style={{ textAlign: 'center', margin: '1rem 0', color: '#ff00ff', fontSize: '2rem' }}>
            ↓
          </div>

          {/* Stage 4: RESOLUTION */}
          <div className="glass-card" style={{ 
            padding: '1.5rem', 
            marginBottom: '1rem',
            background: 'rgba(0, 255, 136, 0.05)',
            borderColor: 'rgba(0, 255, 136, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: '#00ff88',
                color: '#000',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                boxShadow: '0 0 20px #00ff88'
              }}>4</div>
              <h4 style={{ color: '#00ff88', margin: 0, fontSize: '1.1rem' }}>
                OUTCOME SELECTION
              </h4>
            </div>
            <p style={{ color: '#aaa', margin: '0 0 1rem 0', lineHeight: '1.6' }}>
              Based on the challenge result (or direct choice), an outcome is selected and effects applied:
            </p>
            <ul style={{ color: '#888', marginLeft: '3.5rem', lineHeight: '1.8' }}>
              <li><strong style={{ color: '#00ff88' }}>Simple Outcomes:</strong> Direct narrative and rewards (no challenge branches)</li>
              <li><strong style={{ color: '#00ff88' }}>Sub-Scenarios:</strong> Weighted outcomes filtered by success/failure/critical</li>
              <li><strong style={{ color: '#00ff88' }}>Narrative:</strong> Title, description, system message describing what happens</li>
              <li><strong style={{ color: '#00ff88' }}>Rewards:</strong> Credits, XP, items, unlocks, damage/healing</li>
            </ul>
            <div className="code-preview" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
              <pre>{`// Challenge Branch Sub-Scenario (weighted)
{
  "id": "major_discovery",
  "weight": 0.3,
  "outcomeType": "critical_success",
  "narrative": {
    "title": "Major Discovery!",
    "description": "You uncover a cache of pre-Surge technology!",
    "systemMessage": "Rare artifacts acquired"
  },
  "rewards": {
    "credits": 2000,
    "xp": 150,
    "items": ["alien_artifact", "data_core"],
    "unlocks": ["research_quest_1"]
  }
}

// Simple Branch Outcome
{
  "weight": 1.0,
  "narrative": "You retreat safely to a nearby station.",
  "rewards": { "credits": 50 }
}`}</pre>
            </div>
          </div>

          {/* Arrow Down */}
          <div style={{ textAlign: 'center', margin: '1rem 0', color: '#00ff88', fontSize: '2rem' }}>
            ↓
          </div>

          {/* Stage 5: OUTPUT */}
          <div className="glass-card" style={{ 
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                background: '#fff',
                color: '#000',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                boxShadow: '0 0 20px #fff'
              }}>5</div>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>
                TERMINAL OUTPUT
              </h4>
            </div>
            <p style={{ color: '#aaa', margin: '0 0 1rem 0', lineHeight: '1.6' }}>
              The complete event output is displayed in the Terminal Feed with dual-stream formatting:
            </p>
            <ul style={{ color: '#888', marginLeft: '3.5rem', lineHeight: '1.8' }}>
              <li><strong style={{ color: '#fff' }}>Terminal Stream:</strong> Narrative text, story beats, AI responses</li>
              <li><strong style={{ color: '#fff' }}>System Stream:</strong> Mechanical updates (resources gained/lost, damage, unlocks)</li>
              <li><strong style={{ color: '#fff' }}>Formatting:</strong> Cyan text, monospace font, holographic styling</li>
              <li><strong style={{ color: '#fff' }}>History:</strong> All outputs saved to scrollable terminal feed</li>
            </ul>
            <div className="glass-card" style={{ 
              marginTop: '1rem', 
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }}>
              <div style={{ color: 'var(--neon-cyan)', marginBottom: '0.5rem' }}>&gt; EVENT: Unstable Asteroid Detected</div>
              <div style={{ color: '#aaa', marginBottom: '0.5rem' }}>You expertly maneuver away as the asteroid explodes...</div>
              <div style={{ color: '#00ff88' }}>+ 15 Rare Ore</div>
              <div style={{ color: '#00ff88' }}>+ 5 Exotic Gas</div>
              <div style={{ color: '#ffaa00' }}>+ 10 Miners Guild Reputation</div>
              <div style={{ color: '#666', marginTop: '0.5rem' }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Walkthrough */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
          Complete Example: "Derelict Distress Signal"
        </h3>

        <div style={{ 
          background: 'rgba(0, 20, 40, 0.6)', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 255, 0.2)'
        }}>
          {/* Example Timeline */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#00ffcc', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⏱️ T+0s - TRIGGER
            </div>
            <p style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.6' }}>
              Player enters deep space sector. Event scheduler evaluates: <code style={{ 
                background: 'rgba(0, 255, 255, 0.1)', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px',
                color: 'var(--neon-cyan)'
              }}>location_based</code> trigger fires. Weight 3.5, conditions met (player alone, low fuel).
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#ffaa00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⏱️ T+0.5s - SCENARIO DISPLAYED
            </div>
            <p style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.6' }}>
              Terminal Modal opens with title: <em>"Derelict Vessel - Distress Signal Active"</em>. 
              Description reveals an abandoned mining ship broadcasting an automated SOS. 
              Player sees options: Investigate, Ignore, Call for Backup.
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#ff00ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⏱️ T+15s - PLAYER CHOOSES "INVESTIGATE"
            </div>
            <p style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.6' }}>
              Player selects the "Investigate" branch. This branch has a skill check configured. 
              DRE initiates <code style={{ 
                background: 'rgba(255, 0, 255, 0.1)', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px',
                color: '#ff00ff'
              }}>skillCheck</code> challenge. Difficulty: Hard (DC 16). Required skills: perception, engineering. 
              Dice: 1d20(14) + perception(3) + ship_scanner(2) = 19 [SUCCESS]
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#00ff88', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⏱️ T+16s - SUCCESS SUB-SCENARIO SELECTED
            </div>
            <p style={{ color: '#aaa', marginLeft: '1.5rem', lineHeight: '1.6' }}>
              Challenge succeeded, so system filters sub-scenarios to only success/critical_success types. 
              Weighted random selection picks "valuable_salvage" (weight 0.6). 
              Success narrative displayed: "Your sensors detect no life signs, but the cargo bay contains valuable salvage." 
              Effects applied: +30 Scrap Metal, +10 Ship Components, +5 Data Cores, +15 Salvagers Guild Rep.
            </p>
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⏱️ T+17s - TERMINAL OUTPUT
            </div>
            <div style={{ 
              marginLeft: '1.5rem',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}>
              <div style={{ color: 'var(--neon-cyan)' }}>&gt; INVESTIGATING DERELICT VESSEL...</div>
              <div style={{ color: '#888', marginTop: '0.5rem' }}>[ PERCEPTION CHECK: 19 vs DC 16 - SUCCESS ]</div>
              <div style={{ color: '#aaa', marginTop: '0.5rem' }}>No life signs detected. Cargo bay accessible.</div>
              <div style={{ color: '#00ff88', marginTop: '0.75rem' }}>SALVAGE ACQUIRED:</div>
              <div style={{ color: '#00ff88' }}>+ 30 Scrap Metal</div>
              <div style={{ color: '#00ff88' }}>+ 10 Ship Components</div>
              <div style={{ color: '#00ff88' }}>+ 5 Data Cores (Encrypted)</div>
              <div style={{ color: '#ffaa00', marginTop: '0.5rem' }}>+ 15 Salvagers Guild Reputation</div>
              <div style={{ color: '#666', marginTop: '0.75rem' }}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
          Quick Reference: Creating Events
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(0, 204, 255, 0.05)' }}>
            <h4 style={{ color: 'var(--neon-cyan)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              1. Define Trigger
            </h4>
            <ul style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.6', margin: 0, paddingLeft: '1.25rem' }}>
              <li>Choose trigger type</li>
              <li>Set weight (rarity)</li>
              <li>Add conditions</li>
              <li>Enable/disable toggle</li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255, 170, 0, 0.05)' }}>
            <h4 style={{ color: '#ffaa00', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              2. Write Scenario
            </h4>
            <ul style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.6', margin: 0, paddingLeft: '1.25rem' }}>
              <li>Compelling title</li>
              <li>Rich description</li>
              <li>Set location/context</li>
              <li>Add characters (optional)</li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255, 0, 255, 0.05)' }}>
            <h4 style={{ color: '#ff00ff', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              3. Design Branches
            </h4>
            <ul style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.6', margin: 0, paddingLeft: '1.25rem' }}>
              <li>Create player choices</li>
              <li>Add skill checks (optional)</li>
              <li>Set difficulty & skills</li>
              <li>Define sub-scenarios/outcomes</li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(0, 255, 136, 0.05)' }}>
            <h4 style={{ color: '#00ff88', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              4. Create Outcomes
            </h4>
            <ul style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.6', margin: 0, paddingLeft: '1.25rem' }}>
              <li>Success/failure narratives</li>
              <li>Critical outcomes (optional)</li>
              <li>Define rewards/penalties</li>
              <li>Set weights for variety</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
