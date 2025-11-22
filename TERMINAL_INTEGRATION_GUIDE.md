# Terminal Integration Guide - Event Engine

## 🎯 Overview

All events output through the terminal using a **dual-stream format**:
- **Conversational Stream**: AI dialogue, narrative, story beats
- **Data Stream**: Technical info, rolls, modifiers, outcomes

---

## 📺 Terminal Output Format

### **Event Start (Scenario Presentation)**
```javascript
{
  type: 'event_start',
  conversational: [
    "ARIA: \"Caution - asteroid exhibits unstable rotation pattern.\"",
    "FORGE: \"Mineral composition is high-grade, but risk of fragmentation is elevated.\"",
    "GHOST: \"...structural analysis... recommend precision approach...\""
  ],
  stream: [
    "> EVENT TRIGGERED: UNSTABLE_ASTEROID",
    "> TYPE: Mining Hazard",
    "> CLUSTER: Type-III (High Grade)",
    "> DIFFICULTY: Normal (DC 10)"
  ],
  timestamp: 1732233456789
}
```

### **DRE Roll Output**
```javascript
{
  type: 'event_roll',
  stream: [
    "> ROLL: 2d6 = 8 [4, 4]",
    "> MODIFIERS: Ship +3, AI +1, Research +1 = +5",
    "> TOTAL: 13 vs DC 10 (SUCCESS +3)"
  ],
  timestamp: 1732233458123
}
```

### **Event Resolution (Outcome)**
```javascript
{
  type: 'event',
  conversational: [
    "FORGE: \"Excellent work! High-grade ore extracted successfully.\"",
    "ARIA: \"Mining operation complete. Crystal shards detected in sample.\""
  ],
  stream: [
    "> RESOLUTION: SUCCESS",
    "> ROLL: 13 vs DC 10 (+3)",
    "> LOOT: 5x Rare Ore, 2x Crystal Shard",
    "> SCIENCE: +25",
    "> WAKE: +0.02"
  ],
  timestamp: 1732233460456
}
```

### **Player Choice Prompt**
```javascript
{
  type: 'event_choice',
  conversational: [
    "ARIA: \"Contact detected - civilian transponder, independent trader.\"",
    "FORGE: \"They're hailing us. What's your call, Commander?\""
  ],
  stream: [
    "> DYNAMIC EVENT: TRADER_ENCOUNTER",
    "> AWAITING PLAYER INPUT:"
  ],
  choices: [
    "[1] Open trade menu",
    "[2] Ask for information",
    "[3] Decline and continue"
  ],
  timeLimit: null, // or number of seconds
  timestamp: 1732233462789
}
```

---

## 🔌 Integration Pattern

### **ShipCommandConsole.jsx**
```jsx
import { executeEvent } from '../lib/events/eventEngine.js';
import { dynamicEventScheduler } from '../lib/events/dynamicEventScheduler.js';

export function ShipCommandConsole() {
  const [terminalEvents, setTerminalEvents] = useState([]);
  
  // Terminal callback - receives all event output
  const handleEventOutput = (output) => {
    setTerminalEvents(prev => [...prev, output]);
  };
  
  // Start dynamic scheduler
  useEffect(() => {
    const context = buildGameContext();
    context.terminalCallback = handleEventOutput;
    
    dynamicEventScheduler.start(context);
    
    return () => dynamicEventScheduler.stop();
  }, []);
  
  // Trigger manual event (POI action)
  const handlePOIAction = async (action, poi) => {
    const context = buildGameContext();
    context.terminalCallback = handleEventOutput;
    
    await executeEvent(`poi_${action}_${poi.type}`, context, { poi });
  };
  
  return (
    <div>
      <TerminalFeed events={terminalEvents} />
    </div>
  );
}
```

