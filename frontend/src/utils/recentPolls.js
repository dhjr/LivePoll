const STORAGE_KEY = "poll_recent_history";
const MAX_RECENT_ITEMS = 5;

/**
 * Safely adds a poll shortcut to localStorage.
 * MINIMIZATION GUARANTEE: Stores ONLY non-sensitive UI fields (pollId, title, visitedAt).
 */
export function addRecentPoll({ pollId, title }) {
  if (typeof window === "undefined" || !pollId) return;

  try {
    const existing = getRecentPolls();
    // Filter out duplicates
    const filtered = existing.filter((item) => item.pollId !== pollId);

    // Prepend new shortcut
    const updated = [
      {
        pollId,
        title: title || `Poll #${pollId}`,
        visitedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore storage quota / privacy mode errors
  }
}

/**
 * Safely reads recent poll shortcuts from localStorage.
 */
export function getRecentPolls() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Sanitize objects to ensure only safe fields exist
    return parsed.map((item) => ({
      pollId: String(item.pollId || ""),
      title: String(item.title || "Poll"),
      visitedAt: String(item.visitedAt || ""),
    })).filter((item) => item.pollId !== "");
  } catch (e) {
    return [];
  }
}

/**
 * Clears recent poll shortcuts from localStorage.
 */
export function clearRecentPolls() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}
