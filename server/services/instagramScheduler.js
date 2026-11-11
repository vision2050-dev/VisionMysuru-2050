/**
 * Vision Mysuru 2050 - Instagram Daily Feed Scheduler
 * Automatically executes daily at 11:00 PM IST (17:30 UTC).
 */

export const getMsUntilNext11PmIst = () => {
  const now = new Date();
  // IST offset is UTC + 5 hours 30 minutes
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffsetMs);

  // Target 23:00:00 (11:00 PM) today IST
  const targetIst = new Date(istTime);
  targetIst.setUTCHours(23, 0, 0, 0);

  // If 23:00 IST today has already passed, schedule for tomorrow 23:00 IST
  if (targetIst.getTime() <= istTime.getTime()) {
    targetIst.setUTCDate(targetIst.getUTCDate() + 1);
  }

  const nextUtcTimestamp = targetIst.getTime() - istOffsetMs;
  return Math.max(1000, nextUtcTimestamp - now.getTime());
};

export const startInstagramDailyScheduler = (syncCallback) => {
  const scheduleNext = () => {
    const delayMs = getMsUntilNext11PmIst();
    const hours = (delayMs / (1000 * 60 * 60)).toFixed(2);
    console.log(`[Instagram Daily Scheduler] Next 11:00 PM IST update scheduled in ${hours} hours.`);

    setTimeout(async () => {
      try {
        console.log(`[Instagram Daily Scheduler] Triggering daily 11:00 PM IST Instagram feed sync...`);
        if (typeof syncCallback === "function") {
          await syncCallback();
        }
      } catch (err) {
        console.warn(`[Instagram Daily Scheduler] Daily sync note:`, err.message);
      } finally {
        scheduleNext();
      }
    }, delayMs);
  };

  scheduleNext();
};
