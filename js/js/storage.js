// The ONLY file that knows data lives in localStorage.
// Later, if we switch to Supabase, this is the file that changes.

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Convert older saved data into the current format.
function upgradeProjects(saved) {
  if (!Array.isArray(saved)) return [];

  return saved.map((project, index) => {
    if (typeof project === "string") {
      return { id: Date.now() + index, name: project, tasks: [] };
    }

    const tasks = Array.isArray(project.tasks) ? project.tasks : [];

    return {
      id: project.id,
      name: project.name,
      tasks: tasks.map(task => ({
        id: task.id,
        text: task.text,
        done: Boolean(task.done),
        priority: task.priority || "medium",
        dueDate: task.dueDate || ""
      }))
    };
  });
}

export function loadProjects() {
  return upgradeProjects(readJSON("projects", []));
}

export function saveProjects(projects) {
  localStorage.setItem("projects", JSON.stringify(projects));
}

export function loadDrafts() {
  return readJSON("drafts", {});
}

export function saveDrafts(drafts) {
  localStorage.setItem("drafts", JSON.stringify(drafts));
}