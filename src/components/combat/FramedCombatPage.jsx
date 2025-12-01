import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/AdminGlass.css';
import { ShipManager } from '../../lib/ShipManager.js';
import { COMPONENTS } from '../../lib/shipComponents.js';
import { CombatStateManager } from '../../lib/combat/CombatStateManager.js';
import { CombatFlowController } from '../../lib/combat/CombatFlowController.js';
import { getAvailableActions, ACTION_TYPES } from '../../lib/combat/combatActions.js';
import { AICombatEngine } from '../../lib/combat/ai/AICombat.js';
import BattlespaceStrip from './BattlespaceStrip.jsx';
import * as api from '../../lib/api/client.js';

// Phases display order per framing
const PHASE_TRACK = ['MOVE','ACTION','OPPONENT REACTION','MOVE','END TURN'];

export default function FramedCombatPage({ embedded = false, onClose }) {
  const [combat, setCombat] = useState(null);
  const [plan, setPlan] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [playerInfoOpen, setPlayerInfoOpen] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const flowRef = useRef(null);
  const lastLogTsRef = useRef(0);
  const [turnDetails, setTurnDetails] = useState([]);
  
  // Step-by-step AI execution controls
  const [stepByStepMode, setStepByStepMode] = useState(true); // Default ON for debugging
  const [aiPhaseInfo, setAiPhaseInfo] = useState(null);

  // Setup phase state (load ships from Admin "Ships" manager)
  const [setupMode, setSetupMode] = useState(true);
  const [shipsList, setShipsList] = useState([]);
  const [selectedShipId, setSelectedShipId] = useState('');
  const [playerTeam, setPlayerTeam] = useState([]); // array of backend ship defs with custom comps
  const [aiTeam, setAiTeam] = useState([]);
  const [editShip, setEditShip] = useState(null); // ship being edited (backend def clone)

  // Fetch ships from backend for selection
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await api.ships.getAll();
        if (!mounted) return;
        setShipsList(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length) {
          setSelectedShipId(list[0].id);
        }
      } catch (e) {
        setShipsList([]);
      }
    };
    if (setupMode) load();
    return () => { mounted = false; };
  }, [setupMode]);

  const CLASS_MAP = {
    fighter: 'INTERCEPTOR',
    frigate: 'SURVEY_FRIGATE',
    cruiser: 'HEAVY_CRUISER'
  };

  const COMPONENT_MAP = {
    // engines
    'engine_fighter_t1': 'ENGINE_PLASMA',
    // weapons
    'pulse_laser_mk1': 'WEAPON_PULSE_LASER',
    'plasma_cannon_mk1': 'WEAPON_PLASMA_CANNON',
    'railgun_mk1': 'WEAPON_RAILGUN',
    'missile_launcher_mk1': 'WEAPON_MISSILE_LAUNCHER',
    // shields
    'shield_generator_mk1': 'SHIELD_MK1',
    'shield_generator_mk2': 'SHIELD_MK2',
    // sensors
    'sensors_short_mk1': 'SENSORS_SHORT',
    'sensors_long_mk1': 'SENSORS_LONG'
  };

  function mapBackendShipToManager(def, label) {
    const cls = CLASS_MAP[def.class] || 'INTERCEPTOR';
    const comps = [];
    // Always ensure core systems exist
    comps.push('POWER_FUSION');
    comps.push('NAV_ADVANCED');
    // Engine
    if (def.engine && COMPONENT_MAP[def.engine]) comps.push(COMPONENT_MAP[def.engine]); else comps.push('ENGINE_ION');
    // Subsystems
    if (def.subsystemSlots) {
      Object.values(def.subsystemSlots).forEach(id => {
        if (!id) return;
        const mapped = COMPONENT_MAP[id];
        if (mapped) comps.push(mapped);
      });
    }
    // Weapons
    if (def.weaponSlots) {
      Object.values(def.weaponSlots).forEach(id => {
        if (!id) return;
        const mapped = COMPONENT_MAP[id];
        if (mapped) comps.push(mapped);
      });
    }
    // Ensure at least sensors
    if (!comps.some(c => c.startsWith('SENSORS_'))) comps.push('SENSORS_SHORT');

    const sm = new ShipManager(cls, comps);
    sm.id = label;
    // Initialize dynamic combat hp/shields
    const stats = sm.calculateCombatStats();
    sm.currentHull = stats.maxHull;
    sm.currentShields = stats.maxShields;
    return sm;
  }

  const startFromSetup = () => {
    const toShip = (def, label) => mapBackendShipToManager(def, label);
    const playerShips = playerTeam.map((def, idx) => ({ ship: toShip(def, `P-${idx+1}`), id: `P-${idx+1}`, faction: 'player', isPlayer: idx===0, isAI: false, personality: 'TACTICAL', veteranRank: 'TRAINED' }));
    const aiShips = aiTeam.map((def, idx) => ({ ship: toShip(def, `AI-${idx+1}`), id: `AI-${idx+1}`, faction: 'pirates', isPlayer: false, isAI: true, personality: 'AGGRESSIVE', veteranRank: idx===0 ? 'VETERAN' : 'TRAINED' }));

    const mgr = new CombatStateManager();
    mgr.startCombat([...playerShips, ...aiShips], 300);
    flowRef.current = new CombatFlowController(mgr);
    flowRef.current.setStepByStepMode(stepByStepMode); // Set initial mode
    setCombat(mgr);
    setSetupMode(false);
  };

  const addToTeam = (teamSetter) => {
    const def = shipsList.find(s => s.id === selectedShipId);
    if (!def) return;
    // clone shallow; customization stored inline
    teamSetter(prev => [...prev, JSON.parse(JSON.stringify(def))]);
  };

  const removeFromTeam = (teamSetter, index) => {
    teamSetter(prev => prev.filter((_, i) => i !== index));
  };

  const openEditor = (def, teamSetter, index) => {
    setEditShip({ def: JSON.parse(JSON.stringify(def)), teamSetter, index });
  };

  const saveEditor = () => {
    const { def, teamSetter, index } = editShip || {};
    if (!def || !teamSetter) { setEditShip(null); return; }
    teamSetter(prev => prev.map((d,i) => i===index ? def : d));
    setEditShip(null);
  };

  const currentActor = useMemo(() => combat?.getCurrentShip?.(), [combat, refreshTick]);
  const player = useMemo(() => combat?.combatants?.find(c => c.isPlayer), [combat]);
  const enemies = useMemo(() => player && combat ? combat.getEnemies(player.id) : [], [combat, player, refreshTick]);
  const primaryEnemy = enemies[0];

  // Determine phase label mapping
  const phaseLabel = () => {
    if (!combat) return '—';
    if (combat.reactionWindowOpen) return 'OPPONENT REACTION';
    switch (combat.phase) {
      case 'MOVEMENT': return 'MOVE';
      case 'ACTION': return 'ACTION';
      case 'BONUS_ACTION': return 'MOVE'; // use bonus phase as final move window
      case 'END_TURN': return 'END TURN';
      default: return combat.phase;
    }
  };

  const activeIndicator = () => {
    if (!combat || !currentActor) return 'PASSIVE';
    if (combat.reactionWindowOpen) return 'AI ACTIVE';
    return currentActor.isPlayer ? 'PLAYER ACTIVE' : 'AI ACTIVE';
  };

  const captureTurnDetails = () => {
    if (!combat) return;
    const newEntries = (combat.combatLog || []).filter(e => e.timestamp > (lastLogTsRef.current || 0));
    if (newEntries.length) {
      lastLogTsRef.current = Math.max(...newEntries.map(e => e.timestamp));
      const lines = newEntries.map(e => `[R${e.round}:${e.phase}] ${e.message}`);
      setTurnDetails(lines);
    }
  };

  // Manual action execution helper
  const execManual = async (action) => {
    if (!combat || !flowRef.current || !currentActor || !currentActor.isPlayer) return;
    await flowRef.current.executeManualAction(currentActor.id, action);
    captureTurnDetails();

    // Phase auto-advance rules:
    // - After MOVEMENT action, go to ACTION
    // - After ACTION (main) action, go to BONUS_ACTION (final move window)
    // - After BONUS_ACTION movement, end turn
    const moveTypes = new Set(['MOVE_CLOSER','MOVE_FARTHER']);
    const mainTypes = new Set(['FIRE_WEAPON','SCAN_TARGET','EMERGENCY_REPAIR','EVASIVE_MANEUVERS']);
    if (moveTypes.has(action.type) && combat.phase === 'MOVEMENT') {
      combat.nextPhase();
    } else if (mainTypes.has(action.type) && combat.phase === 'ACTION') {
      // Reaction window is handled inside executeManualAction; proceed to final move
      combat.nextPhase();
    } else if (moveTypes.has(action.type) && combat.phase === 'BONUS_ACTION') {
      // Final movement used - end turn
      combat.advanceTurn();
    }

    setRefreshTick(t => t + 1);
  };

  // End turn manual
  const endTurn = () => {
    if (!combat) return;
    combat.advanceTurn();
    setRefreshTick(t => t + 1);
  };

  // Auto AI when not player and not reaction window
  useEffect(() => {
    const runAI = async () => {
      if (!combat || !currentActor) return;
      if (currentActor.isPlayer) return;
      if (combat.phase === 'REACTION_WINDOW') return;
      
      // Check if new executor is paused (waiting for reaction)
      if (flowRef.current.currentExecutor?.pausedForReaction) {
        console.log('[FramedCombatPage] AI executor paused for reaction - not re-executing');
        return;
      }
      
      // In step-by-step mode, don't auto-execute
      if (stepByStepMode) {
        // Initialize AI turn phases ONLY if not already initialized
        if (!flowRef.current.hasMorePhases() && !aiPhaseInfo) {
          console.log('[FramedCombatPage] Initializing AI turn in step-by-step mode');
          const result = await flowRef.current.executeTurn(currentActor.id);
          console.log('[FramedCombatPage] executeTurn result:', result);
          console.log('[FramedCombatPage] result.summary exists?', !!result?.summary);
          if (result.stepByStep) {
            const phaseInfo = flowRef.current.getCurrentPhaseInfo();
            setAiPhaseInfo(phaseInfo);
            setPlan(result);
            console.log('[FramedCombatPage] Set plan with summary:', result.summary);
          } else if (result.paused) {
            // New executor paused for reaction
            console.log('[FramedCombatPage] New executor paused for reaction');
            setPlan(result);
          }
          setRefreshTick(t => t + 1);
        }
        return;
      }
      
      // Auto mode: execute entire turn (only once)
      if (!plan || plan.complete) {
        console.log('[FramedCombatPage] Executing AI turn in auto mode');
        const p = await flowRef.current.executeTurn(currentActor.id);
        setPlan(p || null);
        if (!p?.paused) {
          combat.advanceTurn();
        }
        setRefreshTick(t => t + 1);
      }
    };
    runAI();
  }, [combat, currentActor, stepByStepMode]); // Removed refreshTick dependency to prevent re-execution

  // Execute next AI phase in step-by-step mode
  const executeNextAIPhase = async () => {
    if (!flowRef.current.hasMorePhases()) {
      console.log('[FramedCombatPage] No more phases - turn should be complete');
      return;
    }
    
    console.log('[UI] User clicked Execute Phase button');
    combat.log('>>> USER MANUALLY PROGRESSED PHASE <<<');
    
    const result = await flowRef.current.executeNextPhase();
    captureTurnDetails();
    
    if (result.awaitingReaction) {
      // Paused for player reaction - don't advance, just refresh UI
      console.log('[FramedCombatPage] AI paused for player reaction');
      setPlan({ paused: true, phase: 'REACTION_WINDOW' });
      setRefreshTick(t => t + 1);
      return;
    }
    
    if (result.done) {
      // All phases complete, advance turn and clear state
      console.log('[FramedCombatPage] AI turn complete - advancing turn');
      combat.advanceTurn();
      setAiPhaseInfo(null);
      setPlan(null); // Clear plan to allow new turn to initialize
    } else {
      // More phases remaining
      const nextPhase = flowRef.current.getCurrentPhaseInfo();
      setAiPhaseInfo(nextPhase);
    }
    
    setRefreshTick(t => t + 1);
  };

  // Resume AI turn after player handles reaction
  const resumeAIAfterReaction = async () => {
    console.log('[FramedCombatPage] Resuming AI turn after reaction');
    
    // Check if using new executor
    if (flowRef.current.currentExecutor && !stepByStepMode) {
      await flowRef.current.resumeAfterReaction();
      
      if (flowRef.current.currentExecutor.hasMorePhases && flowRef.current.currentExecutor.hasMorePhases()) {
        // More phases remaining - in auto mode, they'll execute on next render
        console.log('[FramedCombatPage] AI has more phases - will continue automatically');
      } else {
        // Turn complete
        combat.advanceTurn();
        setAiPhaseInfo(null);
        setPlan(null);
      }
    } else {
      // Legacy system or step-by-step mode
      await flowRef.current.resumeAfterReaction();
      
      if (flowRef.current.hasMorePhases()) {
        const nextPhase = flowRef.current.getCurrentPhaseInfo();
        setAiPhaseInfo(nextPhase);
      } else {
        // Turn complete
        combat.advanceTurn();
        setAiPhaseInfo(null);
        setPlan(null);
      }
    }
    
    setRefreshTick(t => t + 1);
  };

  // Skip to end of AI turn
  const skipAITurn = async () => {
    while (flowRef.current.hasMorePhases()) {
      const result = await flowRef.current.executeNextPhase();
      if (result.awaitingReaction) break; // Don't skip through reactions
    }
    captureTurnDetails();
    combat.advanceTurn();
    setAiPhaseInfo(null);
    setRefreshTick(t => t + 1);
  };

  // Available actions
  const remaining = combat?.getActionsRemaining(currentActor?.id || '') || { actions:0, bonusActions:0, movement:0, reactions:0 };
  const available = currentActor && combat ? getAvailableActions(currentActor, combat) : [];
  const can = (type) => currentActor && combat?.canPerformAction(currentActor.id, type);
  const inPhase = (p) => {
    if (!combat) return false;
    if (p === 'REACTION') return !!combat.reactionWindowOpen;
    return combat.phase === p;
  };

  const stats = currentActor?.ship.calculateCombatStats();
  const weapons = stats?.weapons || [];
  const playerAvailableReactions = player && combat && combat.reactionWindowOpen ? getAvailableActions(player, combat).filter(a => ACTION_TYPES[a]?.cost?.reactions) : [];

  const costLabel = (key) => {
    const def = ACTION_TYPES[key];
    if (!def) return '';
    const c = def.cost || {};
    if (c.actions) return `( ${c.actions} AP )`;
    if (c.bonusActions) return `( Bonus )`;
    if (c.reactions) return `( Reaction )`;
    return '';
  };

  // Combat log panel
  const LogPanel = () => (
    <div className='digital-grid-bg' style={{ position:'fixed', top:0, right:0, width:'50vw', height:'100vh', borderLeft:'1px solid var(--glass-border-bright)', zIndex:250, display:'flex', flexDirection:'column', background:'rgba(0, 10, 20, 0.85)' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(1400px 700px at 50% 40%, rgba(0,255,180,0.15), rgba(0,255,255,0.08))', pointerEvents:'none' }} />
      <div style={{ padding:12, display:'flex', alignItems:'center', gap:12 }}>
        <button className='btn-neon btn-neon-danger' onClick={()=>setShowLog(false)}>Close Log</button>
        <div style={{ fontWeight:600, letterSpacing:2, color:'var(--neon-cyan)' }}>COMBAT LOG</div>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:12 }}>
        {combat?.combatLog.map((entry,i)=>(
          <div key={i} style={{ fontSize:12, marginBottom:4 }}>
            <span style={{ color:'var(--neon-cyan)' }}>[R{entry.round}:{entry.phase}]</span> {entry.message}
          </div>
        ))}
      </div>
    </div>
  );

  // Header phase mapping: choose single active index for pills
  const phaseTrackActiveIndex = useMemo(() => {
    if (!combat) return -1;
    switch (combat.phase) {
      case 'MOVEMENT': return 0; // first MOVE
      case 'ACTION': return 1;
      case 'REACTION_WINDOW': return 2; // opponent reaction
      case 'BONUS_ACTION': return 3; // second MOVE slot reused
      default: return -1;
    }
  }, [combat?.phase]);

  // Layered panel helper: Top = content, Mid = circular transparent gradient; no grid (page already supplies grid)
  const LayeredPanel = ({ children, style }) => (
    <div style={{ position:'relative', border:'1px solid var(--glass-border)', borderRadius:10, overflow:'hidden', background:'rgba(0,0,0,0.25)', ...style }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(1200px 600px at 50% 40%, rgba(0,255,180,0.10), rgba(0,255,255,0.03))', pointerEvents:'none' }} />
      <div style={{ position:'relative', height:'100%' }}>
        {children}
      </div>
    </div>
  );
  const compactPad = { padding: 8 };
  const compactBtn = { padding: '4px 8px', fontSize: 11 };
  const compactText = { fontSize: 12 };

  return (
    <div className={`${embedded ? '' : 'admin-container'} digital-grid-bg`} style={{ padding: 8, overflow: 'auto', minHeight: embedded ? 'auto' : '100vh' }}>
      {/* Setup Phase Modal */}
      {setupMode && (
        <div className='combat-modal-overlay' style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:300 }}>
          <div className='combat-modal-container digital-grid-bg' style={{ width:'min(900px, 96vw)', margin:'5vh auto', border:'1px solid var(--glass-border-bright)', borderRadius:10, overflow:'auto', maxHeight:'90vh', position:'relative' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(1400px 700px at 50% 30%, rgba(0,255,180,0.10), rgba(0,255,255,0.04))', pointerEvents:'none' }} />
            <div style={{ position:'relative' }}>
            <div className='glass-card' style={{ padding:8, position:'sticky', top:0 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:8, alignItems:'center' }}>
                <select value={selectedShipId} onChange={e=>setSelectedShipId(e.target.value)} style={{ width:'100%', background:'rgba(0,0,0,0.5)', color:'var(--neon-cyan)', border:'1px solid var(--glass-border)', padding:'4px 6px', fontSize:11 }}>
                  {shipsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.id}</option>
                  ))}
                </select>
                <button className='btn-neon' style={{ padding:'4px 10px', fontSize:11 }} onClick={()=>addToTeam(setPlayerTeam)}>Add to Player</button>
                <button className='btn-neon' style={{ padding:'4px 10px', fontSize:11 }} onClick={()=>addToTeam(setAiTeam)}>Add to AI</button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:8 }}>
              <div className='glass-card digital-grid-bg' style={{ position:'relative', padding:8, border:'1px solid var(--glass-border)', borderRadius:10 }}>
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(1000px 500px at 50% 40%, rgba(0,255,180,0.10), rgba(0,255,255,0.04))', pointerEvents:'none' }} />
                <div style={{ position:'relative' }}>
                <div style={{ color:'var(--neon-cyan)', fontWeight:600, fontSize:12, marginBottom:6 }}>Player Team</div>
                {playerTeam.length === 0 && <div style={{ fontSize:11, opacity:0.7, color:'var(--neon-cyan)' }}>No ships added</div>}
                {playerTeam.map((s, idx) => (
                  <div key={`p-${idx}`} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:6, alignItems:'center', border:'1px solid var(--glass-border)', borderRadius:8, padding:6, marginBottom:6 }}>
                    <div style={{ fontSize:11, color:'var(--neon-cyan)' }}>{s.name || s.id}</div>
                    <button className='btn-neon' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>openEditor(s, setPlayerTeam, idx)}>Edit</button>
                    <button className='btn-neon btn-neon-danger' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>removeFromTeam(setPlayerTeam, idx)}>Delete</button>
                  </div>
                ))}
                </div>
              </div>
              <div className='glass-card digital-grid-bg' style={{ position:'relative', padding:8, border:'1px solid var(--glass-border)', borderRadius:10 }}>
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(1000px 500px at 50% 40%, rgba(0,255,180,0.10), rgba(0,255,255,0.04))', pointerEvents:'none' }} />
                <div style={{ position:'relative' }}>
                <div style={{ color:'var(--neon-cyan)', fontWeight:600, fontSize:12, marginBottom:6 }}>AI Team</div>
                {aiTeam.length === 0 && <div style={{ fontSize:11, opacity:0.7, color:'var(--neon-cyan)' }}>No ships added</div>}
                {aiTeam.map((s, idx) => (
                  <div key={`ai-${idx}`} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:6, alignItems:'center', border:'1px solid var(--glass-border)', borderRadius:8, padding:6, marginBottom:6 }}>
                    <div style={{ fontSize:11, color:'var(--neon-cyan)' }}>{s.name || s.id}</div>
                    <button className='btn-neon' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>openEditor(s, setAiTeam, idx)}>Edit</button>
                    <button className='btn-neon btn-neon-danger' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>removeFromTeam(setAiTeam, idx)}>Delete</button>
                  </div>
                ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:8 }}>
              <div style={{ fontSize:10, color:'var(--neon-cyan)', opacity:0.7 }}>Add multiple ships per side to test fleet combat.</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className='btn-neon btn-neon-danger' style={{ padding:'4px 10px', fontSize:11 }} onClick={()=>{ setSetupMode(false); }}>Cancel</button>
                <button className='btn-neon' style={{ padding:'4px 10px', fontSize:11 }} disabled={playerTeam.length===0 || aiTeam.length===0} onClick={startFromSetup}>Start</button>
              </div>
            </div>

            {/* Ship Editor Popout */}
            {editShip && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:350 }}>
                <div className='digital-grid-bg' style={{ position:'relative', width:'min(700px, 92vw)', margin:'8vh auto', padding:8, border:'1px solid var(--glass-border-bright)', borderRadius:10 }}>
                  <div style={{ position:'absolute', inset:0, background:'radial-gradient(1000px 500px at 50% 30%, rgba(0,255,180,0.12), rgba(0,255,255,0.05))', pointerEvents:'none' }} />
                  <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ color:'var(--neon-cyan)', fontWeight:600, fontSize:12 }}>Edit Ship: {editShip.def.name || editShip.def.id}</div>
                    <button className='btn-neon btn-neon-danger' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>setEditShip(null)}>Close</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <EditorSection title='Weapons'>
                      {Object.values(editShip.def.weaponSlots || {}).map((val, i) => (
                        <SlotEditor key={`w-${i}`} value={val} onChange={(newVal)=>{
                          const slots = { ...(editShip.def.weaponSlots||{}) }; slots[`slot_${i+1}`] = newVal; setEditShip({ ...editShip, def: { ...editShip.def, weaponSlots: slots } });
                        }} options={['pulse_laser_mk1','plasma_cannon_mk1','railgun_mk1','missile_launcher_mk1', null]} />
                      ))}
                    </EditorSection>
                    <EditorSection title='Subsystems'>
                      {Object.values(editShip.def.subsystemSlots || {}).map((val, i) => (
                        <SlotEditor key={`s-${i}`} value={val} onChange={(newVal)=>{
                          const slots = { ...(editShip.def.subsystemSlots||{}) }; slots[`slot_${i+1}`] = newVal; setEditShip({ ...editShip, def: { ...editShip.def, subsystemSlots: slots } });
                        }} options={['shield_generator_mk1','shield_generator_mk2','sensors_short_mk1','sensors_long_mk1', null]} />
                      ))}
                    </EditorSection>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
                    <button className='btn-neon' style={{ padding:'4px 10px', fontSize:11 }} onClick={saveEditor}>Save</button>
                  </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
      {showLog && <LogPanel />}
      {/* HEADER */}
      <LayeredPanel style={{ background:'rgba(0,0,0,0.55)', position:'relative', padding:'12px 10px', minHeight:48 }}>
        {/* Left: Close + Log */}
        <div style={{ display:'flex', alignItems:'center', gap:8, position:'absolute', left:10 }}>
          {embedded ? (
            <button className='btn-neon btn-neon-danger' style={compactBtn} onClick={onClose}>Close</button>
          ) : (
            <button className='btn-neon btn-neon-danger' style={compactBtn} onClick={()=>window.history.back()}>×</button>
          )}
          <button className='btn-neon' style={compactBtn} onClick={()=>setShowLog(s=>!s)}>{showLog ? 'Hide Log' : 'Combat Log ▾'}</button>
          
          {/* Step-by-step toggle */}
          <button 
            className='btn-neon' 
            style={{ ...compactBtn, background: stepByStepMode ? 'rgba(0,255,180,0.2)' : 'transparent' }} 
            onClick={()=>{ 
              const newMode = !stepByStepMode;
              setStepByStepMode(newMode);
              if (flowRef.current) flowRef.current.setStepByStepMode(newMode);
            }}
          >
            {stepByStepMode ? '⏸ Step Mode' : '▶ Auto Mode'}
          </button>
        </div>
        {/* Center: Phases */}
        <div style={{ display:'flex', gap:10, fontSize:12, letterSpacing:1, whiteSpace:'nowrap', position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
          {PHASE_TRACK.map((p, i)=>(
            <div key={`${p}-${i}`} style={{
              padding:'3px 10px',
              border:'1px solid var(--glass-border)',
              borderRadius:6,
              background: i === phaseTrackActiveIndex ? 'var(--neon-cyan)' : 'rgba(0,0,0,0.3)',
              color: i === phaseTrackActiveIndex ? '#000' : 'var(--neon-cyan)',
              fontWeight: i === phaseTrackActiveIndex ? 700 : 500,
              minWidth:72,
              textAlign:'center'
            }}>{p}</div>
          ))}
        </div>
      </LayeredPanel>

      {/* CURRENT TURN BANNER */}
      {currentActor && (
        <div style={{ 
          margin: '8px 0', 
          padding: '10px 16px', 
          background: currentActor.isPlayer 
            ? 'linear-gradient(90deg, rgba(0,255,100,0.15), rgba(0,220,100,0.08))' 
            : 'linear-gradient(90deg, rgba(255,80,120,0.15), rgba(255,100,150,0.08))',
          border: `2px solid ${currentActor.isPlayer ? 'rgba(0,255,100,0.8)' : 'var(--neon-pink)'}`,
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 700, 
            letterSpacing: 2,
            color: currentActor.isPlayer ? 'rgba(0,255,100,1)' : 'var(--neon-pink)'
          }}>
            {currentActor.isPlayer ? '▶ YOUR TURN' : '▶ AI TURN'} - {currentActor.id}
          </div>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600,
            color: 'var(--neon-cyan)',
            opacity: 0.9
          }}>
            PHASE: {currentActor && !currentActor.isPlayer && stepByStepMode && !aiPhaseInfo ? 'PLANNING' : combat.phase}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr 260px', gap:12, marginTop:12 }}>
        {/* ACTION SIDEBAR */}
        <LayeredPanel style={{ 
          padding:8, 
          overflow:'auto',
          border: currentActor?.isPlayer && !combat?.reactionWindowOpen ? '2px solid rgba(0,255,100,0.8)' : undefined,
          boxShadow: currentActor?.isPlayer && !combat?.reactionWindowOpen ? '0 0 20px rgba(0,255,100,0.5)' : undefined
        }}>
          {combat?.reactionWindowOpen && (
            <div style={{ 
              position:'relative', 
              border:'2px solid rgba(0,255,100,0.8)', 
              borderRadius:10, 
              marginBottom:14, 
              background:'rgba(0,255,100,0.15)',
              boxShadow: '0 0 20px rgba(0,255,100,0.5)'
            }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(1000px 500px at 50% 40%, rgba(0,255,100,0.15), rgba(0,255,100,0.08))', pointerEvents:'none' }} />
              <div style={{ position:'relative', padding:8 }}>
                <Section title='⚡ Reaction Window'>
              {playerAvailableReactions.length === 0 ? (
                <div style={{ fontSize:11, color:'var(--neon-cyan)', opacity:0.7, marginBottom:8 }}>No reactions available.</div>
              ) : (
                <ActionTable
                  rows={playerAvailableReactions.map(r => {
                    const actionDef = ACTION_TYPES[r];
                    
                    // Check cooldown status
                    const cooldownInfo = combat.getAbilityCooldownInfo(player.id, r, actionDef);
                    const isAvailable = cooldownInfo.available && combat.canPerformAction(player.id,'reaction');
                    
                    let info = '';
                    let hover = '';
                    
                    if (r === 'COUNTERFIRE') {
                      info = 'Return fire (-2 penalty)';
                      hover = 'Fire back at the attacker with a -2 attack penalty. Requires a weapon capable of reaction fire. Cooldown: 2 rounds.';
                    } else if (r === 'EMERGENCY_BURN') {
                      info = '+3 Evasion vs attack';
                      hover = 'Emergency thruster burn to evade this attack. Grants +3 evasion bonus against the incoming attack. Limited: Once per combat.';
                    } else if (r === 'POINT_DEFENSE') {
                      info = '50% intercept chance';
                      hover = 'Activate point defense systems to intercept the incoming attack. 50% chance to completely negate the attack. Cooldown: 3 rounds.';
                    } else if (r === 'BOOST_SHIELDS') {
                      info = '+20 Temp Shields (2 rnd)';
                      hover = 'Emergency shield boost. Grants 20 temporary shields for 2 rounds.';
                    }
                    
                    // Append cooldown info to display
                    if (!isAvailable && cooldownInfo.reason) {
                      info = `${info} [${cooldownInfo.reason}]`;
                    } else if (cooldownInfo.reason) {
                      info = `${info} (${cooldownInfo.reason})`;
                    }
                    
                    return {
                      key: r,
                      label: actionDef?.name || r.replace(/_/g, ' '),
                      info,
                      hover,
                      disabled: !isAvailable,
                      onTrigger: async () => {
                        combat.queueReaction(player.id, r, currentActor);
                        combat.closeReactionWindow();
                        await combat.resolveReactions();
                        captureTurnDetails();
                        // If this was during AI turn step-by-step, resume AI
                        if (currentActor && !currentActor.isPlayer && stepByStepMode) {
                          await resumeAIAfterReaction();
                        }
                        setRefreshTick(t=>t+1);
                      }
                    };
                  })}
                />
              )}
              <div style={{ display:'flex', gap:6, marginTop:8 }}>
                <button className='btn-neon' style={compactBtn} onClick={async ()=>{ 
                  combat.closeReactionWindow(); 
                  await combat.resolveReactions(); 
                  captureTurnDetails(); 
                  // If this was during AI turn step-by-step, resume AI
                  if (currentActor && !currentActor.isPlayer && stepByStepMode) {
                    await resumeAIAfterReaction();
                  }
                  setRefreshTick(t=>t+1); 
                }}>Resolve</button>
                <button className='btn-neon btn-neon-danger' style={compactBtn} onClick={async ()=>{ 
                  combat.closeReactionWindow(); 
                  captureTurnDetails(); 
                  // If this was during AI turn step-by-step, resume AI
                  if (currentActor && !currentActor.isPlayer && stepByStepMode) {
                    await resumeAIAfterReaction();
                  }
                  setRefreshTick(t=>t+1); 
                }}>Skip</button>
              </div>
                </Section>
              </div>
            </div>
          )}
          {currentActor && currentActor.isPlayer && (inPhase('MOVEMENT') || inPhase('BONUS_ACTION')) && (
            <Section title='Movement'>
              <ActionTable
                rows={[
                  available.includes('MOVE_CLOSER') && ({
                    key:'MOVE_CLOSER',
                    label:'Move Closer',
                    info:`Speed ${stats?.speed}`,
                    onTrigger:()=>execManual({ type:'MOVE_CLOSER', targetId: primaryEnemy?.id })
                  }),
                  available.includes('MOVE_FARTHER') && ({
                    key:'MOVE_FARTHER',
                    label:'Move Farther',
                    info:`Speed ${stats?.speed}`,
                    onTrigger:()=>execManual({ type:'MOVE_FARTHER', targetId: primaryEnemy?.id })
                  })
                ].filter(Boolean)}
                disabled={!can('movement')}
              />
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <button className='btn-neon' style={compactBtn} onClick={()=>{ combat.log(`${currentActor?.id} stays put`); captureTurnDetails(); if (combat.phase==='MOVEMENT') combat.nextPhase(); setRefreshTick(t=>t+1); }}>Stay Put</button>
                {combat.phase==='MOVEMENT' && (
                  <button className='btn-neon' style={{ ...compactBtn }} onClick={()=>{ combat.nextPhase(); setRefreshTick(t=>t+1); }}>Next Phase (Action)</button>
                )}
                {combat.phase==='BONUS_ACTION' && (
                  <button className='btn-neon' style={{ ...compactBtn }} onClick={()=>{ combat.advanceTurn(); setRefreshTick(t=>t+1); }}>End Turn</button>
                )}
              </div>
            </Section>
          )}
          {currentActor && currentActor.isPlayer && inPhase('ACTION') && (
            <Section title='Attack'>
              <ActionTable
                rows={[
                  ...((available.includes('FIRE_WEAPON')? weapons:[]).map(w=>({
                    key:`FIRE_${w.id}`,
                    label:w.name,
                    info:`${w.damage} • ROF ${w.rateOfFire||1}`,
                    hover: primaryEnemy ? getActionHoverStats('FIRE_WEAPON', { actor: currentActor, target: primaryEnemy, weapon: w, combat }) : null,
                    onTrigger:()=>execManual({ type:'FIRE_WEAPON', targetId: primaryEnemy?.id, weaponId: w.id })
                  })) ),
                  available.includes('EVASIVE_MANEUVERS') && {
                    key:'EVASIVE_MANEUVERS',
                    label:'Evasive Maneuvers',
                    info:'+4 Evasion (1 round)',
                    onTrigger:()=>execManual({ type:'EVASIVE_MANEUVERS' })
                  },
                  available.includes('SCAN_TARGET') && {
                    key:'SCAN_TARGET',
                    label:'Scan Target',
                    info:'-2 SR for 3 rounds',
                    onTrigger:()=>execManual({ type:'SCAN_TARGET', targetId: primaryEnemy?.id })
                  }
                ].filter(Boolean)}
                disabled={!can('action')}
              />
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <button className='btn-neon' style={compactBtn} onClick={async ()=>{
                  if (!combat || !currentActor || !primaryEnemy) return;
                  const triggeringAction = { actor: currentActor.id, type: 'REACTION_WINDOW', target: primaryEnemy.id, data: {} };
                  const eligibleReactors = [primaryEnemy.id];
                  const windowPromise = combat.openReactionWindow(triggeringAction, eligibleReactors);
                  const reactor = combat.getEnemies(currentActor.id)[0];
                  if (reactor?.isAI) {
                    const ai = new (await import('../../lib/combat/ai/AICombat.js')).AICombatEngine(
                      reactor,
                      reactor.personality || 'TACTICAL',
                      reactor.veteranRank || 'TRAINED'
                    );
                    const reactionType = ai.decideReaction(triggeringAction, combat);
                    if (reactionType) combat.queueReaction(reactor.id, reactionType, currentActor);
                    combat.closeReactionWindow();
                  }
                  await windowPromise;
                  await combat.resolveReactions();
                  captureTurnDetails();
                  if (combat.phase==='ACTION') combat.nextPhase();
                  setRefreshTick(t=>t+1);
                }}>Reaction Phase</button>
              </div>
            </Section>
          )}
          {currentActor && currentActor.isPlayer && inPhase('ACTION') && (available.includes('BOOST_SHIELDS') || available.includes('TARGET_LOCK') || available.includes('EMERGENCY_REPAIR') || available.includes('POWER_REDISTRIBUTE')) && (
            <Section title='Utility'>
              <ActionTable
                rows={[
                  available.includes('BOOST_SHIELDS') && { key:'BOOST_SHIELDS', label:'Boost Shields', info:'+20 Temp Shields (2 rnd)', onTrigger:()=>execManual({ type:'BOOST_SHIELDS' }), type:'bonus' },
                  available.includes('TARGET_LOCK') && { key:'TARGET_LOCK', label:'Target Lock', info:'+2 attack vs target', onTrigger:()=>execManual({ type:'TARGET_LOCK', targetId: primaryEnemy?.id }), type:'bonus' },
                  available.includes('POWER_REDISTRIBUTE') && { key:'POWER_REDISTRIBUTE', label:'Redistribute Power', info:'Adjust power allocation', onTrigger:()=>execManual({ type:'POWER_REDISTRIBUTE' }), type:'bonus' },
                  available.includes('EMERGENCY_REPAIR') && { key:'EMERGENCY_REPAIR', label:'Emergency Repair', info:'+15 Hull', onTrigger:()=>execManual({ type:'EMERGENCY_REPAIR' }), type:'action' }
                ].filter(Boolean)}
                disabled={false}
              />
            </Section>
          )}

          {currentActor && currentActor.isPlayer && (
            <>
              <Section title='Communication'>
                <div style={{ fontSize:11, color:'var(--neon-cyan)', opacity:0.8 }}>Placeholder for hail / surrender / taunt systems.</div>
              </Section>
              <div style={{ marginTop:12 }}>
                <button className='btn-neon' style={compactBtn} onClick={endTurn}>End Turn</button>
              </div>
              <div style={{ marginTop:8, fontSize:10, color:'var(--neon-cyan)' }}>Actions: {remaining.actions} • Bonus: {remaining.bonusActions} • MovePts: {remaining.movement} • React: {remaining.reactions}</div>
            </>
          )}
        </LayeredPanel>

        {/* CENTER AREA: BATTLESPACE + PLAYER PANEL */}
        <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:12 }}>
          <LayeredPanel style={{ padding:8, display:'flex', flexDirection:'column', gap:8 }}>
            <BattlespaceStrip combat={combat} actor={player} opponents={enemies} />
            <div style={{ border:'1px solid var(--glass-border)', borderRadius:8, padding:8, background:'rgba(0,0,0,0.25)', display:'flex', flexDirection:'column', maxHeight:180 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ fontWeight:600, letterSpacing:1, color:'var(--neon-cyan)', fontSize:12 }}>Turn Details</div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className='btn-neon' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>setTurnDetails([])}>Clear</button>
                  <button className='btn-neon' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>captureTurnDetails()}>Refresh</button>
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--neon-cyan)', overflow:'auto' }}>
                {turnDetails.length === 0 ? (
                  <div style={{ opacity:0.7 }}>No recent actions yet. Movement, attacks, reactions will print here.</div>
                ) : (
                  turnDetails.map((l, i) => (
                    <div key={i} style={{ marginBottom:2 }}>{l}</div>
                  ))
                )}
              </div>
            </div>
          </LayeredPanel>
          <LayeredPanel style={{ padding:8, overflow:'auto' }}>
            <div 
              style={{ 
                display:'flex', 
                alignItems:'center', 
                justifyContent:'space-between',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                marginBottom: 8
              }}
            >
              <div style={{ fontWeight:600, letterSpacing:1, color:'var(--neon-cyan)', fontSize:12 }}>Player</div>
              <button className='btn-neon' style={compactBtn} onClick={()=>setPlayerInfoOpen(o=>!o)}>{playerInfoOpen ? '▾' : '▸'}</button>
            </div>
            {playerInfoOpen && player && (
              <PlayerInfo player={player} />
            )}
          </LayeredPanel>
        </div>

        {/* RIGHT AI PANEL */}
        <LayeredPanel style={{ 
          padding:8, 
          overflow:'auto',
          border: currentActor && !currentActor.isPlayer ? '2px solid var(--neon-pink)' : undefined,
          boxShadow: currentActor && !currentActor.isPlayer ? '0 0 20px rgba(255,80,120,0.4)' : undefined
        }}>
          {/* AI Step Controls (when AI turn and step-by-step mode) */}
          {currentActor && !currentActor.isPlayer && stepByStepMode && aiPhaseInfo && !combat?.reactionWindowOpen && (
            <div style={{ marginBottom:12, border:'2px solid var(--neon-pink)', borderRadius:10, padding:8, background:'rgba(255,80,120,0.1)' }}>
              <div style={{ color:'var(--neon-pink)', fontWeight:700, fontSize:13, marginBottom:6, letterSpacing:1 }}>
                AI TURN - {currentActor.id}
              </div>
              <div style={{ fontSize:11, color:'var(--neon-cyan)', marginBottom:8 }}>
                <div><strong>Combat Phase:</strong> {combat?.phase || 'UNKNOWN'}</div>
                <div><strong>Executing:</strong> {aiPhaseInfo.type} - {aiPhaseInfo.action}</div>
                <div style={{ opacity:0.7, marginTop:4 }}>
                  {flowRef.current.hasMorePhases() 
                    ? `${flowRef.current.aiTurnPhases.length - flowRef.current.currentPhaseIndex} phase(s) remaining`
                    : 'All phases complete'}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button 
                  className='btn-neon' 
                  style={{ flex:1, padding:'6px', fontSize:11 }} 
                  onClick={executeNextAIPhase}
                  disabled={!flowRef.current.hasMorePhases()}
                >
                  ▶ Execute Phase
                </button>
                <button 
                  className='btn-neon btn-neon-danger' 
                  style={{ padding:'6px 10px', fontSize:11 }} 
                  onClick={skipAITurn}
                >
                  ⏭ Skip Turn
                </button>
              </div>
            </div>
          )}
          
          {/* AI Decision Summary */}
          {currentActor && !currentActor.isPlayer && stepByStepMode && plan?.summary && (
            <div style={{ 
              padding: 10, 
              background: 'rgba(0,255,180,0.05)', 
              border: '1px solid var(--neon-cyan)',
              borderRadius: 8,
              marginBottom: 12
            }}>
              <div style={{ fontSize: 11, color: 'var(--neon-cyan)', fontWeight: 600, marginBottom: 6 }}>
                📋 AI Decision Summary
              </div>
              
              <div style={{ fontSize: 10, color: 'var(--neon-cyan)', marginBottom: 4 }}>
                <span style={{ opacity: 0.7 }}>Strategy:</span> <span style={{ fontWeight: 600 }}>{plan.summary.strategy}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--neon-cyan)', marginBottom: 6 }}>
                <span style={{ opacity: 0.7 }}>Target:</span> <span style={{ fontWeight: 600 }}>{plan.summary.target}</span>
              </div>
              
              <div style={{ fontSize: 9, color: 'var(--neon-cyan)', fontWeight: 600, marginBottom: 3, opacity: 0.8 }}>
                Turn Plan:
              </div>
              {plan.summary.phases.map((p, i) => (
                <div 
                  key={i} 
                  style={{ 
                    fontSize: 9, 
                    color: 'var(--neon-cyan)', 
                    opacity: 0.85,
                    marginLeft: 6,
                    marginBottom: 1,
                    display: 'flex',
                    gap: 4
                  }}
                >
                  <span style={{ fontWeight: 600, minWidth: 60 }}>{p.phase}:</span>
                  <span>{p.detail}</span>
                </div>
              ))}
              
              {plan.summary.assessment && (
                <div style={{ fontSize: 9, color: 'var(--neon-pink)', opacity: 0.85, marginTop: 4, fontStyle: 'italic' }}>
                  Next Turn: {plan.summary.assessment}
                </div>
              )}
            </div>
          )}
          
          {/* Pending Reaction Message */}
          {combat?.reactionWindowOpen && (
            <div style={{ 
              marginBottom:12, 
              border:'1px solid var(--glass-border)', 
              borderRadius:10, 
              padding:8, 
              background:'rgba(0,10,20,0.5)',
              opacity: 0.6
            }}>
              <div style={{ color:'var(--neon-cyan)', fontSize:11, textAlign:'center', fontStyle:'italic' }}>
                Pending Opponent Reaction...
              </div>
            </div>
          )}
          
          {/* Pending Reaction Message */}
          {combat?.reactionWindowOpen && (
            <div style={{ 
              marginBottom:12, 
              border:'1px solid var(--glass-border)', 
              borderRadius:10, 
              padding:8, 
              background:'rgba(0,10,20,0.5)',
              opacity: 0.6
            }}>
              <div style={{ color:'var(--neon-cyan)', fontSize:11, textAlign:'center', fontStyle:'italic' }}>
                Pending Opponent Reaction...
              </div>
            </div>
          )}
          
          <h3 className='neon-title' style={{ marginTop:0, fontSize:13 }}>Opponents</h3>
          {enemies.map(e => (
            <AICard key={e.id} enemy={e} combat={combat} />
          ))}
        </LayeredPanel>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom:14 }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ color:'var(--neon-cyan)' }}>{open ? '▾' : '▸'}</span>
        <span className='neon-title' style={{ fontSize:14 }}>{title}</span>
      </div>
      {open && <div style={{ display:'grid', gap:8 }}>{children}</div>}
    </div>
  );
}

