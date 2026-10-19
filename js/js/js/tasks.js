export const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// Unfinished first, then by due date (no date last), then by priority.
// Returns a sorted COPY, so the saved order is not changed.
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.dueDate !== b.dueDate) {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}