import { useState, useEffect } from 'react';
import { getUniverseTime } from '../lib/universeTime.js';
import { TIME_SCALE_OPTIONS, DEFAULT_TIME_SCALE } from '../lib/timeScalePresets.js';

/**
 * TimeControlPanel - Global time scale control
 * Allows pausing and changing game speed
 */
export default function TimeControlPanel({ className, style }) {
  const [isPaused, setIsPaused] = useState(false);
  const [currentScale, setCurrentScale] = useState(DEFAULT_TIME_SCALE);
  const universeTime = getUniverseTime();

  // Initialize time scale on mount
  useEffect(() => {
    if (universeTime.getTimeScale() !== DEFAULT_TIME_SCALE) {
      universeTime.setTimeScale(DEFAULT_TIME_SCALE);
    }
  }, []);

  // Listen for time scale changes from other sources
  useEffect(() => {
    const handlePause = () => setIsPaused(true);
    const handleResume = () => setIsPaused(false);
    const handleScale = ({ scale }) => setCurrentScale(scale);

    const unsub1 = universeTime.on('pause', handlePause);
    const unsub2 = universeTime.on('resume', handleResume);
    const unsub3 = universeTime.on('scale', handleScale);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  // Keyboard shortcut: SPACE to pause/resume
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger if not typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPaused]);

  const togglePause = () => {
    if (isPaused) {
      universeTime.resume();
      setIsPaused(false);
    } else {
      universeTime.pause();
      setIsPaused(true);
    }
  };

  const setSpeed = (scale) => {
    if (isPaused) {
      universeTime.resume();
      setIsPaused(false);
    }
    universeTime.setTimeScale(scale);
    setCurrentScale(scale);
  };

  const getSpeedColor = () => {
    if (isPaused) return '#ff6b6b'; // Red
    if (currentScale <= 1) return '#ffffff'; // White
    if (currentScale <= 10) return '#ffd43b'; // Yellow
    return '#51cf66'; // Green
  };

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...style
      }}
    >
      {/* Pause/Resume Button */}
      <button
        onClick={togglePause}
        title={isPaused ? 'Resume (SPACE)' : 'Pause (SPACE)'}
        style={{
          background: 'rgba(0, 255, 0, 0.1)',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          color: isPaused ? '#ff6b6b' : '#00ff00',
          padding: '4px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          cursor: 'pointer',
          borderRadius: '2px',
          transition: 'all 0.2s',
          minWidth: '60px'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(0, 255, 0, 0.2)';
          e.target.style.borderColor = 'rgba(0, 255, 0, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(0, 255, 0, 0.1)';
          e.target.style.borderColor = 'rgba(0, 255, 0, 0.3)';
        }}
      >
        {isPaused ? '⏸ PAUSED' : '▶ PLAY'}
      </button>

      {/* Speed Buttons */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {TIME_SCALE_OPTIONS.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => setSpeed(value)}
            title={`${label} speed`}
            style={{
              background: currentScale === value && !isPaused 
                ? 'rgba(0, 255, 0, 0.2)' 
                : 'rgba(0, 255, 0, 0.05)',
              border: currentScale === value && !isPaused
                ? '1px solid rgba(0, 255, 0, 0.5)'
                : '1px solid rgba(0, 255, 0, 0.2)',
              color: currentScale === value && !isPaused ? '#00ff00' : '#888',
              padding: '4px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.2s',
              fontWeight: currentScale === value && !isPaused ? 'bold' : 'normal'
            }}
            onMouseEnter={(e) => {
              if (currentScale !== value || isPaused) {
                e.target.style.background = 'rgba(0, 255, 0, 0.15)';
                e.target.style.borderColor = 'rgba(0, 255, 0, 0.4)';
                e.target.style.color = '#aaa';
              }
            }}
            onMouseLeave={(e) => {
              if (currentScale !== value || isPaused) {
                e.target.style.background = 'rgba(0, 255, 0, 0.05)';
                e.target.style.borderColor = 'rgba(0, 255, 0, 0.2)';
                e.target.style.color = '#888';
              }
            }}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Current Speed Indicator */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: getSpeedColor(),
          padding: '4px 8px',
          border: `1px solid ${getSpeedColor()}33`,
          borderRadius: '2px',
          minWidth: '50px',
          textAlign: 'center',
          fontWeight: 'bold',
          transition: 'color 0.3s'
        }}
      >
        {isPaused ? '⏸' : `×${currentScale}`}
      </div>
    </div>
  );
}
