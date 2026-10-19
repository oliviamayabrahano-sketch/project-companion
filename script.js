// ---------- Page elements ----------
const createProjectButton = document.querySelector("#create-project");
const projectList = document.querySelector("#project-list");

const emptyState = document.querySelector("#empty-state");
const emptyCreateButton = document.querySelector("#empty-create");

const projectDialog = document.querySelector("#project-dialog");
const projectForm = document.querySelector("#project-form");
const projectNameInput = document.querySelector("#project-name-input");
const projectCancel = document.querySelector("#project-cancel");

const confirmDialog = document.querySelector("#confirm-dialog");
const confirmMessage = document.querySelector("#confirm-message");
const confirmOk = document.querySelector("#confirm-ok");
const confirmCancel = document.querySelector("#confirm-cancel");

const editDialog = document.querySelector("#edit-dialog");
const editForm = document.querySelector("#edit-form");
const editText = document.querySelector("#edit-text");
const editDate = document.querySelector("#edit-date");
const editPriority = document.querySelector("#edit-priority");
const editCancel = document.querySelector("#edit-cancel");

// Remember what to focus after a redraw.
let focusProjectId = null;
let focusTaskId = null;

// The task currently open in the edit dialog.
let editingTask = null;

// Remembers what has been typed in each project's "add task" form,
// so a redraw doesn't erase it.
const drafts = JSON.parse(localStorage.getItem("drafts")) || {};

function saveDrafts() {
  localStorage.setItem("drafts", JSON.stringify(drafts));
}

function getDraft(projectId) {
  if (!drafts[projectId]) {
    drafts[projectId] = { text: "", dueDate: "", priority: "medium" };
  }
  return drafts[projectId];
}

// ---------- Data ----------
let projects = JSON.parse(localStorage.getItem("projects")) || [];

// Convert older saved data into the current format.
projects = projects.map((project, index) => {
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

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// ---------- Helpers ----------
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// Today as "YYYY-MM-DD" in the user's own time zone.
function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

// Unfinished first, then by due date (no date last), then by priority.
function sortTasks(tasks) {
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

// Reusable "are you sure?" dialog.
let confirmAction = null;

function askConfirm(message, onYes) {
  confirmMessage.textContent = message;
  confirmAction = onYes;
  confirmDialog.showModal();
}

confirmOk.addEventListener("click", () => {
  confirmDialog.close();
  if (confirmAction) confirmAction();
  confirmAction = null;
});

confirmCancel.addEventListener("click", () => {
  confirmDialog.close();
  confirmAction = null;
});

// ---------- Edit task dialog ----------
function openEditDialog(task) {
  editingTask = task;
  editText.value = task.text;
  editDate.value = task.dueDate;
  editPriority.value = task.priority;
  editDialog.showModal();
  editText.focus();
}

editForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const newText = editText.value.trim();
  if (!newText) {
    editText.focus();
    return;
  }

  editingTask.text = newText;
  editingTask.dueDate = editDate.value;
  editingTask.priority = editPriority.value;

  focusTaskId = editingTask.id;
  editingTask = null;

  saveProjects();
  editDialog.close();
  displayProjects();
});

editCancel.addEventListener("click", () => {
  editingTask = null;
  editDialog.close();
});

// ---------- Drawing the page ----------
function displayProjects() {
  projectList.replaceChildren();

  emptyState.hidden = projects.length > 0;

  const today = todayString();

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const title = document.createElement("h3");
    title.textContent = project.name;

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

    // ----- Add-task form -----
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

    // ----- Task list -----
    const taskList = document.createElement("ul");
    taskList.className = "task-list";

    sortTasks(project.tasks).forEach((task) => {
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
        focusTaskId = task.id;
        saveProjects();
        displayProjects();
      });

      const editTaskButton = document.createElement("button");
      editTaskButton.type = "button";
      editTaskButton.className = "btn btn-secondary btn-small";
      editTaskButton.textContent = "Edit";
      editTaskButton.setAttribute("aria-label", `Edit task ${task.text}`);

      editTaskButton.addEventListener("click", () => {
        openEditDialog(task);
      });

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
      taskList.appendChild(item);
    });

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

      focusProjectId = project.id;
      saveProjects();
      displayProjects();
    });

    // ----- Delete project -----
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
          projects = projects.filter(item => item.id !== project.id);
          delete drafts[project.id];
          saveDrafts();
          saveProjects();
          displayProjects();
        }
      );
    });

    actions.appendChild(deleteProjectButton);

    card.append(title, progress, bar, taskForm, taskList, actions);
    projectList.appendChild(card);
  });

  // Put the cursor back where the user was working.
  if (focusProjectId !== null) {
    const boxes = projectList.querySelectorAll(".task-input");
    const box = Array.from(boxes).find(
      input => input.dataset.projectId === String(focusProjectId)
    );
    if (box) box.focus();
    focusProjectId = null;
  }

  if (focusTaskId !== null) {
    const checkboxes = projectList.querySelectorAll("input[type='checkbox']");
    const target = Array.from(checkboxes).find(
      input => input.dataset.taskId === String(focusTaskId)
    );
    if (target) target.focus();
    focusTaskId = null;
  }
}

// ---------- New project dialog ----------
function createProject() {
  projectNameInput.value = "";
  projectDialog.showModal();
  projectNameInput.focus();
}

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const projectName = projectNameInput.value.trim();
  if (!projectName) {
    projectNameInput.focus();
    return;
  }

  projects.push({
    id: Date.now() + Math.random(),
    name: projectName,
    tasks: []
  });

  saveProjects();
  projectDialog.close();
  displayProjects();
});

projectCancel.addEventListener("click", () => {
  projectDialog.close();
});

createProjectButton.addEventListener("click", createProject);
emptyCreateButton.addEventListener("click", createProject);

// Draw everything once when the page first loads.
displayProjects();