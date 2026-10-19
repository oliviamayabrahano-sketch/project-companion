const createProjectButton = document.querySelector("#create-project");
const projectList = document.querySelector("#project-list");

const emptyState = document.querySelector("#empty-state");
const emptyCreateButton = document.querySelector("#empty-create");

const projectDialog = document.querySelector("#project-dialog");
const projectForm = document.querySelector("#project-form");
const projectNameInput = document.querySelector("#project-name-input");
const projectCancel = document.querySelector("#project-cancel");

// Remembers which project's task box to focus after a redraw.
let focusProjectId = null;

let projects = JSON.parse(localStorage.getItem("projects")) || [];

// Convert projects from the previous version into the new format.
projects = projects.map((project, index) => {
  if (typeof project === "string") {
    return {
      id: Date.now() + index,
      name: project,
      tasks: []
    };
  }

  return {
    id: project.id,
    name: project.name,
    tasks: Array.isArray(project.tasks) ? project.tasks : []
  };
});

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

function displayProjects() {
  projectList.replaceChildren();

  emptyState.hidden = projects.length > 0;

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const title = document.createElement("h3");
    title.textContent = project.name;

    // 1. Work out the numbers first...
    const completed = project.tasks.filter(task => task.done).length;
    const percent = project.tasks.length === 0
      ? 0
      : Math.round((completed / project.tasks.length) * 100);

    // 2. ...then use them.
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

    taskForm.append(taskInput, addTaskButton);

    const taskList = document.createElement("ul");
    taskList.className = "task-list";

    project.tasks.forEach((task) => {
      const item = document.createElement("li");
      item.className = "task-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", `Complete ${task.text}`);

      const taskText = document.createElement("span");
      taskText.className = "task-text";
      taskText.textContent = task.text;

      if (task.done) {
        taskText.classList.add("task-done");
      }

      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        saveProjects();
        displayProjects();
      });

      const deleteTaskButton = document.createElement("button");
      deleteTaskButton.type = "button";
      deleteTaskButton.className = "btn btn-danger btn-small";
      deleteTaskButton.textContent = "Delete";
      deleteTaskButton.setAttribute("aria-label", `Delete task ${task.text}`);

      deleteTaskButton.addEventListener("click", () => {
        project.tasks = project.tasks.filter(
          currentTask => currentTask.id !== task.id
        );
        saveProjects();
        displayProjects();
      });

      item.append(checkbox, taskText, deleteTaskButton);
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
        done: false
      });

      focusProjectId = project.id;
      saveProjects();
      displayProjects();
    });

    const actions = document.createElement("div");
    actions.className = "project-actions";

    const deleteProjectButton = document.createElement("button");
    deleteProjectButton.type = "button";
    deleteProjectButton.className = "btn btn-danger btn-small";
    deleteProjectButton.textContent = "Delete Project";

    deleteProjectButton.addEventListener("click", () => {
      if (confirm(`Delete the project "${project.name}" and its tasks?`)) {
        projects = projects.filter(item => item.id !== project.id);
        saveProjects();
        displayProjects();
      }
    });

    actions.appendChild(deleteProjectButton);

    card.append(title, progress, bar, taskForm, taskList, actions);
    projectList.appendChild(card);
  });

  if (focusProjectId !== null) {
    const boxes = projectList.querySelectorAll(".task-input");
    const box = Array.from(boxes).find(
      input => input.dataset.projectId === String(focusProjectId)
    );
    if (box) box.focus();
    focusProjectId = null;
  }
}

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