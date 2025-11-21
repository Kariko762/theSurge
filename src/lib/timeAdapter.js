// Time Adapter - Backward compatibility facade
// Provides legacy getGameTime() API backed by new universeTime system
// Allows gradual migration without breaking existing code

import { getUniverseTime } from './universeTime.js';
import { getShipState } from './shipState.js';

class TimeAdapter {
  constructor() {
    this._universeTime = getUniverseTime();
    this._syncInterval = null;
    this._lastSyncedTick = 0;
    this._verbose = false;
    this._syncCount = 0;
  }

  _log(...args) {
    if (this._verbose) {
      console.log('[TimeAdapter]', ...args);
    }
  }

  setVerbose(enabled) {
    this._verbose = !!enabled;
    this._log('Verbose logging', enabled ? 'ENABLED' : 'DISABLED');
  }

  // Start syncing universe time to shipState.gameTime
  startSync() {
    if (this._syncInterval) {
      this._log('startSync() called but already syncing');
      return;
    }
    this._log('STARTING sync to shipState every 5s');
    // Sync every 5 seconds (low frequency)
    this._syncInterval = setInterval(() => {
      const shipState = getShipState();
      const currentTick = Math.floor(this._universeTime.getTime());
      if (currentTick !== this._lastSyncedTick) {
        shipState.setGameTime(currentTick);
        this._lastSyncedTick = currentTick;
        this._syncCount++;
        this._log(`Synced tick ${currentTick} to shipState (#${this._syncCount})`);
      }
    }, 5000);
  }

  stopSync() {
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
      this._log('STOPPED sync to shipState');
    }
  }

  // Legacy API compatibility
  getGameTime() {
    const { days, hours, minutes } = this._universeTime.formatDHMS();
    const result = { days, hours, minutes, totalMinutes: days * 1440 + hours * 60 + minutes, totalTicks: Math.floor(this._universeTime.getTime()) };
    if (this._verbose && this._syncCount % 10 === 0) {
      this._log('getGameTime():', result);
    }
    return result;
  }

  formatGameTime() {
    return this._universeTime.formatDisplay();
  }

  formatCompact() {
    const { days, hours, minutes } = this._universeTime.formatDHMS();
    return `[D${days} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}]`;
  }

  getCurrentTick() {
    return Math.floor(this._universeTime.getTime());
  }

  // Delegate to universe time
  pause() { this._universeTime.pause(); }
  resume() { this._universeTime.resume(); }
  setTimeScale(scale) { this._universeTime.setTimeScale(scale); }
  getTimeScale() { return this._universeTime.getTimeScale(); }
  isPaused() { return this._universeTime.isPaused(); }

  // Subscribe with passive interval (for UI components that need periodic updates)
  subscribe(callback, intervalMs = 1000) {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      callback(this.getCurrentTick());
    };
    const handle = setInterval(tick, intervalMs);
    tick(); // initial call
    return () => { cancelled = true; clearInterval(handle); };
  }
}

let adapterInstance = null;
export function getGameTime() {
  if (!adapterInstance) {
    adapterInstance = new TimeAdapter();
    adapterInstance.startSync();
  }
  return adapterInstance;
}

// Global debug API
if (typeof window !== 'undefined') {
  window.timeAdapterDebug = {
    get verbose() { return getGameTime()._verbose; },
    set verbose(val) { getGameTime().setVerbose(val); },
    getGameTime: () => getGameTime().getGameTime(),
    formatGameTime: () => getGameTime().formatGameTime()
  };
}

// Convenience exports
export { getUniverseTime } from './universeTime.js';
