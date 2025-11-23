import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api/client';
import EventExecutor from '../../lib/eventExecutor';
import { PlayIcon, RefreshIcon, LoadingIcon, WarningIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function EventSimulator() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [stepMode, setStepMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [executor] = useState(() => new EventExecutor());
  
  // Game context for testing
  const [gameContext, setGameContext] = useState({
    tier: 'T1',
    risk: 'medium',
    location: 'asteroid_belt',
    playerSkills: {
      perception: 3,
      technical: 2,
      engineering: 4,
      salvage: 2,
      science: 1,
      intuition: 2,
      combat: 2,
      piloting: 3
    },
    shipStats: {
      hull: 100,
      shields: 50,
      weapons: 3,
      sensors: 2
    },
    _expanded: false
  });

  // Panel logs
  const [terminalLog, setTerminalLog] = useState([]);
  const [dreLog, setDreLog] = useState([]);
  const [backendLog, setBackendLog] = useState([]);
  const [systemLog, setSystemLog] = useState([]);
  
  // Current execution state
  const [eventState, setEventState] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [outcome, setOutcome] = useState(null);
  
  // Auto-scroll refs
  const terminalRef = useRef(null);
  const dreRef = useRef(null);
  const backendRef = useRef(null);
  const systemRef = useRef(null);

  useEffect(() => {
    loadEvents();
  }, []);

  // Auto-scroll panels when logs update
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLog]);

  useEffect(() => {
    if (dreRef.current) dreRef.current.scrollTop = dreRef.current.scrollHeight;
  }, [dreLog]);

  useEffect(() => {
    if (backendRef.current) backendRef.current.scrollTop = backendRef.current.scrollHeight;
  }, [backendLog]);

  useEffect(() => {
    if (systemRef.current) systemRef.current.scrollTop = systemRef.current.scrollHeight;
  }, [systemLog]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Load all events from unified endpoint
      const response = await api.events.getAll();
      const allEvents = (response.events || []);

      setEvents(allEvents);
      setError('');
    } catch (err) {
      setError('Failed to load events: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const addLog = (panel, message, type = 'info', data = null) => {
    const entry = {
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      message,
      type,
      data,
      step: currentStep
    };

    switch (panel) {
      case 'terminal':
        setTerminalLog(prev => [...prev, entry]);
        break;
      case 'dre':
        setDreLog(prev => [...prev, entry]);
        break;
      case 'backend':
        setBackendLog(prev => [...prev, entry]);
        break;
      case 'system':
        setSystemLog(prev => [...prev, entry]);
        break;
    }
  };

  const resetSimulation = () => {
    setTerminalLog([]);
    setDreLog([]);
    setBackendLog([]);
    setSystemLog([]);
    setEventState(null);
    setSelectedBranch(null);
    setOutcome(null);
    setCurrentStep(0);
    setIsRunning(false);
    addLog('system', 'Simulation reset', 'system');
  };

  const runSimulation = async () => {
    if (!selectedEvent) {
      addLog('system', 'No event selected', 'error');
      return;
    }

    resetSimulation();
    setIsRunning(true);

    // Step 0: Initialize
    await executeStep(0);
  };

  const executeStep = async (step) => {
    setCurrentStep(step);
    
    switch (step) {
      case 0:
        await step_Initialize();
        break;
      case 1:
        await step_LoadEventData();
        break;
      case 2:
        await step_ValidateEventStructure();
        break;
      case 3:
        await step_ApplyGameContext();
        break;
      case 4:
        await step_SelectScenario();
        break;
      case 5:
        await step_DisplayScenario();
        break;
      case 6:
        await step_WaitForPlayerChoice();
        break;
      case 7:
        await step_ProcessChoice();
        break;
      case 8:
        await step_CalculateChallenge();
        break;
      case 9:
        await step_DetermineOutcome();
        break;
      case 10:
        await step_ApplyRewards();
        break;
      case 11:
        await step_TrackTelemetry();
        break;
      case 12:
        await step_Complete();
        break;
      default:
        addLog('system', 'Simulation complete', 'success');
        setIsRunning(false);
    }
  };

  // ========================================
  // STEP IMPLEMENTATIONS
  // ========================================

  const step_Initialize = async () => {
    addLog('system', '=== INITIALIZING SIMULATION ===', 'header');
    addLog('backend', 'EventExecutor initialized', 'system');
    addLog('backend', `Event ID: ${selectedEvent.id}`, 'info');
    addLog('backend', `Event Type: ${selectedEvent.trigger?.type || 'unknown'}`, 'info');
    addLog('terminal', '> System initialized...', 'system');
    
    if (!stepMode) {
      await delay(500);
      executeStep(1);
    }
  };

  const step_LoadEventData = async () => {
    addLog('system', `STEP 1: Loading Event Data`, 'header');
    addLog('backend', 'Loading event structure from database...', 'process');
    
    // Show event metadata
    const meta = selectedEvent.metadata;
    addLog('backend', `Title: ${meta?.title || 'Unknown'}`, 'info');
    addLog('backend', `Tags: [${meta?.tags?.join(', ') || 'none'}]`, 'info');
    addLog('backend', `Trigger Type: ${selectedEvent.trigger?.type || 'unknown'}`, 'info');
    addLog('backend', `Trigger Weight: ${selectedEvent.trigger?.weight || 1.0}`, 'info');
    addLog('backend', `Enabled: ${meta?.enabled ? 'YES' : 'NO'}`, meta?.enabled ? 'success' : 'warning');
    
    addLog('dre', 'Event data loaded into memory', 'info');
    addLog('dre', `Branches available: ${selectedEvent.branches?.length || 0}`, 'info');
    
    if (!stepMode) {
      await delay(500);
      executeStep(2);
    }
  };

  const step_ValidateEventStructure = async () => {
    addLog('system', `STEP 2: Validating Event Structure`, 'header');
    addLog('backend', 'Validating event schema...', 'process');
    
    // Validate required fields
    const hasMetadata = !!selectedEvent.metadata;
    const hasScenario = !!selectedEvent.scenario;
    const hasBranches = !!selectedEvent.branches && selectedEvent.branches.length > 0;
    
    addLog('backend', `Metadata: ${hasMetadata ? '✓ Valid' : '✗ Missing'}`, hasMetadata ? 'success' : 'error');
    addLog('backend', `Scenario: ${hasScenario ? '✓ Valid' : '✗ Missing'}`, hasScenario ? 'success' : 'error');
    addLog('backend', `Branches: ${hasBranches ? '✓ Valid' : '✗ Empty'}`, hasBranches ? 'success' : 'error');
    
    if (hasBranches) {
      selectedEvent.branches.forEach((branch, idx) => {
        addLog('backend', `  Branch ${idx + 1}: ${branch.id} - ${branch.label}`, 'info');
        if (branch.challenge) {
          addLog('backend', `    Challenge: ${branch.challenge.mode} (${branch.challenge.difficulty})`, 'data');
        }
      });
    }
    
    addLog('dre', 'Event structure validated', 'success');
    
    if (!stepMode) {
      await delay(500);
      executeStep(3);
    }
  };

  const step_ApplyGameContext = async () => {
    addLog('system', `STEP 3: Applying Game Context`, 'header');
    addLog('dre', 'Reading current game state...', 'process');
    
    addLog('dre', `System Tier: ${gameContext.tier}`, 'info');
    addLog('dre', `Risk Level: ${gameContext.risk}`, 'info');
    addLog('dre', `Location: ${gameContext.location}`, 'info');
    
    addLog('dre', 'Player Skills:', 'info');
    Object.entries(gameContext.playerSkills).forEach(([skill, value]) => {
      addLog('dre', `  ${skill}: ${value}`, 'data');
    });
    
    addLog('dre', 'Ship Stats:', 'info');
    Object.entries(gameContext.shipStats).forEach(([stat, value]) => {
      addLog('dre', `  ${stat}: ${value}`, 'data');
    });
    
    addLog('backend', 'Context applied to event processor', 'success');
    
    if (!stepMode) {
      await delay(500);
      executeStep(4);
    }
  };

  const step_SelectScenario = async () => {
    addLog('system', `STEP 4: Loading Scenario`, 'header');
    addLog('dre', 'Loading event scenario...', 'process');
    
    // Store the event as state
    setEventState(selectedEvent);
    
    // Show trigger conditions if present
    if (selectedEvent.trigger?.conditions) {
      addLog('dre', 'Trigger Conditions:', 'info');
      const conditions = selectedEvent.trigger.conditions;
      
      if (conditions.tierMultiplier) {
        addLog('dre', 'Tier Multipliers:', 'info');
        Object.entries(conditions.tierMultiplier).forEach(([tier, mult]) => {
          addLog('dre', `  ${tier}: ${mult}x`, 'data');
        });
      }
      
      if (conditions.riskBonus) {
        addLog('dre', 'Risk Bonuses:', 'info');
        Object.entries(conditions.riskBonus).forEach(([risk, bonus]) => {
          addLog('dre', `  ${risk}: ${bonus > 0 ? '+' : ''}${bonus}`, 'data');
        });
      }
    }
    
    addLog('dre', `Scenario loaded: ${selectedEvent.scenario.title}`, 'success');
    addLog('backend', 'Scenario ready for display', 'success');
    
    if (!stepMode) {
      await delay(500);
      executeStep(5);
    }
  };

  const step_DisplayScenario = async () => {
    if (!eventState) return;
    
    addLog('system', `STEP 5: Displaying Scenario to Player`, 'header');
    
    const scenario = eventState.scenario;
    
    // Terminal output (what player sees)
    addLog('terminal', '═══════════════════════════════════════', 'divider');
    addLog('terminal', scenario.title.toUpperCase(), 'title');
    addLog('terminal', '═══════════════════════════════════════', 'divider');
    if (scenario.systemMessage) {
      addLog('terminal', `[SYSTEM] ${scenario.systemMessage}`, 'system');
    }
    addLog('terminal', scenario.description, 'narrative');
    addLog('terminal', '', 'space');
    addLog('terminal', 'Available Actions:', 'prompt');
    
    eventState.branches.forEach((branch, idx) => {
      addLog('terminal', `  ${idx + 1}. ${branch.label}`, 'choice');
      if (branch.challenge) {
        addLog('terminal', `     [${branch.challenge.mode.toUpperCase()}] Difficulty: ${branch.challenge.difficulty}`, 'challenge');
      }
    });
    
    addLog('backend', 'Scenario rendered to player interface', 'success');
    addLog('dre', 'Awaiting player input...', 'waiting');
    
    if (!stepMode) {
      await delay(1000);
      // Auto-select first branch for demo
      executeStep(6);
    }
  };

  const step_WaitForPlayerChoice = async () => {
    addLog('system', `STEP 6: Waiting for Player Choice`, 'header');
    addLog('dre', 'Player decision phase active', 'waiting');
    addLog('backend', 'Input handler registered', 'info');
    
    // In step mode, we wait here. In auto mode, continue
    if (!stepMode) {
      await delay(500);
      // Auto-select first challenging branch for demo
      const challengeBranch = eventState.branches.find(b => b.challenge) || eventState.branches[0];
      await processPlayerChoice(challengeBranch.id);
    }
  };

  const step_ProcessChoice = async () => {
    if (!selectedBranch) return;
    
    addLog('system', `STEP 7: Processing Player Choice`, 'header');
    addLog('terminal', `> ${selectedBranch.label}`, 'player-choice');
    addLog('backend', `Branch selected: ${selectedBranch.id}`, 'info');
    addLog('dre', 'Processing choice...', 'process');
    
    if (selectedBranch.challenge) {
      addLog('dre', 'Challenge detected - proceeding to challenge calculation', 'info');
      if (!stepMode) {
        await delay(500);
        executeStep(8);
      }
    } else {
      addLog('dre', 'No challenge - selecting outcome directly', 'info');
      if (!stepMode) {
        await delay(500);
        executeStep(9);
      }
    }
  };

  const step_CalculateChallenge = async () => {
    if (!selectedBranch?.challenge) {
      executeStep(9);
      return;
    }
    
    addLog('system', `STEP 8: Calculating Challenge`, 'header');
    
    const challenge = selectedBranch.challenge;
    addLog('dre', '=== CHALLENGE CALCULATION ===', 'header');
    addLog('dre', `Mode: ${challenge.mode}`, 'info');
    addLog('dre', `Difficulty: ${challenge.difficulty}`, 'info');
    addLog('dre', `Base Target: ${challenge.baseTarget}`, 'info');
    
    // Roll dice
    const roll = Math.floor(Math.random() * 20) + 1;
    addLog('dre', `Rolling d20... 🎲`, 'process');
    await delay(300);
    addLog('dre', `Base Roll: ${roll}`, roll >= 15 ? 'success' : roll <= 5 ? 'critical-fail' : 'info');
    
    // Calculate skill bonuses
    addLog('dre', 'Calculating skill bonuses...', 'process');
    let skillBonus = 0;
    const skillBreakdown = [];
    
    if (challenge.skills) {
      challenge.skills.forEach(skill => {
        const value = gameContext.playerSkills[skill] || 0;
        skillBonus += value;
        skillBreakdown.push({ skill, value });
        addLog('dre', `  ${skill}: +${value}`, 'data');
      });
    }
    
    addLog('dre', `Total Skill Bonus: +${skillBonus}`, 'success');
    
    // Check for critical
    const isCritical = roll === 1 || roll === 20;
    if (isCritical) {
      addLog('dre', `🌟 CRITICAL ${roll === 20 ? 'SUCCESS' : 'FAILURE'}!`, roll === 20 ? 'critical-success' : 'critical-fail');
    }
    
    const total = roll + skillBonus;
    const success = total >= challenge.baseTarget;
    const criticalSuccess = roll === 20;
    const criticalFailure = roll === 1;
    
    addLog('dre', `Final Calculation: ${roll} + ${skillBonus} = ${total}`, 'info');
    addLog('dre', `Target: ${challenge.baseTarget}`, 'info');
    addLog('dre', `Result: ${success ? '✓ SUCCESS' : '✗ FAILURE'}`, success ? 'success' : 'failure');
    
    // Store challenge results on the branch for outcome determination
    selectedBranch._challengeSuccess = success;
    selectedBranch._criticalSuccess = criticalSuccess;
    selectedBranch._criticalFailure = criticalFailure;
    
    addLog('backend', 'Challenge result stored', 'success');
    
    if (!stepMode) {
      await delay(1000);
      executeStep(9);
    }
  };

  const step_DetermineOutcome = async () => {
    addLog('system', `STEP 9: Determining Outcome`, 'header');
    
    if (!outcome) {
      // For branches with challenge and subScenarios, pick based on challenge result
      if (selectedBranch.challenge && selectedBranch.subScenarios) {
        // Get challenge result from previous step
        const challengeSuccess = selectedBranch._challengeSuccess || false;
        const criticalSuccess = selectedBranch._criticalSuccess || false;
        const criticalFailure = selectedBranch._criticalFailure || false;
        
        let selectedSubScenario;
        if (criticalSuccess) {
          selectedSubScenario = selectedBranch.subScenarios.find(s => s.outcomeType === 'critical_success') || 
                                selectedBranch.subScenarios.find(s => s.outcomeType === 'success') ||
                                selectedBranch.subScenarios[0];
        } else if (criticalFailure) {
          selectedSubScenario = selectedBranch.subScenarios.find(s => s.outcomeType === 'failure') || 
                                selectedBranch.subScenarios[0];
        } else if (challengeSuccess) {
          selectedSubScenario = selectedBranch.subScenarios.find(s => s.outcomeType === 'success') || 
                                selectedBranch.subScenarios[0];
        } else {
          selectedSubScenario = selectedBranch.subScenarios.find(s => s.outcomeType === 'failure') || 
                                selectedBranch.subScenarios[0];
        }
        
        setOutcome(selectedSubScenario);
      } else if (selectedBranch.outcomes && selectedBranch.outcomes.length > 0) {
        // Pick random weighted outcome
        const randomOutcome = selectedBranch.outcomes[Math.floor(Math.random() * selectedBranch.outcomes.length)];
        setOutcome(randomOutcome);
      } else {
        setOutcome({ type: 'default', narrative: 'Action completed.' });
      }
    }
    
    addLog('dre', 'Selecting outcome from pool...', 'process');
    
    if (selectedBranch.challenge && selectedBranch.subScenarios) {
      addLog('dre', 'Challenge-based outcome selection:', 'info');
      addLog('dre', `Selected: ${outcome.id || outcome.outcomeType || 'unknown'}`, 'success');
    } else if (selectedBranch.outcomes) {
      addLog('dre', 'Weighted outcome selection:', 'info');
      selectedBranch.outcomes.forEach(o => {
        addLog('dre', `  ${o.type}: weight ${o.weight}`, 'data');
      });
      addLog('dre', `Selected: ${outcome.type || 'default'}`, 'success');
    }
    
    addLog('backend', 'Outcome locked', 'success');
    
    if (!stepMode) {
      await delay(500);
      executeStep(10);
    }
  };

  const step_ApplyRewards = async () => {
    addLog('system', `STEP 10: Applying Rewards & Consequences`, 'header');
    
    // Display narrative
    if (outcome.narrative) {
      addLog('terminal', '───────────────────────────────────────', 'divider');
      if (typeof outcome.narrative === 'string') {
        addLog('terminal', outcome.narrative, 'narrative');
      } else {
        addLog('terminal', outcome.narrative.title, 'title');
        addLog('terminal', outcome.narrative.description, 'narrative');
        if (outcome.narrative.systemMessage) {
          addLog('terminal', `[SYSTEM] ${outcome.narrative.systemMessage}`, 'system');
        }
      }
      addLog('terminal', '───────────────────────────────────────', 'divider');
    }
    
    // Apply rewards
    if (outcome.rewards) {
      addLog('dre', 'Processing rewards...', 'process');
      const r = outcome.rewards;
      
      if (r.credits !== undefined) {
        addLog('dre', `Credits: ${r.credits >= 0 ? '+' : ''}${r.credits}`, r.credits >= 0 ? 'reward' : 'penalty');
        addLog('terminal', `💰 ${r.credits >= 0 ? '+' : ''}${r.credits} Credits`, r.credits >= 0 ? 'reward' : 'penalty');
        addLog('backend', `Player credits updated: ${r.credits >= 0 ? '+' : ''}${r.credits}`, 'info');
      }
      
      if (r.xp) {
        addLog('dre', `Experience: +${r.xp}`, 'reward');
        addLog('terminal', `⭐ +${r.xp} XP`, 'reward');
        addLog('backend', `Player XP updated: +${r.xp}`, 'info');
      }
      
      if (r.items && r.items.length > 0) {
        addLog('dre', `Items: [${r.items.join(', ')}]`, 'reward');
        addLog('terminal', `📦 Items: ${r.items.join(', ')}`, 'reward');
        r.items.forEach(item => {
          addLog('backend', `Item added to inventory: ${item}`, 'info');
        });
      }
      
      if (r.unlocks && r.unlocks.length > 0) {
        addLog('dre', `Unlocks: [${r.unlocks.join(', ')}]`, 'reward');
        addLog('terminal', `🔓 Unlocked: ${r.unlocks.join(', ')}`, 'reward');
        r.unlocks.forEach(unlock => {
          addLog('backend', `Game state flag set: ${unlock}`, 'info');
        });
      }
      
      if (r.damage) {
        addLog('dre', `Ship damage: ${r.damage}`, 'penalty');
        addLog('terminal', `⚠️ Ship damage: ${r.damage}`, 'penalty');
        addLog('backend', `Ship integrity updated: -${r.damage}`, 'warning');
      }
      
      // Process faction reputation changes
      if (r.factionReputation && r.factionReputation.length > 0) {
        addLog('dre', '=== FACTION REPUTATION CHANGES ===', 'header');
        addLog('terminal', '', 'space');
        addLog('terminal', '🤝 FACTION RELATIONS:', 'prompt');
        
        // Simulate dynamic faction resolution
        const mockContext = {
          target: { factionId: 'pirate_syndicate' }, // Mock: attacked ship
          encounter: { factionId: 'terran_alliance' },
          poi: { ownerFaction: 'independent_miners' }
        };
        
        r.factionReputation.forEach((rep, idx) => {
          let targetFactionId = rep.factionId;
          let appliesCondition = true;
          
          // Handle conditional reputation
          if (rep.condition) {
            addLog('dre', `Evaluating condition #${idx + 1}: ${rep.condition.type}`, 'process');
            
            // Resolve dynamic faction from context
            const sourcePath = rep.condition.source.split('.');
            let contextValue = mockContext;
            sourcePath.forEach(key => {
              contextValue = contextValue?.[key];
            });
            
            addLog('dre', `  Source: ${rep.condition.source} = ${contextValue || 'null'}`, 'data');
            
            // Check condition operator
            if (rep.condition.operator === 'exists') {
              appliesCondition = !!contextValue;
              addLog('dre', `  Operator: exists → ${appliesCondition}`, appliesCondition ? 'success' : 'warning');
            } else if (rep.condition.operator === 'equals') {
              appliesCondition = contextValue === rep.condition.value;
              addLog('dre', `  Operator: equals \"${rep.condition.value}\" → ${appliesCondition}`, appliesCondition ? 'success' : 'warning');
            } else if (rep.condition.operator === 'not_equals') {
              appliesCondition = contextValue !== rep.condition.value;
              addLog('dre', `  Operator: not_equals \"${rep.condition.value}\" → ${appliesCondition}`, appliesCondition ? 'success' : 'warning');
            }
            
            if (appliesCondition && contextValue) {
              targetFactionId = contextValue;
              addLog('dre', `  → Dynamic faction resolved: ${targetFactionId}`, 'success');
            } else {
              addLog('dre', `  → Condition not met, skipping`, 'warning');
            }
          }
          
          if (appliesCondition && targetFactionId) {
            const factionName = targetFactionId; // In real system, look up faction name
            const changeStr = rep.change >= 0 ? `+${rep.change}` : `${rep.change}`;
            const color = rep.change >= 0 ? 'reward' : 'penalty';
            
            addLog('dre', `Faction: ${factionName} ${changeStr}`, color);
            addLog('terminal', `  ${factionName}: ${changeStr}`, color);
            addLog('backend', `Faction reputation updated: ${factionName} ${changeStr}`, 'info');
          }
        });
      }
    }
    
    addLog('backend', 'All rewards applied to game state', 'success');
    
    if (!stepMode) {
      await delay(1000);
      executeStep(11);
    }
  };

  const step_TrackTelemetry = async () => {
    addLog('system', `STEP 11: Tracking Telemetry`, 'header');
    addLog('backend', 'Recording event analytics...', 'process');
    
    const telemetry = {
      eventId: selectedEvent.id,
      branchId: selectedBranch.id,
      outcomeId: outcome.id || outcome.outcomeType || outcome.type,
      timestamp: new Date().toISOString(),
      context: {
        tier: gameContext.tier,
        risk: gameContext.risk,
        location: gameContext.location
      }
    };
    
    addLog('backend', JSON.stringify(telemetry, null, 2), 'data');
    addLog('backend', 'Telemetry saved to database', 'success');
    
    if (!stepMode) {
      await delay(500);
      executeStep(12);
    }
  };

  const step_Complete = async () => {
    addLog('system', `STEP 12: Simulation Complete`, 'header');
    addLog('terminal', '', 'space');
    addLog('terminal', '═══════════════════════════════════════', 'divider');
    addLog('terminal', 'EVENT COMPLETE', 'title');
    addLog('terminal', '═══════════════════════════════════════', 'divider');
    addLog('backend', 'Event execution finished', 'success');
    addLog('dre', 'Engine returned to idle state', 'success');
    setIsRunning(false);
  };

  const processPlayerChoice = async (branchId) => {
    const branch = eventState.branches.find(b => b.id === branchId);
    setSelectedBranch(branch);
    
    if (!stepMode) {
      executeStep(7);
    }
  };

  const continueStep = () => {
    if (currentStep === 6 && !selectedBranch) {
      // Need player to select a branch
      return;
    }
    executeStep(currentStep + 1);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const getLogColor = (type) => {
    switch (type) {
      case 'header': return '#0ff';
      case 'system': return '#0ff';
      case 'title': return '#fff';
      case 'narrative': return '#ddd';
      case 'prompt': return '#fa0';
      case 'choice': return '#0f0';
      case 'challenge': return '#f0f';
      case 'player-choice': return '#ff0';
      case 'process': return '#09f';
      case 'success': return '#0f0';
      case 'critical-success': return '#0ff';
      case 'failure': return '#f66';
      case 'critical-fail': return '#f00';
      case 'reward': return '#0f0';
      case 'faction-rep': return '#fa0';
      case 'penalty': return '#f90';
      case 'warning': return '#fa0';
      case 'error': return '#f00';
      case 'data': return '#999';
      case 'divider': return '#444';
      case 'space': return 'transparent';
      case 'waiting': return '#f90';
      default: return '#aaa';
    }
  };

  const renderLogEntry = (entry) => {
    if (entry.type === 'space') {
      return <div key={entry.timestamp} style={{ height: '0.3rem' }} />;
    }
    
    if (entry.type === 'divider') {
      return (
        <div key={entry.timestamp} style={{ 
          color: getLogColor(entry.type),
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          marginBottom: '0.2rem'
        }}>
          {entry.message}
        </div>
      );
    }

    return (
      <div 
        key={entry.timestamp}
        style={{
          color: getLogColor(entry.type),
          marginBottom: '0.3rem',
          fontFamily: entry.type === 'data' ? 'monospace' : 'inherit',
          fontSize: entry.type === 'title' ? '0.8rem' : entry.type === 'header' ? '0.75rem' : '0.7rem',
          fontWeight: entry.type === 'header' || entry.type === 'title' ? 'bold' : 'normal',
          paddingLeft: entry.type === 'data' ? '0.5rem' : '0',
          lineHeight: '1.3'
        }}
      >
        {entry.type !== 'title' && entry.type !== 'header' && entry.type !== 'divider' && (
          <span style={{ color: '#666', fontSize: '0.6rem', marginRight: '0.3rem' }}>
            [{entry.time}]
          </span>
        )}
        {entry.message}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingIcon size={48} />
        <p style={{ color: '#aaa', marginTop: '1rem' }}>Loading events...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Game Context Configuration - Collapsible */}
      <div className="glass-card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
        <div 
          onClick={() => setGameContext({ ...gameContext, _expanded: !gameContext._expanded })}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: gameContext._expanded ? '0.75rem' : '0'
          }}
        >
          <h3 style={{ color: '#fff', margin: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚙️</span> Game Context
          </h3>
          <span style={{ color: '#aaa', fontSize: '1rem' }}>
            {gameContext._expanded ? '−' : '+'}
          </span>
        </div>

        {gameContext._expanded && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            {/* Tier */}
            <div>
              <label style={{ color: '#aaa', display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem' }}>
                Tier
              </label>
              <select
                value={gameContext.tier}
                onChange={(e) => setGameContext({ ...gameContext, tier: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: 'rgba(0, 20, 40, 0.5)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.75rem'
                }}
              >
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="T3">T3</option>
                <option value="T4">T4</option>
                <option value="T5">T5</option>
              </select>
            </div>

            {/* Risk Level */}
            <div>
              <label style={{ color: '#aaa', display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem' }}>
                Risk
              </label>
              <select
                value={gameContext.risk}
                onChange={(e) => setGameContext({ ...gameContext, risk: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: 'rgba(0, 20, 40, 0.5)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.75rem'
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label style={{ color: '#aaa', display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem' }}>
                Location
              </label>
              <input
                type="text"
                value={gameContext.location}
                onChange={(e) => setGameContext({ ...gameContext, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: 'rgba(0, 20, 40, 0.5)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.75rem'
                }}
              />
            </div>

            {/* Player Skills - Horizontal Sliders */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem' }}>
                Skills
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                {Object.entries(gameContext.playerSkills).map(([skill, value]) => (
                  <div key={skill}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span style={{ color: '#fff', fontSize: '0.65rem', textTransform: 'capitalize' }}>{skill}</span>
                      <span style={{ color: 'var(--neon-cyan)', fontSize: '0.65rem', fontWeight: 'bold' }}>{value}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={value}
                      onChange={(e) => setGameContext({
                        ...gameContext,
                        playerSkills: { ...gameContext.playerSkills, [skill]: parseInt(e.target.value) }
                      })}
                      style={{ width: '100%', height: '4px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="glass-card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Event Selector */}
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem' }}>
              Event
            </label>
            <select
              value={selectedEvent ? JSON.stringify(selectedEvent) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedEvent(JSON.parse(e.target.value));
                  resetSimulation();
                }
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.75rem'
              }}
            >
              <option value="">-- Select --</option>
              {events.map((event, idx) => {
                const meta = event.metadata;
                const id = event.id;
                const eventType = event.trigger?.type || 'unknown';
                return (
                  <option key={idx} value={JSON.stringify(event)}>
                    [{eventType}] {meta?.title || id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Step Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              id="stepMode"
              checked={stepMode}
              onChange={(e) => setStepMode(e.target.checked)}
              style={{ width: '14px', height: '14px' }}
            />
            <label htmlFor="stepMode" style={{ color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>
              Step Mode
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={runSimulation}
              disabled={!selectedEvent || isRunning}
              className="glass-button"
              style={{
                padding: '0.5rem 1rem',
                background: selectedEvent && !isRunning ? 'rgba(0, 255, 255, 0.1)' : 'rgba(100, 100, 100, 0.1)',
                border: `2px solid ${selectedEvent && !isRunning ? 'var(--neon-cyan)' : '#666'}`,
                borderRadius: '4px',
                color: selectedEvent && !isRunning ? 'var(--neon-cyan)' : '#666',
                cursor: selectedEvent && !isRunning ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem'
              }}
            >
              <PlayIcon size={14} />
              {stepMode ? 'Start' : 'Run'}
            </button>

            {stepMode && isRunning && (
              <button
                onClick={continueStep}
                disabled={currentStep === 6 && !selectedBranch}
                className="glass-button"
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(0, 255, 136, 0.1)',
                  border: '2px solid #0f8',
                  borderRadius: '4px',
                  color: '#0f8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem'
                }}
              >
                Continue →
              </button>
            )}

            <button
              onClick={resetSimulation}
              className="glass-button"
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 100, 100, 0.1)',
                border: '2px solid #f66',
                borderRadius: '4px',
                color: '#f66',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem'
              }}
            >
              <RefreshIcon size={14} />
              Reset
            </button>
          </div>
        </div>

        {/* Current Step Indicator - Visual Flow */}
        {isRunning && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.7rem', marginBottom: '0.4rem', textAlign: 'center' }}>
              Step {currentStep}/12
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '0.2rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {[
                'Init', 'Load', 'Valid', 'Scene', 'Show', 'Branch',
                'Wait', 'Check', 'Result', 'Apply', 'Reward', 'Done'
              ].map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;
                
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '52px',
                      height: '36px',
                      background: isActive 
                        ? 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue))' 
                        : isCompleted
                        ? 'rgba(0, 255, 255, 0.2)'
                        : 'rgba(0, 20, 40, 0.5)',
                      clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%, 12% 50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: isActive ? '2px solid var(--neon-cyan)' : '1px solid rgba(0, 255, 255, 0.3)',
                      boxShadow: isActive ? '0 0 15px rgba(0, 255, 255, 0.5)' : 'none',
                      transition: 'all 0.3s ease',
                      fontSize: '0.55rem',
                      color: isActive ? '#000' : isCompleted ? 'var(--neon-cyan)' : '#666',
                      fontWeight: isActive ? 'bold' : 'normal',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}
                  >
                    <div style={{ fontSize: '0.5rem', opacity: 0.7 }}>{stepNum}</div>
                    <div style={{ fontSize: '0.55rem' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Three-Panel View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
        {/* Terminal Panel */}
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🖥️</span> TERMINAL
          </h3>
          <div 
            ref={terminalRef}
            style={{
              height: '350px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.7rem'
            }}
          >
            {terminalLog.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem', fontSize: '0.7rem' }}>
                Awaiting event trigger...
              </div>
            )}
            {terminalLog.map(renderLogEntry)}
            
            {/* Player Choice Interface - Inline in Terminal */}
            {isRunning && currentStep === 6 && eventState && !selectedBranch && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
                <div style={{ color: 'var(--neon-cyan)', fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {'>'} SELECT ACTION:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {eventState.branches.map(branch => (
                    <button
                      key={branch.id}
                      onClick={() => {
                        processPlayerChoice(branch.id);
                        if (stepMode) {
                          setTimeout(() => continueStep(), 100);
                        }
                      }}
                      className="glass-button"
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(0, 20, 40, 0.5)',
                        border: '1px solid var(--neon-cyan)',
                        borderRadius: '4px',
                        color: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.7rem'
                      }}
                    >
                      <div style={{ marginBottom: '0.2rem' }}>{branch.label}</div>
                      {branch.challenge && (
                        <div style={{ fontSize: '0.6rem', color: '#f0f' }}>
                          [{branch.challenge.mode.toUpperCase()}] {branch.challenge.difficulty}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DRE Panel */}
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <h3 style={{ color: '#f0f', marginBottom: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚙️</span> DRE
          </h3>
          <div 
            ref={dreRef}
            style={{
              height: '350px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 0, 255, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.7rem'
            }}
          >
            {dreLog.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem', fontSize: '0.7rem' }}>
                DRE idle...
              </div>
            )}
            {dreLog.map(renderLogEntry)}
          </div>
        </div>

        {/* Backend Panel */}
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <h3 style={{ color: '#0f8', marginBottom: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>📡</span> BACKEND
          </h3>
          <div 
            ref={backendRef}
            style={{
              height: '350px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.7rem'
            }}
          >
            {backendLog.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem', fontSize: '0.7rem' }}>
                Backend ready...
              </div>
            )}
            {backendLog.map(renderLogEntry)}
          </div>
        </div>
      </div>
    </div>
  );
}
