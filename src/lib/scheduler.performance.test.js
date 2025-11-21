// Performance stress harness: run with `node src/lib/scheduler.performance.test.js`
import { getScheduler, EventTypes } from './scheduler.js';
import { getUniverseTime } from './universeTime.js';

function hr(){ return performance.now(); }

async function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function run(){
  const sched = getScheduler();
  const ut = getUniverseTime();
  console.log('Starting performance test');

  // 1. Bulk insertion test (10k events staggered over next 5 seconds)
  const COUNT = 10000;
  const startInsert = hr();
  for (let i=0;i<COUNT;i++) {
    const offset = (i / COUNT) * 5; // distribute across 5s
    sched.at(EventTypes.AI_TASK_COMPLETE, ut.getTime() + offset, { idx: i });
  }
  const endInsert = hr();
  console.log('Inserted', COUNT, 'events in', (endInsert - startInsert).toFixed(2),'ms');

  // 2. Observe wake processing duration when many due
  let processedBatches = 0;
  let maxWakeDuration = 0;
  const originalEmit = sched._emit.bind(sched);
  sched._emit = (type, evt) => { originalEmit(type, evt); }; // keep behavior

  // Monkey patch wake to measure
  const originalWake = sched._wake.bind(sched);
  sched._wake = () => {
    const wStart = hr();
    originalWake();
    const wEnd = hr();
    const dur = wEnd - wStart;
    if (dur > maxWakeDuration) maxWakeDuration = dur;
    processedBatches++;
  };

  // Wait 6 seconds to allow all events to fire
  await delay(6000);
  console.log('Wake batches processed:', processedBatches);
  console.log('Max single wake duration (ms):', maxWakeDuration.toFixed(3));
  console.log('Pending after firing:', sched.pendingCount());

  // Simple assertions
  if (sched.pendingCount() !== 0) {
    console.error('ERROR: Not all events processed');
    process.exit(1);
  }
  console.log('Performance test complete');
}

run().catch(e => { console.error(e); process.exit(1); });
