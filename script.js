
const createProjectButton = document.querySelector("#create-project");
const projectList = document.querySelector("#project-list");

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

  projects.forEach((project) => {
    const card = document.createElement("div");
    card.style.background = "white";
    card.style.padding = "20px";
    card.style.marginTop = "16px";
    card.style.borderRadius = "10px";

    const title = document.createElement("h3");
    title.textContent = project.name;

    const progress = document.createElement("p");
    const completed = project.tasks.filter(task => task.done).length;
    progress.textContent =
      `${completed} of ${project.tasks.length} tasks completed`;

    const taskForm = document.createElement("form");
    taskForm.style.display = "flex";
    taskForm.style.gap = "8px";
    taskForm.style.flexWrap = "wrap";

    const taskInput = document.createElement("input");
    taskInput.type = "text";
    taskInput.placeholder = "Enter a task...";
    taskInput.setAttribute("aria-label", `New task for ${project.name}`);
    taskInput.style.padding = "10px";
    taskInput.style.border = "1px solid #ccc";
    taskInput.style.borderRadius = "6px";
    taskInput.style.flex = "1";
    taskInput.style.minWidth = "150px";

    const addTaskButton = document.createElement("button");
    addTaskButton.type = "submit";
    addTaskButton.textContent = "Add Task";

    taskForm.append(taskInput, addTaskButton);

    const taskList = document.createElement("ul");
    taskList.style.paddingLeft = "20px";

    project.tasks.forEach((task) => {
      const item = document.createElement("li");
      item.style.marginTop = "12px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", `Complete ${task.text}`);

      const taskText = document.createElement("span");
      taskText.textContent = ` ${task.text}`;
      taskText.style.marginRight = "12px";

      if (task.done) {
        taskText.style.textDecoration = "line-through";
        taskText.style.color = "#687086";
      }

      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        saveProjects();
        displayProjects();
      });

      const deleteTaskButton = document.createElement("button");
      deleteTaskButton.type = "button";
      deleteTaskButton.textContent = "Delete";
      deleteTaskButton.style.padding = "6px 10px";
      deleteTaskButton.style.background = "#d9534f";

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

      saveProjects();
      displayProjects();
    });

    const deleteProjectButton = document.createElement("button");
    deleteProjectButton.type = "button";
    deleteProjectButton.textContent = "Delete Project";
    deleteProjectButton.style.background = "#d9534f";
    deleteProjectButton.style.marginTop = "12px";

    deleteProjectButton.addEventListener("click", () => {
      if (confirm(`Delete the project "${project.name}" and its tasks?`)) {
        projects = projects.filter(item => item.id !== project.id);
        saveProjects();
        displayProjects();
      }
    });

    card.append(
      title,
      progress,
      taskForm,
      taskList,
      deleteProjectButton
    );

    projectList.appendChild(card);
  });
}

createProjectButton.addEventListener("click", () => {
  const projectName = prompt("What is the name of your project?");

  if (projectName === null || !projectName.trim()) {
    return;
  }

  projects.push({
    id: Date.now() + Math.random(),
    name: projectName.trim(),
    tasks: []
  });

  saveProjects();
  displayProjects();
});

saveProjects();
displayProjects();
