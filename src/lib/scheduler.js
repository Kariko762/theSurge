// Universal Event Scheduler
// Low-frequency wake loop (default 10Hz) that evaluates pending events against universe time.
// Scales to thousands of events using a min-heap priority queue keyed on triggerAt.

import { getUniverseTime } from './universeTime.js';
import { getGlobalSettings } from './globalSettings.js';

let _idCounter = 0;
function nextId() { return `evt_${Date.now()}_${_idCounter++}`; }

class MinHeap {
  constructor() { this._arr = []; }
  _parent(i){ return ((i - 1) >> 1); }
  _left(i){ return (i << 1) + 1; }
  _right(i){ return (i << 1) + 2; }
  _swap(i,j){ const a=this._arr; [a[i],a[j]]=[a[j],a[i]]; }
  _bubbleUp(i){ while(i>0){ const p=this._parent(i); if(this._arr[p].triggerAt <= this._arr[i].triggerAt) break; this._swap(p,i); i=p; } }
  _bubbleDown(i){ const n=this._arr.length; while(true){ const l=this._left(i); const r=this._right(i); let m=i; if(l<n && this._arr[l].triggerAt < this._arr[m].triggerAt) m=l; if(r<n && this._arr[r].triggerAt < this._arr[m].triggerAt) m=r; if(m===i) break; this._swap(i,m); i=m; } }
  push(item){ this._arr.push(item); this._bubbleUp(this._arr.length-1); }
  peek(){ return this._arr.length? this._arr[0] : null; }
  pop(){ if(!this._arr.length) return null; const root=this._arr[0]; const last=this._arr.pop(); if(this._arr.length){ this._arr[0]=last; this._bubbleDown(0); } return root; }
  remove(predicate){ // inefficient linear removal; used rarely (cancels)
    for(let i=this._arr.length-1;i>=0;i--){ if(predicate(this._arr[i])){ this._arr.splice(i,1); }
    }
    // Rebuild heap after bulk removal
    if(this._arr.length) {
      const items = this._arr.slice();
      this._arr = [];
      items.forEach(it => this.push(it));
    }
  }
  size(){ return this._arr.length; }
  toArray(){ return this._arr.slice(); }
}

class Scheduler {
  constructor({ frequencyHz = 10, maxBatch = 100 } = {}) {
    this._heap = new MinHeap();
    this._eventsById = new Map();
    this._listeners = new Map(); // eventType -> Set(handlers)
    this._frequencyHz = frequencyHz;
    this._intervalMs = 1000 / frequencyHz;
    this._loopHandle = null;
    this._running = false;
    this._maxBatch = maxBatch;
    this._version = 1;
    this._featureFlag = true; // allow disabling during migration
    this._verbose = false;
    this._wakeCount = 0;
    this._totalEventsTriggered = 0;
    
    // Sync verbose with global settings
    const globalSettings = getGlobalSettings();
    this._verbose = globalSettings.verboseLogging;
    globalSettings.onChange('verboseLogging', (enabled) => {
      this.setVerbose(enabled);
    });
  }

  _log(...args) {
    if (this._verbose) {
      console.log('[Scheduler]', ...args);
    }
  }

  setVerbose(enabled) {
    this._verbose = !!enabled;
    console.log(`[Scheduler] Verbose logging ${enabled ? 'STARTED' : 'STOPPED'}`);
    if (enabled) {
      this.debugState();
    }
  }

  debugState() {
    const ut = getUniverseTime();
    const state = {
      running: this._running,
      featureFlag: this._featureFlag,
      frequencyHz: this._frequencyHz,
      pendingEvents: this._heap.size(),
      wakeCount: this._wakeCount,
      totalTriggered: this._totalEventsTriggered,
      currentTime: ut.getTime(),
      listenerTypes: Array.from(this._listeners.keys())
    };
    console.table(state);
    if (this._heap.size() > 0) {
      const upcoming = this._heap.toArray().slice(0, 5);
      console.log('Next 5 events:', upcoming);
    }
    return state;
  }

  start() {
    if (this._running) {
      this._log('start() called but already running');
      return;
    }
    this._running = true;
    this._loopHandle = setInterval(() => this._wake(), this._intervalMs);
    this._log(`STARTED scheduler loop at ${this._frequencyHz}Hz (${this._intervalMs}ms interval)`);
  }

  stop() {
    if (!this._running) {
      this._log('stop() called but not running');
      return;
    }
    clearInterval(this._loopHandle);
    this._loopHandle = null;
    this._running = false;
    this._log('STOPPED scheduler loop');
  }

  enable(flag=true){ 
    const old = this._featureFlag;
    this._featureFlag = flag; 
    this._log(`Feature flag: ${old} -> ${flag}`);
  }

  on(eventType, handler) {
    if (!this._listeners.has(eventType)) this._listeners.set(eventType, new Set());
    this._listeners.get(eventType).add(handler);
    return () => { this._listeners.get(eventType)?.delete(handler); };
  }

  _emit(eventType, payload) {
    const handlers = this._listeners.get(eventType);
    if (!handlers || !handlers.size) return;
    handlers.forEach(h => { try { h(payload); } catch(e){ console.error('Scheduler handler error', e); } });
  }

