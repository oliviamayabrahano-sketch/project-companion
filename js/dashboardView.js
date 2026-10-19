// Draws the Dashboard page.
import { state, saveProjects } from "./state.js";
import { todayString, formatDate } from "./dates.js";
import { getStats, getNextStep, getDueSoon } from "./recommend.js";
import { openProjectDialog } from "./dialogs.js";

// Small helper: make an element with a class and text in one line.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function describeDue(task, today) {
  if (!task.dueDate) return "No due date";
  if (task.dueDate < today) return `Overdue: ${formatDate(task.dueDate)}`;
  if (task.dueDate === today) return "Due today";
  return `Due ${formatDate(task.dueDate)}`;
}

// A link that looks like a button and goes to the Projects page.
function projectsLink(label) {
  const link = el("a", "btn btn-secondary", label);
  link.href = "#projects";
  return link;
}

// ---------- Shown when there are no projects yet ----------
function buildWelcome() {
  const section = el("section", "empty-state");
  section.appendChild(el("h2", "", "Welcome! Let's start your first project."));
  section.appendChild(el("p", "", "Projects hold your goals and the small tasks that get you there. Try something like \"Learn JavaScript\" or \"Finish my portfolio\"."));

  const button = el("button", "btn btn-primary", "Create your first project");
  button.type = "button";
  button.addEventListener("click", openProjectDialog);
  section.appendChild(button);

  return section;
}

// ---------- The Next Step card ----------
function buildNextStep(stats, today) {
  const card = el("section", "card next-step");
  card.setAttribute("aria-label", "Next step");
  card.tabIndex = -1; // lets us move focus here after "Mark as done"
  card.appendChild(el("p", "eyebrow", "Your next step"));

  const next = getNextStep();

  if (stats.total === 0) {
    card.appendChild(el("h2", "", "Add your first task"));
    card.appendChild(el("p", "reason", "Open a project and break your goal into small steps. A task can be as small as \"outline the first section\"."));
    card.appendChild(projectsLink("Go to projects"));
    return card;
  }

  if (!next) {
    card.appendChild(el("h2", "", "You're all caught up"));
    card.appendChild(el("p", "reason", "Every task is finished. Add a new task whenever you're ready for the next step."));
    card.appendChild(projectsLink("Go to projects"));
    return card;
  }

  card.appendChild(el("h2", "", next.task.text));

  const meta = el("div", "task-meta");
  meta.appendChild(el("span", "", next.project.name));
  meta.appendChild(
    el("span", `badge badge-${next.task.priority}`, `${capitalize(next.task.priority)} priority`)
  );
  const isOverdue = next.task.dueDate && next.task.dueDate < today;
  meta.appendChild(
    el("span", isOverdue ? "overdue" : "", describeDue(next.task, today))
  );
  card.appendChild(meta);

  card.appendChild(el("p", "reason", `Why this one? ${next.reason}`));
  card.appendChild(el("p", "note", "This is a suggestion based on your due dates and priorities."));

  const actions = el("div", "card-actions");

  const doneButton = el("button", "btn btn-primary", "Mark as done");
  doneButton.type = "button";
  doneButton.setAttribute("aria-label", `Mark "${next.task.text}" as done`);
  doneButton.addEventListener("click", () => {
    next.task.done = true;
    saveProjects();
    displayDashboard();
    document.querySelector(".next-step").focus();
  });

  actions.append(doneButton, projectsLink("Open projects"));
  card.appendChild(actions);

  return card;
}

// ---------- Summary numbers ----------
function statCard(number, label, extraClass) {
  const card = el("div", `card stat ${extraClass}`.trim());
  card.append(el("p", "stat-number", String(number)), el("p", "stat-label", label));
  return card;
}

function buildStats(stats) {
  const row = el("div", "stats-row");
  row.append(
    statCard(stats.done, "Tasks done", ""),
    statCard(stats.remaining, "Tasks remaining", ""),
    statCard(stats.overdue, "Overdue tasks", stats.overdue > 0 ? "stat-alert" : "")
  );
  return row;
}

// ---------- Progress donut ----------
function buildDonut(stats) {
  const card = el("section", "card");
  card.appendChild(el("h2", "", "Overall progress"));

  const wrapper = el("div", "donut-wrap");

  // This SVG contains only numbers we calculated ourselves, never text typed
  // by the user, so using innerHTML here is safe.
  // pathLength="100" lets us treat the circle's edge as 100 units, so the
  // percentage can be used directly as the length of the colored arc.
  wrapper.innerHTML = `
    <svg class="donut" viewBox="0 0 120 120" role="img"
         aria-label="${stats.percent}% of tasks complete">
      <circle class="donut-track" cx="60" cy="60" r="48"></circle>
      <circle class="donut-fill" cx="60" cy="60" r="48" pathLength="100"
              stroke-dasharray="${stats.percent} ${100 - stats.percent}"
              transform="rotate(-90 60 60)"></circle>
      <text class="donut-text" x="60" y="60" dy=".35em">${stats.percent}%</text>
    </svg>`;

  card.appendChild(wrapper);
  card.appendChild(
    el("p", "stat-label donut-caption", `${stats.done} of ${stats.total} tasks completed`)
  );

  return card;
}

// ---------- Due soon list ----------
function buildDueSoon(today) {
  const card = el("section", "card");
  card.appendChild(el("h2", "", "Due soon"));

  const items = getDueSoon(5);

  if (items.length === 0) {
    card.appendChild(
      el("p", "stat-label", "No unfinished tasks have due dates yet. Add one from a project and it will show up here.")
    );
    return card;
  }

  const list = el("ul", "due-list");

  items.forEach(({ task, project }) => {
    const item = el("li", "due-item");

    const left = el("div");
    left.append(el("div", "due-title", task.text), el("div", "due-project", project.name));

    const isOverdue = task.dueDate < today;
    const when = el("span", isOverdue ? "due-when overdue" : "due-when", describeDue(task, today));

    item.append(left, when);
    list.appendChild(item);
  });

  card.appendChild(list);
  return card;
}

// ---------- The one function other files call ----------
export function displayDashboard() {
  document.querySelector("#greeting").textContent =
    `${greeting()}! Here's where things stand.`;

  const content = document.querySelector("#dashboard-content");
  content.replaceChildren();

  if (state.projects.length === 0) {
    content.appendChild(buildWelcome());
    return;
  }

  const today = todayString();
  const stats = getStats();

  const lower = el("div", "dash-grid");
  lower.append(buildDonut(stats), buildDueSoon(today));

  content.append(buildNextStep(stats, today), buildStats(stats), lower);
}