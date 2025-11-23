import React, { useState, useEffect } from 'react';
import { CombatEngine, createEnemy } from '../lib/combatEngine';
import '../styles/AdminGlass.css';

/**
 * Combat Window - Turn-based space combat interface
 * Opens as a modal window when combat is initiated
 */
export default function CombatWindow({ playerData, enemyTemplate, onCombatEnd, onClose }) {
  const [combat, setCombat] = useState(null);
  const [combatState, setCombatState] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [autoPlayAI, setAutoPlayAI] = useState(true);

  // Initialize combat on mount
  useEffect(() => {
    const enemyData = createEnemy(enemyTemplate || 'pirate_fighter');
    const newCombat = new CombatEngine(playerData, enemyData);
    setCombat(newCombat);
    setCombatState(newCombat.getState());
  }, [playerData, enemyTemplate]);

  // Auto-play AI turns
  useEffect(() => {
    if (!combat || !combatState || !autoPlayAI) return;
    
    if (!combatState.isPlayerTurn && combatState.combatActive) {
      const timer = setTimeout(() => {
        combat.executeAITurn();
        setCombatState(combat.getState());
      }, 1500); // AI delay for dramatic effect
      
      return () => clearTimeout(timer);
    }
  }, [combat, combatState, autoPlayAI]);

  // Check for combat end
  useEffect(() => {
    if (combatState && !combatState.combatActive) {
      const timer = setTimeout(() => {
        if (onCombatEnd) {
          onCombatEnd({
            winner: combatState.winner,
            playerHull: combatState.player.currentHull,
            playerShields: combatState.player.currentShields,
            enemyDestroyed: combatState.winner === 'player'
          });
        }
      }, 3000); // Show results for 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [combatState, onCombatEnd]);

  const handleActionSelect = (action) => {
    setSelectedAction(action);
  };

  const handleExecuteAction = () => {
    if (!selectedAction || !combat) return;
    
    setAnimating(true);
    const result = combat.executePlayerAction(selectedAction);
    
    setTimeout(() => {
      setCombatState(combat.getState());
      setSelectedAction(null);
      setAnimating(false);
    }, 800);
  };

  if (!combatState) {
    return (
      <div className="combat-window-overlay">
        <div className="combat-window">
          <div className="loading-combat">Initializing Combat Systems...</div>
        </div>
      </div>
    );
  }

  const { player, enemy, turnCount, isPlayerTurn, combatActive, winner, availableActions, combatLog } = combatState;

  return (
    <div className="combat-window-overlay">
      <div className="combat-window">
        {/* Header */}
        <div className="combat-header">
          <div className="combat-title">
            <span className="combat-icon">⚔️</span>
            <h2>COMBAT ENGAGEMENT</h2>
            <span className="combat-icon">⚔️</span>
          </div>
          <div className="combat-turn-counter">
            Turn: {turnCount} | {isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN'}
          </div>
        </div>

        {/* Combat Arena */}
        <div className="combat-arena">
          {/* Player Ship */}
          <div className="combatant-panel player-panel">
            <div className="combatant-header">
              <div className="combatant-name">{player.name}</div>
              <div className="combatant-type">{player.type}</div>
            </div>
            
            <div className="combatant-ship-visual player-ship">
              <div className="ship-icon">🚀</div>
              {player.currentShields > 0 && (
                <div className="shield-effect" style={{ opacity: player.currentShields / player.maxShields }}>
                  🛡️
                </div>
              )}
            </div>
            
            <div className="combatant-stats">
              <div className="stat-bar hull-bar">
                <div className="stat-label">Hull</div>
                <div className="stat-bar-container">
                  <div 
                    className="stat-bar-fill hull-fill"
                    style={{ width: `${(player.currentHull / player.maxHull) * 100}%` }}
                  />
                  <div className="stat-value">{Math.round(player.currentHull)}/{player.maxHull}</div>
                </div>
              </div>
              
              <div className="stat-bar shields-bar">
                <div className="stat-label">Shields</div>
                <div className="stat-bar-container">
                  <div 
                    className="stat-bar-fill shields-fill"
                    style={{ width: `${(player.currentShields / player.maxShields) * 100}%` }}
                  />
                  <div className="stat-value">{Math.round(player.currentShields)}/{player.maxShields}</div>
                </div>
              </div>
              
              <div className="stat-bar energy-bar">
                <div className="stat-label">Energy</div>
                <div className="stat-bar-container">
                  <div 
                    className="stat-bar-fill energy-fill"
                    style={{ width: `${(player.currentEnergy / player.maxEnergy) * 100}%` }}
                  />
                  <div className="stat-value">{Math.round(player.currentEnergy)}/{player.maxEnergy}</div>
                </div>
              </div>
            </div>
            
            {player.statusEffects.length > 0 && (
              <div className="status-effects">
                {player.statusEffects.map((effect, i) => (
                  <div key={i} className="status-effect">{effect.type} ({effect.duration})</div>
                ))}
              </div>
            )}
          </div>

          {/* VS Indicator */}
          <div className="combat-vs-indicator">
            <div className="vs-text">VS</div>
            {animating && <div className="combat-flash">💥</div>}
          </div>

          {/* Enemy Ship */}
          <div className="combatant-panel enemy-panel">
            <div className="combatant-header">
              <div className="combatant-name enemy-name">{enemy.name}</div>
              <div className="combatant-type">{enemy.type}</div>
            </div>
            
            <div className="combatant-ship-visual enemy-ship">
              <div className="ship-icon">👾</div>
              {enemy.currentShields > 0 && (
                <div className="shield-effect" style={{ opacity: enemy.currentShields / enemy.maxShields }}>
                  🛡️
                </div>
              )}
            </div>
            
            <div className="combatant-stats">
              <div className="stat-bar hull-bar">
                <div className="stat-label">Hull</div>
                <div className="stat-bar-container">
                  <div 
                    className="stat-bar-fill hull-fill enemy-fill"
                    style={{ width: `${(enemy.currentHull / enemy.maxHull) * 100}%` }}
                  />
                  <div className="stat-value">{Math.round(enemy.currentHull)}/{enemy.maxHull}</div>
                </div>
              </div>
              
              <div className="stat-bar shields-bar">
                <div className="stat-label">Shields</div>
                <div className="stat-bar-container">
                  <div 
                    className="stat-bar-fill shields-fill enemy-fill"
                    style={{ width: `${(enemy.currentShields / enemy.maxShields) * 100}%` }}
                  />
                  <div className="stat-value">{Math.round(enemy.currentShields)}/{enemy.maxShields}</div>
                </div>
              </div>
              
              <div className="stat-bar energy-bar">
                <div className="stat-label">Energy</div>
                <div className="stat-bar-container">
                  <div 
                    className="stat-bar-fill energy-fill enemy-fill"
                    style={{ width: `${(enemy.currentEnergy / enemy.maxEnergy) * 100}%` }}
                  />
                  <div className="stat-value">{Math.round(enemy.currentEnergy)}/{enemy.maxEnergy}</div>
                </div>
              </div>
            </div>
            
            {enemy.statusEffects.length > 0 && (
              <div className="status-effects">
                {enemy.statusEffects.map((effect, i) => (
                  <div key={i} className="status-effect">{effect.type} ({effect.duration})</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Combat Log */}
        <div className="combat-log">
          <div className="combat-log-title">Combat Log</div>
          <div className="combat-log-entries">
            {combatLog.slice(-5).reverse().map((entry, i) => (
              <div key={i} className={`log-entry log-${entry.type}`}>
                {entry.message || JSON.stringify(entry)}
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        {combatActive ? (
          <div className="combat-actions">
            <div className="actions-title">
              {isPlayerTurn ? 'SELECT ACTION' : 'ENEMY CALCULATING...'}
            </div>
            
            {isPlayerTurn && (
              <div className="action-buttons">
                {availableActions.map((action, i) => (
                  <button
                    key={i}
                    className={`action-button ${selectedAction?.name === action.name ? 'selected' : ''}`}
                    onClick={() => handleActionSelect(action)}
                    disabled={animating}
                  >
                    <div className="action-name">{action.name}</div>
                    <div className="action-description">{action.description}</div>
                    <div className="action-cost">⚡ {action.energyCost}</div>
                  </button>
                ))}
              </div>
            )}
            
            {isPlayerTurn && selectedAction && (
              <button 
                className="execute-button"
                onClick={handleExecuteAction}
                disabled={animating}
              >
                EXECUTE: {selectedAction.name}
              </button>
            )}
          </div>
        ) : (
          <div className="combat-result">
            <div className={`result-banner ${winner === 'player' ? 'victory' : 'defeat'}`}>
              {winner === 'player' ? '🎉 VICTORY! 🎉' : '💀 DEFEAT 💀'}
            </div>
            <div className="result-message">
              {winner === 'player' 
                ? `${enemy.name} has been destroyed!`
                : `${player.name} has been destroyed!`
              }
            </div>
            <button className="close-combat-button" onClick={onClose}>
              Return to Navigation
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .combat-window-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(10px);
        }
        
        .combat-window {
          width: 95%;
          max-width: 1400px;
          height: 90vh;
          background: linear-gradient(135deg, rgba(10, 15, 30, 0.95), rgba(20, 25, 40, 0.95));
          border: 2px solid #00ffff;
          border-radius: 12px;
          box-shadow: 0 0 50px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: combatWindowAppear 0.5s ease-out;
        }
        
        @keyframes combatWindowAppear {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .combat-header {
          padding: 20px;
          background: linear-gradient(90deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
          border-bottom: 2px solid #00ffff;
          text-align: center;
        }
        
        .combat-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }
        
        .combat-title h2 {
          margin: 0;
          color: #00ffff;
          font-size: 2rem;
          text-shadow: 0 0 10px #00ffff;
          letter-spacing: 4px;
        }
        
        .combat-icon {
          font-size: 2rem;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        
        .combat-turn-counter {
          margin-top: 10px;
          color: #00ff88;
          font-size: 1.1rem;
          font-weight: bold;
        }
        
        .combat-arena {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 40px;
          padding: 30px;
          align-items: center;
        }
        
        .combatant-panel {
          background: rgba(0, 20, 40, 0.6);
          border: 2px solid #00ffff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        }
        
        .enemy-panel {
          border-color: #ff0066;
          box-shadow: 0 0 20px rgba(255, 0, 102, 0.2);
        }
        
        .combatant-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .combatant-name {
          font-size: 1.5rem;
          color: #00ffff;
          font-weight: bold;
          text-shadow: 0 0 10px #00ffff;
        }
        
        .enemy-name {
          color: #ff0066;
          text-shadow: 0 0 10px #ff0066;
        }
        
        .combatant-type {
          font-size: 0.9rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .combatant-ship-visual {
          text-align: center;
          position: relative;
          padding: 40px 0;
        }
        
        .ship-icon {
          font-size: 5rem;
          animation: float 3s ease-in-out infinite;
        }
        
        .enemy-ship .ship-icon {
          animation: floatEnemy 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes floatEnemy {
          0%, 100% { transform: translateY(0) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(-5deg); }
        }
        
        .shield-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 8rem;
          animation: shieldPulse 2s ease-in-out infinite;
          pointer-events: none;
        }
        
        @keyframes shieldPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.9; }
        }
        
        .combatant-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .stat-bar {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: #00ffff;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .stat-bar-container {
          position: relative;
          height: 24px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #00ffff;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .stat-bar-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          transition: width 0.5s ease;
        }
        
        .hull-fill {
          background: linear-gradient(90deg, #888, #ccc);
        }
        
        .shields-fill {
          background: linear-gradient(90deg, #0088ff, #00ffff);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
        
        .energy-fill {
          background: linear-gradient(90deg, #ff8800, #ffff00);
          box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
        }
        
        .enemy-fill {
          opacity: 0.8;
        }
        
        .stat-value {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: white;
          font-size: 0.9rem;
          font-weight: bold;
          text-shadow: 0 0 5px black;
        }
        
        .combat-vs-indicator {
          position: relative;
          text-align: center;
        }
        
        .vs-text {
          font-size: 3rem;
          color: #ff00ff;
          font-weight: bold;
          text-shadow: 0 0 20px #ff00ff;
          animation: pulse 1.5s infinite;
        }
        
        .combat-flash {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 6rem;
          animation: explode 0.8s ease-out;
        }
        
        @keyframes explode {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        
        .combat-log {
          background: rgba(0, 0, 0, 0.7);
          border-top: 2px solid #00ffff;
          padding: 15px;
          height: 150px;
        }
        
        .combat-log-title {
          color: #00ffff;
          font-size: 0.9rem;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .combat-log-entries {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-family: monospace;
          font-size: 0.85rem;
        }
        
        .log-entry {
          color: #aaa;
          padding: 4px 8px;
          background: rgba(0, 255, 255, 0.05);
          border-left: 2px solid #00ffff;
        }
        
        .log-attack {
          border-left-color: #ff0066;
          color: #ff8899;
        }
        
        .combat-actions {
          background: rgba(0, 20, 40, 0.8);
          border-top: 2px solid #00ffff;
          padding: 20px;
        }
        
        .actions-title {
          text-align: center;
          color: #00ffff;
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        
        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .action-button {
          background: linear-gradient(135deg, rgba(0, 100, 150, 0.3), rgba(0, 150, 200, 0.3));
          border: 2px solid #00ffff;
          border-radius: 6px;
          padding: 15px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        
        .action-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(0, 150, 200, 0.5), rgba(0, 200, 255, 0.5));
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
          transform: translateY(-2px);
        }
        
        .action-button.selected {
          border-color: #ffff00;
          box-shadow: 0 0 30px rgba(255, 255, 0, 0.6);
          background: linear-gradient(135deg, rgba(150, 150, 0, 0.3), rgba(200, 200, 0, 0.3));
        }
        
        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .action-name {
          font-weight: bold;
          font-size: 1rem;
          color: #00ffff;
        }
        
        .action-description {
          font-size: 0.85rem;
          color: #aaa;
        }
        
        .action-cost {
          font-size: 0.9rem;
          color: #ffff00;
        }
        
        .execute-button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #ff0066, #ff6600);
          border: 2px solid #ff00ff;
          border-radius: 6px;
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 3px;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(255, 0, 102, 0.5);
        }
        
        .execute-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff3388, #ff8822);
          box-shadow: 0 0 40px rgba(255, 0, 102, 0.8);
          transform: translateY(-2px);
        }
        
        .execute-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .combat-result {
          background: rgba(0, 0, 0, 0.9);
          border-top: 2px solid #00ffff;
          padding: 30px;
          text-align: center;
        }
        
        .result-banner {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 20px;
          animation: resultAppear 0.5s ease-out;
        }
        
        .result-banner.victory {
          color: #00ff88;
          text-shadow: 0 0 30px #00ff88;
        }
        
        .result-banner.defeat {
          color: #ff0066;
          text-shadow: 0 0 30px #ff0066;
        }
        
        @keyframes resultAppear {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .result-message {
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 30px;
        }
        
        .close-combat-button {
          padding: 15px 40px;
          background: linear-gradient(135deg, #00ffff, #0088ff);
          border: 2px solid #00ffff;
          border-radius: 6px;
          color: white;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 2px;
          transition: all 0.3s ease;
        }
        
        .close-combat-button:hover {
          background: linear-gradient(135deg, #00ffff, #00aaff);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
          transform: translateY(-2px);
        }
        
        .loading-combat {
          color: #00ffff;
          font-size: 1.5rem;
          text-align: center;
          padding: 100px;
          animation: pulse 1s infinite;
        }
        
        .status-effects {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .status-effect {
          background: rgba(255, 165, 0, 0.2);
          border: 1px solid #ff8800;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.75rem;
          color: #ffaa00;
        }
      `}</style>
    </div>
  );
}
