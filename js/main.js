// Starts the app: connects the buttons and draws the page.
import { displayProjects } from "./projectView.js";
import { setupDialogs, openProjectDialog } from "./dialogs.js";

// Tell the dialogs which function redraws the page.
setupDialogs(displayProjects);

document.querySelector("#create-project")
  .addEventListener("click", openProjectDialog);
document.querySelector("#empty-create")
  .addEventListener("click", openProjectDialog);

// Draw everything once when the page first loads.
displayProjects();