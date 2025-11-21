# Universe Time & Scheduler Debug Guide

## Quick Start

Open your browser console (F12) and type:

```javascript
runDebugCommand('/verbose')
```

This enables detailed logging for all time systems.

## Available Commands

### Debug Mode
- `/verbose` or `/debug` - Enable verbose logging
- `/quiet` or `/silent` - Disable verbose logging

### Time Control
- `/pause` - Pause universe time
- `/resume` - Resume universe time
- `/speed <multiplier>` - Change time scale (e.g., `/speed 2` for 2x speed)

### Status
- `/time` or `/status` - Show universe time status
- `/scheduler` - Show scheduler status and pending events

### Testing
- `/test [seconds]` - Schedule a test event (default 5 seconds)

### Help
- `/help` or `/?` - Show command list

## Direct API Access

### Universe Time Debug
```javascript
// Enable verbose logging
window.universeTimeDebug.verbose = true;

// Show current state
window.universeTimeDebug.state();

// Control time
window.universeTimeDebug.pause();
window.universeTimeDebug.resume();
window.universeTimeDebug.setScale(2); // 2x speed

// Get current time
window.universeTimeDebug.getTime(); // returns seconds as float
```

### Scheduler Debug
```javascript
// Enable verbose logging
window.schedulerDebug.verbose = true;

// Show scheduler state
window.schedulerDebug.state();

// Check pending events
window.schedulerDebug.pending();

// Schedule test event
window.schedulerDebug.schedule('test_event', 5); // 5 seconds from now

// Control scheduler
window.schedulerDebug.stop();
window.schedulerDebug.start();
window.schedulerDebug.enable(false); // disable feature flag
```

### Time Adapter Debug
```javascript
// Enable verbose logging
window.timeAdapterDebug.verbose = true;

// Get current game time
window.timeAdapterDebug.getGameTime();

// Get formatted time
window.timeAdapterDebug.formatGameTime();
```

## Convenient Shortcuts

```javascript
// Quick access via timeDebug object
timeDebug.verbose();     // Enable verbose mode
timeDebug.quiet();       // Disable verbose mode
timeDebug.status();      // Show status
timeDebug.pause();       // Pause time
timeDebug.resume();      // Resume time
timeDebug.speed(10);     // 10x speed
timeDebug.test(3);       // Test with 3s delay
timeDebug.help();        // Show help
```

## Troubleshooting

### Time Not Moving Forward

1. **Check if time is paused:**
   ```javascript
   window.universeTimeDebug.state();
   // Look for: paused: true
   ```

2. **Check time scale:**
   ```javascript
   window.universeTimeDebug.state();
   // Look for: timeScale: should be > 0
   ```

3. **Enable verbose logging:**
   ```javascript
   runDebugCommand('/verbose');
   ```
   
4. **Monitor getTime calls:**
   - Verbose mode logs every 100th call to `getTime()`
   - If you see these logs, time system is working

### Scheduler Not Triggering Events

1. **Check if scheduler is running:**
   ```javascript
   window.schedulerDebug.state();
   // Look for: running: true
   ```

2. **Check feature flag:**
   ```javascript
   window.schedulerDebug.state();
   // Look for: featureFlag: true
   ```

3. **Check pending events:**
   ```javascript
   window.schedulerDebug.state();
   // Look at: pendingEvents count and "Next 5 events" list
   ```

4. **Test scheduler:**
   ```javascript
   runDebugCommand('/test 2');
   // Should see event trigger after 2 seconds
   ```

### Clock Display Not Updating

1. **Check TimeAdapter sync:**
   ```javascript
   window.timeAdapterDebug.verbose = true;
   // Should see sync messages every 5 seconds
   ```

2. **Check current time:**
   ```javascript
   window.timeAdapterDebug.formatGameTime();
   // Should return formatted time string
   ```

## Example Debug Session

```javascript
// 1. Enable verbose mode
runDebugCommand('/verbose');

// 2. Check current status
runDebugCommand('/status');

// 3. Speed up time for testing
runDebugCommand('/speed 10');

// 4. Schedule a test event
runDebugCommand('/test 5');

// 5. Watch console for:
//    - [UniverseTime] getTime() calls
//    - [Scheduler] wake cycles
//    - [Scheduler] TRIGGER test_event
//    - [TimeAdapter] sync messages

// 6. When done testing
runDebugCommand('/quiet');
runDebugCommand('/speed 1');
```

## Verbose Logging Output

### UniverseTime Logs
```
[UniverseTime] INITIALIZED at real time: 1234567.89
[UniverseTime] getTime() #100: 10.23s (paused: false, scale: 1)
[UniverseTime] TIME SCALE changed: 1 -> 2
[UniverseTime] PAUSED at universe time: 15.45
```

### Scheduler Logs
```
[Scheduler] STARTED scheduler loop at 10Hz (100ms interval)
[Scheduler] schedule(scan_complete) in 30s -> trigger at 45.67
[Scheduler] wake #100 at 10.50s: processed 0/5, remaining: 5
[Scheduler] TRIGGER scan_complete (scheduled: 15.67, trigger: 45.67, now: 45.68)
```

### TimeAdapter Logs
```
[TimeAdapter] STARTING sync to shipState every 5s
[TimeAdapter] Synced tick 15 to shipState (#3)
```

## Performance Notes

- Verbose mode adds minimal overhead
- getTime() logs throttled to every 100th call
- Scheduler wake logs throttled to every 100th wake (unless events processed)
- Safe to leave verbose mode on during normal gameplay for debugging
- Disable with `/quiet` when not needed
