// Holds the app's data in memory while the page is open.
import * as storage from "./storage.js";

// One shared object. Other files change its properties
// (for example: state.projects = ...), which is why it's an object
// and not separate variables.
export const state = {
  projects: storage.loadProjects(),
  drafts: storage.loadDrafts(),

  // After a redraw, put the cursor back where the user was working.
  focusProjectId: null,
  focusTaskId: null
};

export function saveProjects() {
  storage.saveProjects(state.projects);
}

export function saveDrafts() {
  storage.saveDrafts(state.drafts);
}

// What has been typed in a project's "add task" form but not yet added.
export function getDraft(projectId) {
  if (!state.drafts[projectId]) {
    state.drafts[projectId] = { text: "", dueDate: "", priority: "medium" };
  }
  return state.drafts[projectId];
}