// POI-style action table with small text and right-aligned trigger button
function ActionTable({ rows, disabled }) {
  return (
    <div className='digital-grid-bg' style={{ border:'1px solid var(--glass-border)', borderRadius:8, overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(800px 400px at 50% 40%, rgba(0,255,180,0.06), rgba(0,255,255,0.02))', pointerEvents:'none' }} />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <tbody>
          {rows.map(r => {
            const isDisabled = r.disabled !== undefined ? r.disabled : disabled;
            return (
              <tr key={r.key} style={{ borderBottom:'1px solid var(--glass-border)', opacity: isDisabled ? 0.5 : 1 }} title={r.hover ? `${r.hover}` : ''}>
                <td style={{ padding:'6px 8px', fontSize:11, color:'var(--neon-cyan)' }}>{r.label}</td>
                <td style={{ padding:'6px 8px', fontSize:10, color:'var(--neon-cyan)', opacity:0.8 }}>{r.info}</td>
                <td style={{ padding:'6px 8px', textAlign:'right' }}>
                  <button className='btn-neon' style={{ padding:'3px 8px', fontSize:11 }} disabled={isDisabled} onClick={r.onTrigger}>Trigger</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Compute hover text stats: expected hit chance and damage for FIRE_WEAPON
function getActionHoverStats(type, { actor, target, weapon, combat }) {
  if (type !== 'FIRE_WEAPON') return null;
  const bandKey = combat.positioning.getDistanceBandKey(actor.id, target.id);
  // Approximate with AI engine helper to reuse logic
  const ai = new AICombatEngine(actor, actor.personality || 'TACTICAL', actor.veteranRank || 'TRAINED');
  const atkStats = actor.ship.calculateCombatStats();
  const defStats = target.ship.calculateCombatStats();
  const hitChance = Math.round(ai.estimateHitChance(atkStats, defStats, weapon, bandKey) * 100);
  const expected = Math.round(ai.estimateExpectedDamage(atkStats, defStats, weapon, bandKey));
  return `Band ${bandKey} • Hit ${hitChance}% • DPR ${expected}`;
}

function PlayerInfo({ player }) {
  const [detail, setDetail] = useState(null); // { kind: 'weapon'|'component', data: {...} }
  const stats = player.ship.calculateCombatStats();
  const hull = player.ship.currentHull ?? stats.maxHull;
  const shields = player.ship.currentShields ?? stats.maxShields;

  const openWeapon = (w) => {
    const role = evaluateWeaponRole(w);
    setDetail({ kind: 'weapon', data: w, role });
  };
  const openComponent = (id) => {
    const comp = COMPONENTS[id];
    if (!comp) return;
    const role = evaluateComponentRole(comp);
    setDetail({ kind: 'component', data: comp, rawId: id, role });
  };

  return (
    <div style={{ marginTop:6, position:'relative' }}>
      <Bar label='Shields' value={shields} max={stats.maxShields} color='var(--neon-blue)' />
      <Bar label='Hull' value={hull} max={stats.maxHull} color='var(--neon-pink)' />
      <div style={{ marginTop:6, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <h4 style={{ margin:'4px 0', color:'var(--neon-cyan)', fontSize:11 }}>Weapons</h4>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {stats.weapons.map(w => (
              <button key={w.id} onClick={()=>openWeapon(w)} style={{ cursor:'pointer', background:'rgba(0,0,0,0.4)', padding:'3px 6px', border:'1px solid var(--glass-border)', borderRadius:6, fontSize:10, color:'var(--neon-cyan)' }}>{w.name}</button>
            ))}
          </div>
          <h4 style={{ margin:'6px 0 4px', color:'var(--neon-cyan)', fontSize:11 }}>Sub Systems</h4>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {player.ship.getInstalledComponents().filter(id=>!id.startsWith('WEAPON')).map(id => {
                const comp = COMPONENTS[id];
                const label = comp?.name || id;
                return (
                  <button key={id} onClick={()=>openComponent(id)} style={{ cursor:'pointer', background:'rgba(0,0,0,0.4)', padding:'3px 6px', border:'1px solid var(--glass-border)', borderRadius:6, fontSize:10, color:'var(--neon-cyan)' }}>{label}</button>
                );
              })}
            </div>
        </div>
        <div>
          <h4 style={{ margin:'4px 0', color:'var(--neon-cyan)', fontSize:11 }}>Attributes</h4>
          <Attr label='Signature Radius' value={stats.signatureRadius} />
          <Attr label='Evasion' value={stats.evasion} />
          <Attr label='Attack Bonus' value={stats.attackBonus} />
          <Attr label='Speed' value={stats.speed} />
          <Attr label='Actions/Turn' value={stats.actionsPerTurn} />
          <Attr label='Bonus Actions' value={stats.bonusActionsPerTurn} />
          <Attr label='Reactions/Round' value={stats.reactionsPerRound} />
          <Attr label='Initiative' value={stats.initiative} />
          <Attr label='Sensor Range' value={stats.sensorRange} />
          <Attr label='Power Balance' value={stats.powerBalance} />
        </div>
      </div>
      {detail && (
        <ComponentPopup detail={detail} onClose={()=>setDetail(null)} />
      )}
    </div>
  );
}

function evaluateWeaponRole(w) {
  const mods = w.rangeModifiers || {};
  const close = (mods.POINT_BLANK||0) + (mods.CLOSE||0);
  const far = (mods.LONG||0) + (mods.EXTREME||0);
  if (close > far + 2) return 'Close Quarters';
  if (far > close + 2) return 'Long Range';
  return 'Flexible';
}

function evaluateComponentRole(comp) {
  if (comp.type === 'weapon') return evaluateWeaponRole({ rangeModifiers: comp.attributes.rangeModifiers || {} });
  if (comp.type === 'sensor') return 'Sensor / Detection';
  if (comp.type === 'engine') return 'Mobility';
  if (comp.type === 'shield') return 'Defense';
  if (comp.type === 'pointDefense') return 'Intercept';
  if (comp.type === 'combatComputer') return 'Fire Control';
  return 'Support';
}

function ComponentPopup({ detail, onClose }) {
  const { kind, data, role, rawId } = detail;
  const isWeapon = kind === 'weapon' || data.type === 'weapon';
  const attrs = data.attributes || {};
  return (
    <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)', background:'radial-gradient(800px 400px at 50% 40%, rgba(0,255,180,0.12), rgba(0,255,255,0.05))', border:'1px solid var(--glass-border-bright)', borderRadius:10, padding:12, width:'min(360px, 90%)', zIndex:40, boxShadow:'0 0 12px rgba(0,255,200,0.25)', backdropFilter:'blur(10px)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--neon-cyan)' }}>{data.name || rawId}</div>
        <button className='btn-neon btn-neon-danger' style={{ padding:'3px 8px', fontSize:11 }} onClick={onClose}>×</button>
      </div>
      <div style={{ fontSize:11, color:'var(--neon-cyan)', marginBottom:6 }}>Role: {role}</div>
      {isWeapon && (
        <div style={{ fontSize:11, color:'var(--neon-cyan)', marginBottom:8 }}>
          <div>Damage: {data.damage || attrs.damage} ({data.damageType || attrs.damageType})</div>
          <div>Rate of Fire: {data.rateOfFire || attrs.rateOfFire || 1}</div>
          <div>Attack Bonus: {(data.attackBonus||0) + (attrs.attackBonus||0)}</div>
          <div style={{ marginTop:4 }}>Range Mods:</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4, marginTop:4 }}>
            {['POINT_BLANK','CLOSE','MEDIUM','LONG','EXTREME'].map(b => (
              <div key={b} style={{ padding:'3px 4px', border:'1px solid var(--glass-border)', borderRadius:5, fontSize:10 }}>
                <div style={{ opacity:0.7 }}>{b.replace('_',' ')}</div>
                <div>{(data.rangeModifiers||attrs.rangeModifiers||{})[b] ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!isWeapon && (
        <div style={{ fontSize:11, color:'var(--neon-cyan)', display:'grid', gap:4 }}>
          {Object.entries(attrs).filter(([k,v]) => typeof v !== 'object').map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ opacity:0.7 }}>{k}</span><span>{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AICard({ enemy, combat }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const stats = enemy.ship.calculateCombatStats();
  const effects = combat?.getStatusEffects(enemy.id) || [];
  const scanned = effects.some(e => e.type === 'SCANNED');
  const hull = enemy.ship.currentHull ?? stats.maxHull;
  const shields = enemy.ship.currentShields ?? stats.maxShields;
  const openComp = (id) => { const comp = COMPONENTS[id]; if (comp) setDetail({ kind:'component', data: comp, rawId: id, role: evaluateComponentRole(comp) }); };
  const openWeapon = (w) => setDetail({ kind:'weapon', data: w, role: evaluateWeaponRole(w) });
  
  const currentActor = combat?.getCurrentShip();
  const isActive = currentActor?.id === enemy.id;
  
  return (
    <div style={{ 
      position:'relative', 
      border: isActive ? '2px solid var(--neon-pink)' : '1px solid var(--glass-border)', 
      borderRadius:8, 
      padding:8, 
      marginBottom:10, 
      background: isActive ? 'rgba(255,80,120,0.1)' : 'rgba(0,0,0,0.2)',
      boxShadow: isActive ? '0 0 20px rgba(255,80,120,0.4)' : 'none'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontWeight:600, color:'var(--neon-cyan)', fontSize:12 }}>{enemy.id}{scanned && ' • SCANNED'}</div>
          {isActive && (
            <div style={{ 
              fontSize:10, 
              fontWeight:700, 
              color:'var(--neon-pink)', 
              background:'rgba(255,80,120,0.2)',
              padding:'2px 6px',
              borderRadius:4,
              letterSpacing:1
            }}>ACTIVE</div>
          )}
        </div>
        <button className='btn-neon' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>setOpen(o=>!o)}>{open?'▾':'▸'}</button>
      </div>
      {open && (
        <div style={{ marginTop:6, fontSize:10, lineHeight:1.4, display:'grid', gap:4 }}>
          <div>SR: {stats.signatureRadius} | EVA: {stats.evasion} | ATK: {stats.attackBonus} | Speed: {stats.speed}</div>
          <div>Init: {stats.initiative} | Sensor: {stats.sensorRange} | Power: {stats.powerBalance}</div>
          {scanned && (
            <div style={{ display:'grid', gap:4 }}>
              <div>Shields: {shields}/{stats.maxShields} | Hull: {hull}/{stats.maxHull}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {stats.weapons.map(w => (
                  <button key={w.id} onClick={()=>openWeapon(w)} style={{ background:'rgba(0,0,0,0.4)', border:'1px solid var(--glass-border)', borderRadius:6, padding:'2px 5px', fontSize:9, color:'var(--neon-cyan)' }}>{w.name}</button>
                ))}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {enemy.ship.getInstalledComponents().filter(id=>!id.startsWith('WEAPON')).map(id => {
                  const comp = COMPONENTS[id];
                  const label = comp?.name || id;
                  return <button key={id} onClick={()=>openComp(id)} style={{ background:'rgba(0,0,0,0.4)', border:'1px solid var(--glass-border)', borderRadius:6, padding:'2px 5px', fontSize:9, color:'var(--neon-cyan)' }}>{label}</button>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {detail && <ComponentPopup detail={detail} onClose={()=>setDetail(null)} />}
    </div>
  );
}

function Bar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div style={{ marginBottom:5 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:2 }}>
        <span style={{ color:'var(--neon-cyan)' }}>{label}</span>
        <span style={{ color:'var(--neon-cyan)' }}>{value}/{max}</span>
      </div>
      <div style={{ height:8, background:'rgba(0,0,0,0.4)', border:'1px solid var(--glass-border)', borderRadius:6, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color }} />
      </div>
    </div>
  );
}

function Attr({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, borderBottom:'1px solid rgba(0,255,255,0.08)', padding:'2px 0' }}>
      <span style={{ color:'var(--neon-cyan)', opacity:0.8 }}>{label}</span>
      <span style={{ color:'var(--neon-cyan)' }}>{value}</span>
    </div>
  );
}

function EditorSection({ title, children }) {
  return (
    <div>
      <div style={{ fontSize:11, color:'var(--neon-cyan)', marginBottom:4 }}>{title}</div>
      <div style={{ display:'grid', gap:6 }}>{children}</div>
    </div>
  );
}

function SlotEditor({ value, onChange, options }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6, alignItems:'center' }}>
      <select value={value ?? ''} onChange={e=>onChange(e.target.value || null)} style={{ width:'100%', background:'rgba(0,0,0,0.5)', color:'var(--neon-cyan)', border:'1px solid var(--glass-border)', padding:'4px 6px', fontSize:11 }}>
        {options.map(opt => (
          <option key={opt ?? 'none'} value={opt ?? ''}>{opt ?? 'None'}</option>
        ))}
      </select>
      {value && (
        <button className='btn-neon btn-neon-danger' style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>onChange(null)}>Clear</button>
      )}
    </div>
  );
}
