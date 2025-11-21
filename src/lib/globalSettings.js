// Global Settings Manager
// Centralized settings for dev mode, verbose logging, etc.

class GlobalSettings {
  constructor() {
    this._settings = {
      devMode: this._loadSetting('devMode', true),
      verboseLogging: this._loadSetting('verboseLogging', false)
    };
    this._listeners = new Map(); // Setting name -> Set of callbacks
  }

  _loadSetting(key, defaultValue) {
    const saved = localStorage.getItem(`globalSettings_${key}`);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  }

  _saveSetting(key, value) {
    localStorage.setItem(`globalSettings_${key}`, JSON.stringify(value));
  }

  get(key) {
    return this._settings[key];
  }

  set(key, value) {
    const oldValue = this._settings[key];
    if (oldValue === value) return;
    
    this._settings[key] = value;
    this._saveSetting(key, value);
    
    // Notify listeners
    const listeners = this._listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(value, oldValue);
        } catch (e) {
          console.error(`Error in settings listener for ${key}:`, e);
        }
      });
    }
  }

  // Subscribe to setting changes
  onChange(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this._listeners.get(key)?.delete(callback);
    };
  }

  // Convenience getters/setters
  get devMode() { return this.get('devMode'); }
  set devMode(value) { this.set('devMode', value); }
  
  get verboseLogging() { return this.get('verboseLogging'); }
  set verboseLogging(value) { this.set('verboseLogging', value); }
}

// Singleton instance
let _instance = null;

export function getGlobalSettings() {
  if (!_instance) {
    _instance = new GlobalSettings();
  }
  return _instance;
}
