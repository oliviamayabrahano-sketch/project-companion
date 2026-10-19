// The "smart rules": no AI, just sorting by due date and priority.
import { state } from "./state.js";
import { todayString } from "./dates.js";
import { PRIORITY_ORDER } from "./tasks.js";

// Every unfinished task, paired with the project it belongs to.
function getOpenTasks() {
  const open = [];
  state.projects.forEach((project) => {
    project.tasks.forEach((task) => {
      if (!task.done) open.push({ task, project });
    });
  });
  return open;
}

// Earliest due date first (no date goes last), then highest priority.
function byUrgency(a, b) {
  const dateA = a.task.dueDate;
  const dateB = b.task.dueDate;

  if (dateA !== dateB) {
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA < dateB ? -1 : 1;
  }

  return PRIORITY_ORDER[a.task.priority] - PRIORITY_ORDER[b.task.priority];
}

// Totals across all projects.
export function getStats() {
  const today = todayString();
  let total = 0;
  let done = 0;
  let overdue = 0;

  state.projects.forEach((project) => {
    project.tasks.forEach((task) => {
      total++;
      if (task.done) {
        done++;
      } else if (task.dueDate && task.dueDate < today) {
        overdue++;
      }
    });
  });

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { total, done, remaining: total - done, overdue, percent };
}

// The single most urgent unfinished task, plus a plain-language reason.
// Returns null when there is nothing left to do.
export function getNextStep() {
  const sorted = getOpenTasks().sort(byUrgency);
  if (sorted.length === 0) return null;

  const { task, project } = sorted[0];
  const today = todayString();

  let reason;
  if (!task.dueDate) {
    reason = "None of your open tasks have a due date, so this one has the highest priority.";
  } else if (task.dueDate < today) {
    reason = "It is overdue, so it comes first.";
  } else if (task.dueDate === today) {
    reason = "It is due today.";
  } else {
    reason = "It has the nearest due date.";
  }

  return { task, project, reason };
}

// The next few unfinished tasks that have a due date.
export function getDueSoon(limit = 5) {
  return getOpenTasks()
    .filter(entry => entry.task.dueDate)
    .sort(byUrgency)
    .slice(0, limit);
}