### **TerminalFeed.jsx**
```jsx
export function TerminalFeed({ events }) {
  return (
    <div className="terminal-feed">
      {events.map((event, idx) => (
        <TerminalEvent key={idx} event={event} />
      ))}
    </div>
  );
}

function TerminalEvent({ event }) {
  return (
    <div className="terminal-event">
      {/* Conversational stream (AI dialogue) */}
      {event.conversational && (
        <div className="conversational-stream">
          {event.conversational.map((line, i) => (
            <div key={i} className="ai-dialogue">{line}</div>
          ))}
        </div>
      )}
      
      {/* Data stream (technical info) */}
      {event.stream && (
        <div className="data-stream">
          {event.stream.map((line, i) => (
            <div key={i} className="data-line">{line}</div>
          ))}
        </div>
      )}
      
      {/* Player choices (if applicable) */}
      {event.choices && (
        <div className="choice-prompt">
          {event.choices.map((choice, i) => (
            <button key={i} className="choice-button">
              {choice}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Styling Example

```css
.terminal-event {
  margin-bottom: 1.5rem;
  border-left: 2px solid var(--accent-blue);
  padding-left: 1rem;
}

.conversational-stream {
  margin-bottom: 0.5rem;
}

.ai-dialogue {
  font-family: 'Roobert', sans-serif;
  color: var(--text-primary);
  margin-bottom: 0.3rem;
  line-height: 1.4;
}

.data-stream {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--accent-cyan);
  opacity: 0.8;
}

.data-line {
  margin-bottom: 0.2rem;
}

.choice-prompt {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice-button {
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid var(--accent-cyan);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  cursor: pointer;
  text-align: left;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
}

.choice-button:hover {
  background: rgba(0, 255, 255, 0.2);
  border-color: var(--accent-blue);
}
```

---

## 📋 Event JSON Terminal Blocks

### **Adding Terminal Output to Events**

Every scenario and resolution should have a `terminal` block:

```json
{
  "scenario": {
    "name": "Event Name",
    "description": "Brief description",
    "terminal": {
      "conversational": [
        "ARIA: \"AI dialogue here\"",
        "FORGE: \"More dialogue\""
      ],
      "stream": [
        "> EVENT: event_id",
        "> TYPE: event_type",
        "> DIFFICULTY: DC value"
      ]
    }
  },
  
  "resolutions": [
    {
      "range": [2, 5],
      "severity": "critical_failure",
      "terminal": {
        "conversational": [
          "ARIA: \"Failure dialogue\"",
          "FORGE: \"Consequences\""
        ],
        "stream": [
          "> RESOLUTION: CRITICAL FAILURE",
          "> ROLL: X vs DC Y (margin)",
          "> DAMAGE: System -Amount",
          "> LOOT: None"
        ]
      },
      "outcomes": { /* ... */ }
    }
  ]
}
```

---

## 🔍 Terminal Formatter Usage

### **Manual Terminal Output**
```javascript
import { formatEventStart, formatDREResult, formatCompleteEvent } from './lib/events/terminalFormatter.js';

// Format event scenario
const scenarioOutput = formatEventStart(event, context);
terminalCallback(scenarioOutput);

// Format DRE roll
const rollOutput = formatDREResult(dreResult);
terminalCallback({ type: 'event_roll', stream: rollOutput });

// Format complete event
const completeOutput = formatCompleteEvent(eventResult);
terminalCallback(completeOutput);
```

---

## ✅ Checklist

When integrating events with terminal:

- [ ] Event JSON has `terminal` blocks in scenario
- [ ] Event JSON has `terminal` blocks in all resolutions
- [ ] `terminalCallback` passed in context
- [ ] Terminal output includes both conversational + data streams
- [ ] Choice prompts formatted correctly
- [ ] DRE rolls output detailed modifier breakdown
- [ ] Outcomes show loot/damage/flags clearly
- [ ] Follow-up events announced in stream

---

**All event narrative flows through the terminal - this is the single source of truth for player feedback.** 🖥️🚀
