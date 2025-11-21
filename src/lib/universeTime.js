// Universe Time System
// Monotonic time progression decoupled from UI rendering.
// Provides pause, resume, time scaling (fast-forward / slow-mo) and persistence.
// Debug: window.universeTimeDebug.verbose = true (or use /verbose command)

import { getGlobalSettings } from './globalSettings.js';

class UniverseTime {
  constructor() {
    this._started = false;
    this._paused = false;
    this._startRealMs = 0;            // Real timestamp when current active span started
    this._accumulatedActiveMs = 0;    // Total scaled active milliseconds accumulated
    this._pausedAtRealMs = 0;         // Real timestamp when pause initiated
    this._timeScale = 1.0;            // Scaling factor (>1 fast-forward, <1 slow)
    this._version = 1;
    this._listeners = new Set();      // Simple event listeners ("pause","resume","scale")
    this._verbose = false;            // Debug logging toggle
    this._getTimeCallCount = 0;       // Track call frequency
    
    // Sync verbose with global settings
    const globalSettings = getGlobalSettings();
    this._verbose = globalSettings.verboseLogging;
    globalSettings.onChange('verboseLogging', (enabled) => {
      this.setVerbose(enabled);
    });
  }

  _log(...args) {
    if (this._verbose) {
      console.log('[UniverseTime]', ...args);
    }
  }

  setVerbose(enabled) {
    this._verbose = !!enabled;
    console.log(`[UniverseTime] Verbose logging ${enabled ? 'STARTED' : 'STOPPED'}`);
    if (enabled) {
      this.debugState();
    }
  }

  debugState() {
    const state = {
      started: this._started,
      paused: this._paused,
      timeScale: this._timeScale,
      currentTime: this.getTime(),
      accumulatedMs: this._accumulatedActiveMs,
      getTimeCallCount: this._getTimeCallCount,
      listeners: this._listeners.size
    };
    console.table(state);
    return state;
  }

  init() {
    if (this._started) {
      this._log('init() called but already started');
      return;
    }
    this._started = true;
    this._startRealMs = performance.now();
    this._log('INITIALIZED at real time:', this._startRealMs);
  }

  // Core time getter (seconds, float)
  getTime() {
    this._getTimeCallCount++;
    if (!this._started) {
      this._log('getTime() called before init(), returning 0');
      return 0;
    }
    let activeMs = this._accumulatedActiveMs;
    if (!this._paused) {
      const spanMs = performance.now() - this._startRealMs;
      activeMs += spanMs * this._timeScale;
    }
    const time = activeMs / 1000;
    if (this._verbose && this._getTimeCallCount % 100 === 0) {
      this._log(`getTime() #${this._getTimeCallCount}: ${time.toFixed(2)}s (paused: ${this._paused}, scale: ${this._timeScale})`);
    }
    return time;
  }

  // Pause time progression
  pause() {
    if (this._paused || !this._started) {
      this._log('pause() - already paused or not started');
      return;
    }
    // Capture scaled elapsed until now
    const now = performance.now();
    const spanMs = now - this._startRealMs;
    this._accumulatedActiveMs += spanMs * this._timeScale;
    this._pausedAtRealMs = now;
    this._paused = true;
    const time = this.getTime();
    this._log('PAUSED at universe time:', time);
    this._emit("pause", time);
  }

  // Resume progression
  resume() {
    if (!this._paused) {
      this._log('resume() - not paused');
      return;
    }
    this._paused = false;
    this._startRealMs = performance.now();
    this._pausedAtRealMs = 0;
    const time = this.getTime();
    this._log('RESUMED at universe time:', time);
    this._emit("resume", time);
  }

