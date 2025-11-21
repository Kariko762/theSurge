import { useState, useEffect, useRef } from 'react';
import { getGameTime } from '../lib/timeAdapter.js';
import { getScheduler } from '../lib/scheduler.js';

/**
 * LiveClock - PULL-based time display component
 * Schedules itself to update every second using the scheduler
 * ONLY this component re-renders, not the parent
 */
export default function LiveClock({ style, className }) {
  const [displayTime, setDisplayTime] = useState(getGameTime().formatGameTime());
  const instanceId = useRef(`clock_${Date.now()}_${Math.random()}`).current;
  const eventType = `clock_update_${instanceId}`;

  useEffect(() => {
    const scheduler = getScheduler();
    const universeTime = getGameTime()._universeTime;
    let currentEventId = null;
    let isActive = true;
    let updateCount = 0;

    const scheduleNextUpdate = () => {
      if (!isActive) return;
      // Schedule 1 second in universe time, accounting for time scale
      // If time scale is 10x, we need to wait 0.1 real seconds for 1 universe second
      const realTimeDelay = 1.0; // 1 second in universe time regardless of scale
      currentEventId = scheduler.schedule(eventType, realTimeDelay, {});
    };

    // Handler for clock update events (only this instance's events)
    const handleClockUpdate = (evt) => {
      if (!isActive) return;
      updateCount++;
      // PULL the current time
      setDisplayTime(getGameTime().formatGameTime());
      // Schedule the next update
      scheduleNextUpdate();
    };

    // Subscribe to this instance's clock_update events only
    const unsub = scheduler.on(eventType, handleClockUpdate);

    // Schedule the first update
    scheduleNextUpdate();

    return () => {
      isActive = false;
      unsub();
      if (currentEventId) {
        scheduler.cancel(currentEventId);
      }
    };
  }, [eventType]);

  return (
    <div style={style} className={className}>
      {displayTime}
    </div>
  );
}
