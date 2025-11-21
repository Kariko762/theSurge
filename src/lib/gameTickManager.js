// Game Tick Manager: Centralized tick system for time-dependent logic

class GameTickManager {
  constructor() {
    this.tickRate = 1.0; // ticks per second
    this.tickInterval = 1000 / this.tickRate;
    this.currentTick = 0;
    this.listeners = [];
    this.timer = null;
  }

  setTickRate(rate) {
    this.tickRate = rate;
    
    // Handle pause (rate = 0)
    if (rate === 0) {
      this.stop();
      return;
    }
    
    this.tickInterval = 1000 / rate;
    if (this.timer) {
      clearInterval(this.timer);
      this.start();
    }
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.currentTick++;
      this.listeners.forEach(fn => fn(this.currentTick));
    }, this.tickInterval);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  getTickRate() {
    return this.tickRate;
  }

  getCurrentTick() {
    return this.currentTick;
  }
}

const gameTickManager = new GameTickManager();
export default gameTickManager;
