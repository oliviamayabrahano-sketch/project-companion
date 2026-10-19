// Draws the project cards. Split into small functions, one per piece.
import { state, saveProjects, saveDrafts, getDraft } from "./state.js";
import { todayString, formatDate } from "./dates.js";
import { sortTasks } from "./tasks.js";
import { askConfirm, openEditDialog } from "./dialogs.js";

const projectList = document.querySelector("#project-list");
const emptyState = document.querySelector("#empty-state");

// ---------- Progress text and bar ----------
function buildProgress(project) {
  // Work out the numbers first...
  const completed = project.tasks.filter(task => task.done).length;
  const percent = project.tasks.length === 0
    ? 0
    : Math.round((completed / project.tasks.length) * 100);

  // ...then use them.
  const progress = document.createElement("p");
  progress.className = "project-progress";
  progress.textContent =
    `${completed} of ${project.tasks.length} tasks completed (${percent}%)`;

  const bar = document.createElement("div");
  bar.className = "progress-bar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", `${project.name} progress`);
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", String(percent));

  const fill = document.createElement("div");
  fill.className = "progress-fill";
  fill.style.width = `${percent}%`;
  bar.appendChild(fill);

  return [progress, bar];
}

// ---------- The "add task" form ----------
function buildTaskForm(project) {
  const taskForm = document.createElement("form");
  taskForm.className = "task-form";

  const taskInput = document.createElement("input");
  taskInput.dataset.projectId = project.id;
  taskInput.type = "text";
  taskInput.className = "task-input";
  taskInput.placeholder = "Enter a task...";
  taskInput.setAttribute("aria-label", `New task for ${project.name}`);

  const addTaskButton = document.createElement("button");
  addTaskButton.type = "submit";
  addTaskButton.className = "btn btn-primary";
  addTaskButton.textContent = "Add Task";

  const extra = document.createElement("div");
  extra.className = "task-form-extra";

  const dateLabel = document.createElement("label");
  dateLabel.textContent = "Due date (optional)";
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateLabel.appendChild(dateInput);

  const priorityLabel = document.createElement("label");
  priorityLabel.textContent = "Priority";
  const prioritySelect = document.createElement("select");
  [["low", "Low"], ["medium", "Medium"], ["high", "High"]].forEach(
    ([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      if (value === "medium") option.selected = true;
      prioritySelect.appendChild(option);
    }
  );
  priorityLabel.appendChild(prioritySelect);

  extra.append(dateLabel, priorityLabel);

  // Put back whatever the user had typed before the redraw.
  const draft = getDraft(project.id);
  taskInput.value = draft.text;
  dateInput.value = draft.dueDate;
  prioritySelect.value = draft.priority;

  // Keep the draft up to date as the user types or picks.
  taskInput.addEventListener("input", () => { draft.text = taskInput.value; saveDrafts(); });
  dateInput.addEventListener("change", () => { draft.dueDate = dateInput.value; saveDrafts(); });
  prioritySelect.addEventListener("change", () => { draft.priority = prioritySelect.value; saveDrafts(); });

  taskForm.append(taskInput, addTaskButton, extra);

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const taskName = taskInput.value.trim();

    if (!taskName) {
      taskInput.focus();
      return;
    }

    project.tasks.push({
      id: Date.now() + Math.random(),
      text: taskName,
      done: false,
      priority: prioritySelect.value,
      dueDate: dateInput.value
    });

    draft.text = "";
    draft.dueDate = "";
    saveDrafts();

    state.focusProjectId = project.id;
    saveProjects();
    displayProjects();
  });

  return taskForm;
}

