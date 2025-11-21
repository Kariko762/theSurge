// Basic tests for UniverseTime + Scheduler (run with: node src/lib/timeScheduler.test.js)
import { getUniverseTime } from './universeTime.js';
import { getScheduler, EventTypes } from './scheduler.js';

function assert(cond, msg){ if(!cond) throw new Error('Assertion failed: ' + msg); }

async function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

async function runTests(){
  console.log('Starting UniverseTime/Scheduler tests');
  const ut = getUniverseTime();
  const sched = getScheduler();

  // Test time progression
  const t0 = ut.getTime();
  await delay(120);
  const t1 = ut.getTime();
  assert(t1 > t0, 'Time should advance');

  // Test pause
  ut.pause();
  const tpause = ut.getTime();
  await delay(150);
  const tPausedLater = ut.getTime();
  assert(Math.abs(tPausedLater - tpause) < 0.01, 'Time should not advance while paused');
  ut.resume();

  // Test scaling fast-forward (2x)
  ut.setTimeScale(2);
  const tf0 = ut.getTime();
  await delay(100);
  const tf1 = ut.getTime();
  assert(tf1 - tf0 >= 0.18, '2x scale should advance about double (>=0.18s)');
  ut.setTimeScale(1);

  // Test scheduling events
  let fired = [];
  sched.on(EventTypes.SCAN_COMPLETE, (evt) => fired.push(evt));
  const start = ut.getTime();
  sched.schedule(EventTypes.SCAN_COMPLETE, 0.25, { test: true });
  await delay(400);
  assert(fired.length === 1, 'Scheduled event should have fired once');
  assert(fired[0].payload.test === true, 'Payload should match');
  assert(fired[0].triggerAt >= start, 'Trigger time should be >= start time');

  // Test cancel
  const id = sched.schedule(EventTypes.MINING_COMPLETE, 0.3, {});
  const cancelled = sched.cancel(id);
  assert(cancelled, 'Cancel should return true');
  await delay(400);
  console.log('Pending after cancel test:', sched.pendingCount());

  console.log('All tests passed');
}

runTests().catch(e => { console.error(e); process.exit(1); });
