# Migration: Tick System -> Universe Time + Scheduler

## Goals
- Remove per-second/global tick UI updates (scroll/animation disruption)
- Introduce monotonic, pausable, scalable universe time
- Event-driven gameplay via scheduler (10Hz wake; batch triggers)
- Support thousands of pending time-based gameplay events
- Provide fast-forward / slow-motion using time scale

## Components
1. `universeTime.js` – authoritative time source (seconds float)
2. `scheduler.js` – min-heap priority queue of events `{id, eventType, scheduledAt, triggerAt, payload, status}`
3. Progress helpers: `computeProgress(start, duration)` and UI derivation hooks
4. Feature flag: `scheduler.enable(flag)` for staged rollout

## Performance Strategy
- Wake frequency: 10Hz (100ms). Target CPU budget < 4ms per wake.
- Data structure: Min-heap ensures O(log n) insertion/removal.
- Batch size: `_maxBatch = 100` per wake; prevents long blocking.
- Stress target: 10,000 pending events -> insertion < 250ms total, wake processing < 1ms typical when few due.
- Avoid per-event intervals; single loop + heap peek.
- Lazy mechanics (wake decay, resource regen) computed from timestamps instead of scheduling thousands of small repeating events.

## Event Types (Initial)
- `scan_complete`
- `mining_complete`
- `travel_arrival`
- `ai_task_complete`
- `wake_decay` (optional if using explicit events vs lazy calc)

## Mapping Existing Systems
| System | Legacy Mechanism | New Representation |
|--------|------------------|--------------------|
| System Scan | activeScan.progress increments via tick | Schedule scan_complete event; UI progress from timestamps |
| Mining Operation | Not formalized | Schedule mining_complete; yield on trigger; progress derived |
| Travel / Route | Not implemented | travel_start: schedule arrival; each leg event triggers chain |
| Wake Decay | Manual per tick suggestion | Lazy compute: `currentWake = base - floor((now - lastUpdate)/interval)*decay` OR schedule periodic decay events |
| AI Tasks / Crafting | Not implemented | Single schedule per task; payload holds recipe/task id |
| Asteroid Regen | Manual idea | Lazy compute from `lastMined` + regenRate; schedule milestone only for full restore UI message |

## UI Integration Approach
- Replace tick subscribers with a lightweight hook using 500ms or event-based state changes.
- Progress bars: `progress = clamp((universeTime - startTime) / duration)`; re-render triggered by a small passive interval or event completion.
- Remove direct time formatting calls to `getGameTime()`; use `getUniverseTime().formatDisplay()` instead.
- For highly dynamic animations: keep `requestAnimationFrame` isolated (not tied to universe time loop).

## Migration Sequencing
1. Introduce new modules (DONE). Keep old tick system running.
2. Wrap scan logic: when initiating scan, create event; remove tick-based progress mutation.
3. Migrate mining (define operation start/duration/outcome handler).
4. Implement travel scheduling + simple arrival handler.
5. Replace wake decay with lazy calculation; optionally schedule threshold events.
6. Update UI components (`ShipCommandConsole.jsx`, `RightPanelTabs.jsx`, others) to derive progress/time.
7. Remove unused `gameTickManager` references.
8. Deprecate `gameTime.js` (transition tasks using `createTask` to scheduler events).
9. Delete legacy files and update docs.

### Detailed Phase Actions
| Phase | Action | Acceptance |
|-------|--------|------------|
| A | Implement adapter `timeAdapter.js` exporting old `getGameTime()` facade backed by universe time | All existing imports return consistent formatted time |
| B | Scan migration | Scan start sets `{start, duration, triggerAt}`; progress purely derived | No manual progress mutation; event fires completion handler |
| C | Mining migration | Mining UI launches event; yield produced only on trigger | Progress bar stable; no frequent re-renders |
| D | Travel/Route | Each leg schedules arrival; chaining schedules next leg | Route ETA appears; arrival events logged |
| E | Wake decay | Replace interval logic with lazy formula or periodic milestone | Wake value stable; no per-second diff spam |
| F | Remove `gameTickManager` usage | No imports remain; tests green | Legacy file flagged for deletion |
| G | Remove `gameTime.js` | All tasks use scheduler or universe time | Backward facade removed |
| H | Docs update & cleanup | README & design docs reflect new system | No "tick" terminology remains |

## System Mapping (Fields & Event Types)
| System | Start Fields | Duration Source | Event Type | Payload Suggestions |
|--------|--------------|-----------------|------------|--------------------|
| Scan | `scan.startTime` | Fixed constant (e.g. 5s) or dynamic by sensors | `scan_complete` | `{systemId}` |
| Mining | `mining.startTime` | Tool efficiency / asteroid hardness | `mining_complete` | `{clusterId, toolId}` |
| Travel (Leg) | `leg.startTime` | Distance / drive speed / scale | `travel_arrival` | `{from,to,legIndex}` |
| AI Task | `task.startTime` | Task definition (crafting, research) | `ai_task_complete` | `{taskId}` |
| Wake Decay (Optional) | Last update timestamp | Decay interval constant | (lazy or `wake_decay`) | `{previousWake}` |
| Asteroid Regen (Milestone) | `cluster.lastMined` | Regen formula | (milestone event optional) | `{clusterId}` |