// ---------- One task row ----------
function buildTaskItem(project, task, today) {
  const item = document.createElement("li");
  item.className = "task-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.dataset.taskId = task.id;
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", `Complete ${task.text}`);

  const main = document.createElement("div");
  main.className = "task-main";

  const taskText = document.createElement("span");
  taskText.className = "task-text";
  taskText.textContent = task.text;
  if (task.done) taskText.classList.add("task-done");

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const priorityBadge = document.createElement("span");
  priorityBadge.className = `badge badge-${task.priority}`;
  priorityBadge.textContent =
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
  meta.appendChild(priorityBadge);

  if (task.dueDate) {
    const due = document.createElement("span");
    const isOverdue = !task.done && task.dueDate < today;
    due.textContent = isOverdue
      ? `Overdue: ${formatDate(task.dueDate)}`
      : `Due ${formatDate(task.dueDate)}`;
    if (isOverdue) due.classList.add("overdue");
    meta.appendChild(due);
  }

  main.append(taskText, meta);

  checkbox.addEventListener("change", () => {
    task.done = checkbox.checked;
    state.focusTaskId = task.id;
    saveProjects();
    displayProjects();
  });

  const editTaskButton = document.createElement("button");
  editTaskButton.type = "button";
  editTaskButton.className = "btn btn-secondary btn-small";
  editTaskButton.textContent = "Edit";
  editTaskButton.setAttribute("aria-label", `Edit task ${task.text}`);
  editTaskButton.addEventListener("click", () => openEditDialog(task));

  const deleteTaskButton = document.createElement("button");
  deleteTaskButton.type = "button";
  deleteTaskButton.className = "btn btn-danger btn-small";
  deleteTaskButton.textContent = "Delete";
  deleteTaskButton.setAttribute("aria-label", `Delete task ${task.text}`);

  deleteTaskButton.addEventListener("click", () => {
    askConfirm(`Delete the task "${task.text}"?`, () => {
      project.tasks = project.tasks.filter(
        currentTask => currentTask.id !== task.id
      );
      saveProjects();
      displayProjects();
    });
  });

  const buttons = document.createElement("div");
  buttons.className = "task-buttons";
  buttons.append(editTaskButton, deleteTaskButton);

  item.append(checkbox, main, buttons);
  return item;
}

// ---------- One whole project card ----------
function buildProjectCard(project, today) {
  const card = document.createElement("article");
  card.className = "project-card";

  const title = document.createElement("h3");
  title.textContent = project.name;

  const [progress, bar] = buildProgress(project);
  const taskForm = buildTaskForm(project);

  const taskList = document.createElement("ul");
  taskList.className = "task-list";
  sortTasks(project.tasks).forEach((task) => {
    taskList.appendChild(buildTaskItem(project, task, today));
  });

  const actions = document.createElement("div");
  actions.className = "project-actions";

  const deleteProjectButton = document.createElement("button");
  deleteProjectButton.type = "button";
  deleteProjectButton.className = "btn btn-danger btn-small";
  deleteProjectButton.textContent = "Delete Project";

  deleteProjectButton.addEventListener("click", () => {
    askConfirm(
      `Delete the project "${project.name}" and all of its tasks?`,
      () => {
        state.projects = state.projects.filter(item => item.id !== project.id);
        delete state.drafts[project.id];
        saveDrafts();
        saveProjects();
        displayProjects();
      }
    );
  });

  actions.appendChild(deleteProjectButton);

  card.append(title, progress, bar, taskForm, taskList, actions);
  return card;
}

// ---------- Put the cursor back after a redraw ----------
function restoreFocus() {
  if (state.focusProjectId !== null) {
    const boxes = projectList.querySelectorAll(".task-input");
    const box = Array.from(boxes).find(
      input => input.dataset.projectId === String(state.focusProjectId)
    );
    if (box) box.focus();
    state.focusProjectId = null;
  }

  if (state.focusTaskId !== null) {
    const checkboxes = projectList.querySelectorAll("input[type='checkbox']");
    const target = Array.from(checkboxes).find(
      input => input.dataset.taskId === String(state.focusTaskId)
    );
    if (target) target.focus();
    state.focusTaskId = null;
  }
}

// ---------- The one function other files call ----------
export function displayProjects() {
  projectList.replaceChildren();
  emptyState.hidden = state.projects.length > 0;

  const today = todayString();

  state.projects.forEach((project) => {
    projectList.appendChild(buildProjectCard(project, today));
  });

  restoreFocus();
}