  // Adjust time scale; preserves continuity of accumulated time
  setTimeScale(scale) {
    if (scale <= 0) throw new Error("Time scale must be > 0");
    const oldScale = this._timeScale;
    // Capture progress under old scale
    if (!this._paused && this._started) {
      const now = performance.now();
      const spanMs = now - this._startRealMs;
      this._accumulatedActiveMs += spanMs * this._timeScale;
      this._startRealMs = now;
    }
    this._timeScale = scale;
    this._log(`TIME SCALE changed: ${oldScale} -> ${scale}`);
    this._emit("scale", { time: this.getTime(), scale });
  }

  getTimeScale() { return this._timeScale; }
  isPaused() { return this._paused; }

  // Formatting helpers (days/hours/minutes) using universe time
  formatDHMS() {
    const totalSeconds = Math.floor(this.getTime());
    const totalMinutes = Math.floor(totalSeconds / 60);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return { days, hours, minutes, seconds: totalSeconds % 60 };
  }

  formatDisplay() {
    const { days, hours, minutes, seconds } = this.formatDHMS();
    const time = this.getTime();
    if (this._verbose) {
      console.log(`[UniverseTime] formatDisplay: time=${time.toFixed(2)}s, days=${days}, hours=${hours}, minutes=${minutes}, seconds=${seconds}`);
    }
    return `DAY ${days} // ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  }

  // Persistence
  serialize() {
    return JSON.stringify({
      version: this._version,
      accumulatedActiveMs: this._paused ? this._accumulatedActiveMs : (this._accumulatedActiveMs + (performance.now() - this._startRealMs) * this._timeScale),
      paused: this._paused,
      timeScale: this._timeScale
    });
  }

  restore(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (data.version !== this._version) return false; // simple version guard
      this._accumulatedActiveMs = data.accumulatedActiveMs || 0;
      this._timeScale = data.timeScale || 1.0;
      this._started = true;
      this._paused = !!data.paused;
      this._startRealMs = performance.now();
      if (this._paused) {
        // Keep accumulated; do not advance until resume
        this._pausedAtRealMs = this._startRealMs;
      }
      return true;
    } catch (e) {
      console.error("UniverseTime restore failed", e);
      return false;
    }
  }

  // Listener management (simple, not DOM events)
  on(eventType, handler) { this._listeners.add({ eventType, handler }); return () => this._off(handler); }
  _off(handler) { this._listeners.forEach(l => { if (l.handler === handler) this._listeners.delete(l); }); }
  _emit(eventType, payload) { this._listeners.forEach(l => { if (l.eventType === eventType) { try { l.handler(payload); } catch(e){ console.error('UniverseTime listener error', e); } } }); }
}

let universeTimeInstance = null;
export function getUniverseTime() {
  if (!universeTimeInstance) {
    universeTimeInstance = new UniverseTime();
    universeTimeInstance.init();
  }
  return universeTimeInstance;
}

// Global debug API
if (typeof window !== 'undefined') {
  window.universeTimeDebug = {
    get verbose() { return getUniverseTime()._verbose; },
    set verbose(val) { getUniverseTime().setVerbose(val); },
    state: () => getUniverseTime().debugState(),
    pause: () => getUniverseTime().pause(),
    resume: () => getUniverseTime().resume(),
    setScale: (s) => getUniverseTime().setTimeScale(s),
    getTime: () => getUniverseTime().getTime()
  };
}

// Convenience for scheduling durations without the central scheduler (for quick progress math)
export function computeProgress(startTimeSeconds, durationSeconds) {
  const now = getUniverseTime().getTime();
  return Math.min(1, Math.max(0, (now - startTimeSeconds) / durationSeconds));
}

// React-friendly hook (minimal re-render policy) - optional usage
// Uses a passive interval; should be used sparingly for display elements.
export function createUniverseTimeSubscription(callback, intervalMs = 500) {
  const ut = getUniverseTime();
  let cancelled = false;
  function tick() {
    if (cancelled) return;
    callback(ut.getTime());
  }
  const handle = setInterval(tick, intervalMs);
  tick(); // initial
  return () => { cancelled = true; clearInterval(handle); };
}