## UI Integration Plan
1. Introduce `useUniverseTimeProgress(start, duration, refreshMs=500)` hook computing derived progress without subscribing to per-second ticks.
2. Replace existing progress state mutations in scan/mining components with hook usage.
3. Clock display: update every 1000ms via passive interval; animations use CSS/RAF independent of universe time.
4. Event completion triggers local state update (e.g. push log entry) causing minimal re-render.
5. Remove any `setState` loops tied to tick increments.

### Hook Sketch
```js
function useUniverseTimeProgress(start, duration, refreshMs=500) {
	const [now, setNow] = useState(getUniverseTime().getTime());
	useEffect(() => {
		const handle = setInterval(() => setNow(getUniverseTime().getTime()), refreshMs);
		return () => clearInterval(handle);
	}, [refreshMs]);
	const progress = Math.min(1, Math.max(0, (now - start) / duration));
	return progress;
}
```

## Persistence Plan
Storage Key: `universe_state_v1`
Structure:
```json
{
	"version": 1,
	"universeTime": "{serialized from universeTime.serialize()}",
	"scheduler": "{serialized from scheduler.serialize()}",
	"migrated": true
}
```
Save Triggers:
- On event schedule/cancel
- Interval every 30s
- Before page unload (visibilitychange)

Restore Flow:
1. Parse blob; restore universe time.
2. Restore scheduler events.
3. Immediately fire due events (scheduler wake cycle handles).
4. Validate version; if mismatch perform safe fallback (drop events, keep time).

## Failure & Edge Case Handling (Expanded)
| Edge | Strategy |
|------|----------|
| Massive backlog | Adaptive batch: raise `_maxBatch` using min(max, dueCount * factor) capped by time budget |
| Long tab sleep | On resume, one wake processes due events; if > `_maxBatch`, adaptive spill-over |
| TimeScale change mid-task | Progress re-computation unaffected (absolute times) |
| Pause during near-due event | Event triggers only after resume (acceptable) |
| Serialization error | Log, ignore events, reinitialize empty scheduler |
| Corrupted payload | Discard event with warning, continue |
| Duplicate schedule (same task) | Caller maintains id; can cancel old before scheduling new |
| High-frequency UI progress | Use CSS transitions; avoid intervals < 250ms except critical animations |

## Adaptive Scheduler (Planned Improvement)
Pseudo:
```js
_wake(){
	const now = ut.getTime();
	let dueCount = 0;
	while(heap.peek()?.triggerAt <= now) { dueCount++; temp.push(heap.pop()); }
	// Reinsert non-due? (Already popped only due ones)
	const batchLimit = Math.min(this._maxBatch, Math.ceil(dueCount * 1.2));
	const start = performance.now();
	for (let i=0;i<temp.length;i++) {
		if (i >= batchLimit) { // spill
			// put remaining back
			for (let j=i;j<temp.length;j++) heap.push(temp[j]);
			break;
		}
		emit(temp[i]);
		if (performance.now() - start > 4) break; // time budget
	}
}
```

## Cutover Checklist (Expanded)
1. Implement scan via scheduler
2. Migrate mining
3. Travel system events
4. Replace wake decay logic
5. Update UI hooks
6. Add persistence wrapper
7. Adaptive scheduler if performance requires
8. Remove legacy tick imports
9. Delete legacy files & update docs
10. Final regression test & stress test

## Risk Mitigation (Expanded)
| Risk | Mitigation |
|------|------------|
| Hidden dependency on tick state | Introduce adapter that logs any use after migration phase |
| Performance regression on low-end devices | Lower wake frequency to 5Hz, rely more on lazy computations |
| Incomplete event firing after restore | Explicit immediate wake after restore |
| Data version drift | Version bump & migration script to translate fields |

---
## KEY TECHNICAL DECISIONS (Updated from Requirements)

### 1. **PUSH → PULL Model Transformation**
**Problem:** Current tick system PUSHES updates to UI every second, causing:
- Forced re-renders every tick
- Scroll position resets
- Animation restarts
- Performance degradation

**Solution:** PULL-based timing where:
- UI reads `start_time`, `trigger_at` timestamps when rendering
- Progress calculated on-demand: `progress = (universe_time - start_time) / duration`
- UI re-renders ONLY when task state actually changes (started/completed/failed)
- No per-second state mutations

### 2. **Universe Time: Single Source of Truth**
- Global monotonic clock in seconds (float)
- Advanced by real-time deltas using `performance.now()` - NOT tied to React lifecycle
- Completely decoupled from UI rendering
- Pausable, scalable (fast-forward/slow-mo)
- Never triggers UI updates directly

