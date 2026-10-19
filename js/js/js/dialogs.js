// The three pop-up dialogs: new project, edit task, and "are you sure?".
import { state, saveProjects } from "./state.js";

// Called after any change so the page redraws. main.js provides it.
// (We pass it in so this file doesn't need to import the drawing file.)
let onChange = () => {};

export function setupDialogs(redrawFunction) {
  onChange = redrawFunction;
}

// ---------- Confirm dialog ----------
const confirmDialog = document.querySelector("#confirm-dialog");
const confirmMessage = document.querySelector("#confirm-message");
const confirmOk = document.querySelector("#confirm-ok");
const confirmCancel = document.querySelector("#confirm-cancel");

let confirmAction = null;

export function askConfirm(message, onYes) {
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

// ---------- New project dialog ----------
const projectDialog = document.querySelector("#project-dialog");
const projectForm = document.querySelector("#project-form");
const projectNameInput = document.querySelector("#project-name-input");
const projectCancel = document.querySelector("#project-cancel");

export function openProjectDialog() {
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

  state.projects.push({
    id: Date.now() + Math.random(),
    name: projectName,
    tasks: []
  });

  saveProjects();
  projectDialog.close();
  onChange();
});

projectCancel.addEventListener("click", () => {
  projectDialog.close();
});

// ---------- Edit task dialog ----------
const editDialog = document.querySelector("#edit-dialog");
const editForm = document.querySelector("#edit-form");
const editText = document.querySelector("#edit-text");
const editDate = document.querySelector("#edit-date");
const editPriority = document.querySelector("#edit-priority");
const editCancel = document.querySelector("#edit-cancel");

// The task currently open in the edit dialog.
let editingTask = null;

export function openEditDialog(task) {
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

  state.focusTaskId = editingTask.id;
  editingTask = null;

  saveProjects();
  editDialog.close();
  onChange();
});

editCancel.addEventListener("click", () => {
  editingTask = null;
  editDialog.close();
});