// Debug Commands System
// Provides console commands for debugging the universe time and scheduler systems
// Usage in browser console: runDebugCommand('/verbose')

export function runDebugCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case '/verbose':
    case '/debug':
      enableVerboseMode();
      return 'Verbose debug logging enabled for all time systems';

    case '/quiet':
    case '/silent':
      disableVerboseMode();
      return 'Verbose debug logging disabled';

    case '/time':
    case '/status':
      return showTimeStatus();

    case '/pause':
      window.universeTimeDebug?.pause();
      return 'Universe time PAUSED';

    case '/resume':
      window.universeTimeDebug?.resume();
      return 'Universe time RESUMED';

    case '/speed':
    case '/scale':
      if (args.length === 0) {
        return 'Usage: /speed <multiplier> (e.g., /speed 2 for 2x, /speed 0.5 for half speed)';
      }
      const scale = parseFloat(args[0]);
      if (isNaN(scale) || scale <= 0) {
        return 'Error: Speed must be a positive number';
      }
      window.universeTimeDebug?.setScale(scale);
      return `Time scale set to ${scale}x`;

    case '/scheduler':
      return showSchedulerStatus();

    case '/test':
      return testScheduler(args[0] || 5);

    case '/help':
    case '/?':
      return showHelp();

    default:
      return `Unknown command: ${cmd}. Type /help for available commands.`;
  }
}

function enableVerboseMode() {
  if (window.universeTimeDebug) window.universeTimeDebug.verbose = true;
  if (window.schedulerDebug) window.schedulerDebug.verbose = true;
  if (window.timeAdapterDebug) window.timeAdapterDebug.verbose = true;
  console.log('%c[DEBUG MODE ENABLED]', 'color: lime; font-weight: bold');
  console.log('Universe Time, Scheduler, and Time Adapter will now log detailed information');
}

function disableVerboseMode() {
  if (window.universeTimeDebug) window.universeTimeDebug.verbose = false;
  if (window.schedulerDebug) window.schedulerDebug.verbose = false;
  if (window.timeAdapterDebug) window.timeAdapterDebug.verbose = false;
  console.log('%c[DEBUG MODE DISABLED]', 'color: orange; font-weight: bold');
}

function showTimeStatus() {
  console.group('%cUniverse Time System Status', 'color: cyan; font-weight: bold');
  if (window.universeTimeDebug) {
    window.universeTimeDebug.state();
  } else {
    console.log('Universe Time not initialized');
  }
  console.groupEnd();
  return 'Status logged to console (see above)';
}

function showSchedulerStatus() {
  console.group('%cScheduler System Status', 'color: magenta; font-weight: bold');
  if (window.schedulerDebug) {
    window.schedulerDebug.state();
  } else {
    console.log('Scheduler not initialized');
  }
  console.groupEnd();
  return 'Scheduler status logged to console (see above)';
}

function testScheduler(delaySeconds = 5) {
  const delay = parseFloat(delaySeconds);
  if (isNaN(delay) || delay <= 0) {
    return 'Error: Delay must be a positive number';
  }
  
  if (!window.schedulerDebug) {
    return 'Error: Scheduler not initialized';
  }

  console.log(`%cScheduling test event to fire in ${delay} seconds...`, 'color: yellow; font-weight: bold');
  
  const eventId = window.schedulerDebug.schedule('test_event', delay);
  console.log(`Test event scheduled with ID: ${eventId}`);
  
  // Listen for the test event
  import('./scheduler.js').then(({ getScheduler }) => {
    const unsub = getScheduler().on('test_event', (evt) => {
      console.log('%c✓ TEST EVENT TRIGGERED!', 'color: lime; font-weight: bold; font-size: 14px');
      console.log('Event details:', evt);
      unsub(); // cleanup
    });
  });
  
  return `Test event scheduled for ${delay}s from now (ID: ${eventId})`;
}

function showHelp() {
  const help = `
╔════════════════════════════════════════════════════════════════╗
║              UNIVERSE TIME DEBUG COMMANDS                      ║
╠════════════════════════════════════════════════════════════════╣
║ /verbose, /debug    - Enable verbose logging for all systems  ║
║ /quiet, /silent     - Disable verbose logging                 ║
║ /time, /status      - Show current time system status         ║
║ /scheduler          - Show scheduler status and pending events ║
║ /pause              - Pause universe time progression          ║
║ /resume             - Resume universe time progression         ║
║ /speed <n>          - Set time scale (e.g., /speed 2 = 2x)    ║
║ /test [delay]       - Schedule test event (default 5s)        ║
║ /help, /?           - Show this help message                  ║
╠════════════════════════════════════════════════════════════════╣
║ Direct API Access (console):                                  ║
║   window.universeTimeDebug  - Universe time controls          ║
║   window.schedulerDebug     - Scheduler controls              ║
║   window.timeAdapterDebug   - Time adapter controls           ║
╚════════════════════════════════════════════════════════════════╝

Examples:
  runDebugCommand('/verbose')        - Enable debug mode
  runDebugCommand('/speed 10')       - Run time 10x faster
  runDebugCommand('/test 3')         - Test scheduler with 3s delay
  
You can also call directly:
  window.universeTimeDebug.verbose = true
  window.universeTimeDebug.state()
  window.schedulerDebug.state()
`;
  console.log(help);
  return 'Help displayed in console (see above)';
}

// Auto-expose to window for easy access
if (typeof window !== 'undefined') {
  window.runDebugCommand = runDebugCommand;
  window.timeDebug = {
    verbose: () => enableVerboseMode(),
    quiet: () => disableVerboseMode(),
    status: () => showTimeStatus(),
    pause: () => window.universeTimeDebug?.pause(),
    resume: () => window.universeTimeDebug?.resume(),
    speed: (n) => window.universeTimeDebug?.setScale(n),
    test: (delay) => testScheduler(delay),
    help: () => showHelp()
  };
  
  console.log('%c[Time Debug Commands Loaded]', 'color: cyan; font-weight: bold');
  console.log('Type: runDebugCommand("/help") or timeDebug.help() for command list');
}

export default {
  run: runDebugCommand,
  enableVerbose: enableVerboseMode,
  disableVerbose: disableVerboseMode,
  showStatus: showTimeStatus,
  test: testScheduler
};