### 3. **Scheduler: Event-Driven State Changes**
- Low-frequency wake (10Hz / 100ms) checks `trigger_at` against `universe_time`
- Only fires events when `universe_time >= trigger_at`
- Min-heap ensures O(log n) scalability for thousands of timers
- Batch processing (max 100 events/wake) prevents frame blocking
- Events carry payload; handlers update game state (which may trigger UI re-render)

### 4. **Lazy Computation for Continuous Systems**
**NOT scheduled as events:**
- Wake decay: `currentWake = base - floor((universe_time - lastUpdate) / decayInterval) * decayRate`
- Asteroid regeneration: `recovered = min(max, current + floor((universe_time - lastMined) / regenRate))`
- Radiation accumulation: computed from position + time delta

**Rationale:** Avoids scheduling thousands of micro-events; values calculated on-read

### 5. **UI Integration: Timestamp-Driven Rendering**
- Components receive `{startTime, duration, triggerAt}` as props/state
- Progress bars use derived calculation in render (NO setInterval state mutation)
- Optional passive refresh hook at 500ms for smooth visual updates (non-blocking)
- Event completion handler sets new state → single targeted re-render
- Clock display updates 1Hz via passive interval (independent of game time)

### 6. **Separation of Concerns**
```
[Universe Time] ← Real-time deltas (performance.now)
       ↓
[Scheduler] ← 10Hz wake loop checks trigger_at
       ↓
[Event Handlers] ← Update game state (shipState, inventory, etc.)
       ↓
[React State] ← Triggers re-render ONLY on state change
       ↓
[UI Components] ← PULL timestamps, calculate progress on render
```

### 7. **Scalability Target**
- Support 1,000+ concurrent timers without performance degradation
- Insertion: O(log n) via min-heap
- Wake processing: O(k log n) where k = events due (typically << total)
- UI impact: Zero per-second renders; event-triggered only

### 8. **Persistence Strategy**
- Auto-save every 30s + visibilitychange
- Store: `{version, universeTime, schedulerEvents}`
- Restore: Rehydrate time → load events → immediate wake fires overdue events
- Version guard for safe schema evolution

### 9. **Adaptive Performance**
- If backlog detected (>100 due): increase batch dynamically or use time budget (4ms/wake)
- Low-end devices: reduce wake frequency to 5Hz, increase lazy computation usage
- Logging in dev mode: events/wake, wake duration, backlog warnings

### 10. **Migration Safety**
- Feature flag: `scheduler.enable(flag)` for A/B testing
- Adapter layer provides backward-compatible `getGameTime()` during transition
- Parallel operation (old tick + new scheduler) until all systems migrated
- Emergency rollback path preserved

---
## Pending Implementation Tasks (Next)
- Implement scan migration (Phase B)
- Create persistence module
- Add adaptive scheduler logic (only if backlog seen in real gameplay)
- Begin UI hook replacement


## Data Persistence Plan
- Store JSON: `{ universeTimeSerialized, schedulerSerialized }` in localStorage on interval (e.g. every 30s or on event add).
- On load: restore universe time; load events; immediately trigger any past-due events.
- Use `version` field for compatibility; if mismatch, discard events gracefully.

## Failure & Edge Cases
| Case | Handling |
|------|----------|
| Tab sleep / system suspend | Large delta -> many events due; scheduler fires them in one wake batch |
| Missed trigger (triggerAt < now) | Fired immediately on wake |
| Clock drift | Use `performance.now()` (monotonic) not Date for active span; store scaled accumulated ms |
| Negative duration / trigger | Validate and throw early |
| Massive backlog (thousands due at once) | Process up to `_maxBatch`; remaining fire next wake; log warning |
| Time scale change during pending events | Trigger times are absolute universe seconds; unaffected (fast-forward reduces wait) |
| Pause state | Universe time frozen; scheduler sees `now` constant; no events fire until resume |

## Cutover Checklist
- Replace all imports of `gameTickManager` and `getGameTime()`.
- Remove `gameTickManager.js` & `gameTime.js` after verification.
- Update README time references to "Universe Time".
- Ensure no component relies on per-second state for progress.
- Validate localStorage save/restore.
- Stress test 10k events.
- Remove feature flag or set permanently enabled.

## Risk Mitigation
- Feature flag toggle for scheduler enable/disable.
- Keep legacy tick for 1–2 versions behind a guarded code path.
- Logging counters: events processed per wake, duration of wake loop.
- Emergency rollback: restore legacy tick by re-enabling `gameTickManager.start()` call without UI disruption.

## Performance Benchmark Targets
| Operation | Target |
|-----------|--------|
| Insert 10k events | < 250ms total |
| Single wake (0 due) | < 0.2ms |
| Single wake (100 due) | < 4ms |
| Serialization (10k events) | < 120ms |

## Next Implementation Steps
1. Add stress test harness.
2. Integrate scan scheduling.
3. Implement persistence wrapper.
4. Provide adapter for old `createTask` users.
5. Remove legacy tick after all migrated.

---
