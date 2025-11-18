/**
 * Game Time System
 * Tick-based time that only progresses when game is active
 * 1 tick = 1 real-world second = 10 in-game minutes (configurable)
 */

class GameTime {
  constructor() {
    this.totalTicks = 0;           // Total game ticks since start
    this.lastTickTime = Date.now(); // Real-world timestamp of last tick
    this.tickInterval = null;       // Interval ID for tick updates
    this.isPaused = false;
    this.tickRate = 1000;           // 1 tick per second (real-time)
    this.timeMultiplier = 10;       // 1 tick = 10 in-game minutes
    this.listeners = new Set();     // Components that need tick updates
  }

  // Start the game clock
  start() {
    if (this.tickInterval) return;
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => this.tick(), this.tickRate);
  }

  // Stop the game clock (when game closes/pauses)
  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  // Pause/Resume
  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  // Process one tick
  tick() {
    if (this.isPaused) return;
    
    this.totalTicks++;
    this.notifyListeners();
    
    // Auto-save periodically (every 10 ticks)
    if (this.totalTicks % 10 === 0) {
      this.save();
    }
  }

  // Convert ticks to in-game time
  getGameTime() {
    const totalMinutes = this.totalTicks * this.timeMultiplier;
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    
    return { days, hours, minutes, totalMinutes, totalTicks: this.totalTicks };
  }

  // Format for display (terminal style)
  formatGameTime() {
    const { days, hours, minutes } = this.getGameTime();
    return `DAY ${days} // ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Compact format for logs
  formatCompact() {
    const { days, hours, minutes } = this.getGameTime();
    return `[D${days} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}]`;
  }

  // Calculate ticks required for a duration in game minutes
  minutesToTicks(gameMinutes) {
    return Math.ceil(gameMinutes / this.timeMultiplier);
  }

  // Calculate game minutes from ticks
  ticksToMinutes(ticks) {
    return ticks * this.timeMultiplier;
  }

  // Subscribe to tick updates (for research, crafting, movement, etc.)
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback); // Unsubscribe function
  }

  // Notify all subscribers
  notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.totalTicks);
      } catch (err) {
        console.error('Game time listener error:', err);
      }
    });
  }

  // Save to localStorage (ship state will also save this)
  save() {
    try {
      localStorage.setItem('gameTime', JSON.stringify({
        totalTicks: this.totalTicks,
        lastSaved: Date.now()
      }));
    } catch (err) {
      console.error('Failed to save game time:', err);
    }
  }

  // Load from localStorage
  load() {
    try {
      const saved = localStorage.getItem('gameTime');
      if (saved) {
        const data = JSON.parse(saved);
        this.totalTicks = data.totalTicks || 0;
      }
    } catch (err) {
      console.error('Failed to load game time:', err);
    }
  }

  // Reset (for new game)
  reset() {
    this.totalTicks = 0;
    this.save();
  }

  // Get current tick count
  getCurrentTick() {
    return this.totalTicks;
  }
}

// Singleton instance
let gameTimeInstance = null;

export const getGameTime = () => {
  if (!gameTimeInstance) {
    gameTimeInstance = new GameTime();
    gameTimeInstance.load();
    gameTimeInstance.start(); // Auto-start on first access
  }
  return gameTimeInstance;
};

// Utility for calculating time-based tasks
export const createTask = (durationInGameMinutes, onComplete, onProgress) => {
  const gameTime = getGameTime();
  const startTick = gameTime.getCurrentTick();
  const ticksRequired = gameTime.minutesToTicks(durationInGameMinutes);
  const endTick = startTick + ticksRequired;

  const unsubscribe = gameTime.subscribe((currentTick) => {
    if (currentTick >= endTick) {
      if (onComplete) onComplete();
      unsubscribe();
    } else if (onProgress) {
      const progress = (currentTick - startTick) / ticksRequired;
      onProgress(progress);
    }
  });

  return {
    startTick,
    endTick,
    ticksRequired,
    cancel: unsubscribe
  };
};