  schedule(eventType, delaySeconds, payload = {}) {
    const ut = getUniverseTime();
    const now = ut.getTime();
    const triggerAt = now + delaySeconds;
    this._log(`schedule(${eventType}) in ${delaySeconds}s -> trigger at ${triggerAt.toFixed(2)}`);
    return this.at(eventType, triggerAt, payload);
  }

  at(eventType, triggerAt, payload = {}) {
    if (triggerAt < 0) throw new Error('triggerAt must be >= 0');
    const ut = getUniverseTime();
    const scheduledAt = ut.getTime();
    const evt = {
      id: nextId(),
      eventType,
      scheduledAt,
      triggerAt,
      payload,
      status: 'pending'
    };
    this._heap.push(evt);
    this._eventsById.set(evt.id, evt);
    this._log(`at(${eventType}) scheduled for ${triggerAt.toFixed(2)} (now: ${scheduledAt.toFixed(2)}) id: ${evt.id}`);
    return evt.id;
  }

  cancel(id) {
    const evt = this._eventsById.get(id);
    if (!evt) {
      this._log(`cancel(${id}) - event not found`);
      return false;
    }
    evt.status = 'cancelled';
    this._eventsById.delete(id);
    // Remove from heap lazily by predicate
    this._heap.remove(e => e.id === id);
    this._log(`CANCELLED event ${id} (${evt.eventType})`);
    return true;
  }

  reschedule(id, newTriggerAt) {
    const evt = this._eventsById.get(id);
    if (!evt || evt.status !== 'pending') return false;
    // Remove and re-add with new triggerAt
    this._heap.remove(e => e.id === id);
    evt.triggerAt = newTriggerAt;
    this._heap.push(evt);
    return true;
  }

  pendingCount() { return this._heap.size(); }

  _wake() {
    this._wakeCount++;
    if (!this._featureFlag) {
      if (this._verbose && this._wakeCount % 100 === 0) {
        this._log(`wake #${this._wakeCount} - feature flag disabled`);
      }
      return; // disabled
    }
    const ut = getUniverseTime();
    const now = ut.getTime();
    const pendingBefore = this._heap.size();
    
    // Process due events up to maxBatch
    let processed = 0;
    while (processed < this._maxBatch) {
      const peek = this._heap.peek();
      if (!peek) break;
      if (peek.triggerAt > now) break;
      const evt = this._heap.pop();
      if (evt.status === 'pending') {
        evt.status = 'triggered';
        this._eventsById.delete(evt.id);
        this._totalEventsTriggered++;
        this._log(`TRIGGER ${evt.eventType} (scheduled: ${evt.scheduledAt.toFixed(2)}, trigger: ${evt.triggerAt.toFixed(2)}, now: ${now.toFixed(2)})`);
        this._emit(evt.eventType, evt);
      }
      processed++;
    }
    
    if (this._verbose && (processed > 0 || this._wakeCount % 100 === 0)) {
      this._log(`wake #${this._wakeCount} at ${now.toFixed(2)}s: processed ${processed}/${pendingBefore}, remaining: ${this._heap.size()}`);
    }
  }

  // Persistence (only pending future events)
  serialize() {
    const pending = this._heap.toArray().filter(e => e.status === 'pending');
    return JSON.stringify({
      version: this._version,
      events: pending.map(e => ({
        id: e.id,
        eventType: e.eventType,
        scheduledAt: e.scheduledAt,
        triggerAt: e.triggerAt,
        payload: e.payload,
        status: e.status
      }))
    });
  }

  restore(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (data.version !== this._version) return false;
      this._heap = new MinHeap();
      this._eventsById.clear();
      (data.events || []).forEach(e => {
        if (e.status === 'pending') {
          const evt = { ...e };
          this._heap.push(evt);
          this._eventsById.set(evt.id, evt);
        }
      });
      return true;
    } catch (e) {
      console.error('Scheduler restore failed', e);
      return false;
    }
  }
}

let schedulerInstance = null;
export function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new Scheduler();
    schedulerInstance.start();
  }
  return schedulerInstance;
}

// Global debug API
if (typeof window !== 'undefined') {
  window.schedulerDebug = {
    get verbose() { return getScheduler()._verbose; },
    set verbose(val) { getScheduler().setVerbose(val); },
    state: () => getScheduler().debugState(),
    pending: () => getScheduler().pendingCount(),
    schedule: (type, delay) => getScheduler().schedule(type, delay),
    enable: (flag) => getScheduler().enable(flag),
    stop: () => getScheduler().stop(),
    start: () => getScheduler().start()
  };
}

// Helper for task progress (mirrors event scheduling pattern)
export function computeTaskProgress(startTime, durationSeconds) {
  const ut = getUniverseTime();
  const now = ut.getTime();
  return Math.min(1, Math.max(0, (now - startTime) / durationSeconds));
}

// Example event types enumeration (extend as needed)
export const EventTypes = Object.freeze({
  SCAN_COMPLETE: 'scan_complete',
  MINING_COMPLETE: 'mining_complete',
  TRAVEL_ARRIVAL: 'travel_arrival',
  AI_TASK_COMPLETE: 'ai_task_complete',
  WAKE_DECAY: 'wake_decay'
});
