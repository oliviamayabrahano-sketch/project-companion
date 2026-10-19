// Starts the app, connects the buttons, and switches between pages.
import { displayProjects } from "./projectView.js";
import { displayDashboard } from "./dashboardView.js";
import { setupDialogs, openProjectDialog } from "./dialogs.js";

const views = {
  dashboard: document.querySelector("#view-dashboard"),
  projects: document.querySelector("#view-projects")
};

const navLinks = document.querySelectorAll(".nav-link[data-view]");

// Redraw both pages so they always show current data.
function render() {
  displayProjects();
  displayDashboard();
}

// Which page does the address bar ask for? (#dashboard or #projects)
function currentView() {
  const name = location.hash.replace("#", "");
  return views[name] ? name : "dashboard";
}

function showView() {
  const active = currentView();

  Object.entries(views).forEach(([name, section]) => {
    section.hidden = name !== active;
  });

  navLinks.forEach((link) => {
    if (link.dataset.view === active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  render();
}

// Dialogs call render() after they change something.
setupDialogs(render);

document.querySelector("#create-project")
  .addEventListener("click", openProjectDialog);
document.querySelector("#empty-create")
  .addEventListener("click", openProjectDialog);

// Clicking a sidebar link changes the #address, which fires this event.
window.addEventListener("hashchange", showView);

// Show the right page when the app first loads.
showView();