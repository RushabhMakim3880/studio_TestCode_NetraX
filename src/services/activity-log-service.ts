'use client';

export type ActivityLog = {
  id: string;
  timestamp: string; // ISO string
  user: string;
  action: string;
  details: string;
};

const ACTIVITY_LOG_KEY = 'netra-activity-log';

/**
 * Triggers a custom event to notify components that the activity log has been updated.
 */
function triggerActivityLogUpdate() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('activityLogUpdated'));
}


/**
 * Retrieves the activity log from localStorage.
 * @returns An array of activity logs.
 */
export function getActivities(): ActivityLog[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedLog = localStorage.getItem(ACTIVITY_LOG_KEY);
    return storedLog ? JSON.parse(storedLog) : [];
  } catch (error) {
    console.error("Failed to parse activity log from localStorage", error);
    return [];
  }
}

/**
 * Logs a new activity to localStorage.
 * @param activity - The activity details to log.
 */
export function logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') {
    return;
  }
  const newLog: ActivityLog = {
    ...activity,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  const currentLog = getActivities();
  // Keep the log to a reasonable size, e.g., 50 entries
  const updatedLog = [newLog, ...currentLog].slice(0, 50);

  try {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updatedLog));
    triggerActivityLogUpdate(); // Dispatch event to notify listeners
  } catch (error) {
    console.error("Failed to save activity log to localStorage", error);
  }
}


/**
 * Clears the entire activity log from localStorage.
 */
export function clearActivities() {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.removeItem(ACTIVITY_LOG_KEY);
    triggerActivityLogUpdate(); // Dispatch event to notify listeners
}
