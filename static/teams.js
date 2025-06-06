let currentTeamId = null;

// Modal functions
function showCreateTeamModal() {
  const modal = document.getElementById("createTeamModal");
  modal.classList.add("show");
}

function closeCreateTeamModal() {
  const modal = document.getElementById("createTeamModal");
  modal.classList.remove("show");
}

function showJoinTeamModal() {
  const modal = document.getElementById("joinTeamModal");
  modal.classList.add("show");
}

function closeJoinTeamModal() {
  const modal = document.getElementById("joinTeamModal");
  modal.classList.remove("show");
}

function closeTeamTodosModal() {
  const modal = document.getElementById("teamTodosModal");
  modal.classList.remove("show");
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
  setTimeout(() => {
    errorDiv.classList.add("hidden");
  }, 5000);
}

// Create Team
document
  .getElementById("createTeamForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("teamName").value;

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create team");
      }

      const team = await response.json();

      // Add new team to the list
      const teamsList = document.getElementById("teamsList");
      const teamCard = document.createElement("div");
      teamCard.className = "team-card";
      teamCard.setAttribute("data-team-id", team.id);
      teamCard.innerHTML = `
        <div class="team-info">
          <h3>${team.name}</h3>
          <p class="team-code">Team Code: ${team.code}</p>
        </div>
        <div class="team-actions">
          <button class="btn btn-primary" onclick="viewTeam(${team.id})">
            <i class="fas fa-eye"></i>
            <span>View Team</span>
          </button>
          <button class="btn btn-danger" onclick="deleteTeam(${team.id})">
            <i class="fas fa-trash"></i>
            <span>Delete Team</span>
          </button>
        </div>
      `;
      teamsList.insertBefore(teamCard, teamsList.firstChild);

      // Clear form and close modal
      document.getElementById("teamName").value = "";
      closeCreateTeamModal();

      // Show team code to user
      showError(`Team created successfully! Share this code with your team members: ${team.code}`);
    } catch (error) {
      showError("Error creating team: " + error.message);
    }
  });

// Join Team
document
  .getElementById("joinTeamForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("teamCode").value;

    try {
      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid team code");
      }

      location.reload();
    } catch (error) {
      showError("Error joining team: " + error.message);
    }
  });

// View Team
async function viewTeam(teamId) {
  currentTeamId = teamId;
  try {
    const response = await fetch(`/api/teams/${teamId}/todos`);
    if (!response.ok) {
      throw new Error("Failed to load team todos");
    }

    const todos = await response.json();
    const todosList = document.getElementById("teamTodosList");

    if (todos.length === 0) {
      todosList.innerHTML = `
        <div class="todo-item empty-state">
          <i class="fas fa-clipboard-list"></i>
          <p>No tasks yet</p>
          <p class="text-secondary">Add your first team task!</p>
        </div>
      `;
    } else {
      todosList.innerHTML = todos
        .map(
          (todo) => `
        <div class="todo-item ${todo.completed ? "completed" : ""}">
          <div class="todo-header">
            <h3 class="todo-title ${todo.completed ? "completed-text" : ""}">${todo.title}</h3>
            <div class="todo-actions">
              <button class="complete-btn" aria-label="Mark as complete">
                <i class="fas ${todo.completed ? "fa-undo" : "fa-check"}"></i>
              </button>
              <button class="delete-btn" aria-label="Delete todo">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          ${todo.description ? `<p class="todo-description">${todo.description}</p>` : ""}
          <p class="todo-meta">Created by: ${todo.created_by}</p>
        </div>
      `
        )
        .join("");

      // Add event listeners to the new todo items
      todosList.querySelectorAll(".todo-item").forEach((item, index) => {
        const todo = todos[index];
        const completeBtn = item.querySelector(".complete-btn");
        const deleteBtn = item.querySelector(".delete-btn");

        completeBtn.addEventListener("click", () => toggleTeamTodo(teamId, todo.id, !todo.completed));
        deleteBtn.addEventListener("click", () => deleteTeamTodo(teamId, todo.id));
      });
    }

    const modal = document.getElementById("teamTodosModal");
    modal.classList.add("show");
  } catch (error) {
    showError("Error loading team todos: " + error.message);
  }
}

// Create Team Todo
document
  .getElementById("createTeamTodoForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("todoTitle").value;
    const description = document.getElementById("todoDescription").value;

    try {
      const response = await fetch(`/api/teams/${currentTeamId}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      // Clear form
      document.getElementById("todoTitle").value = "";
      document.getElementById("todoDescription").value = "";

      // Refresh team todos
      viewTeam(currentTeamId);
    } catch (error) {
      showError("Error creating task: " + error.message);
    }
  });

// Toggle Team Todo
async function toggleTeamTodo(teamId, todoId, completed) {
  try {
    const response = await fetch(`/api/teams/${teamId}/todos/${todoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    viewTeam(teamId);
  } catch (error) {
    showError("Error updating task: " + error.message);
  }
}

// Delete Team Todo
async function deleteTeamTodo(teamId, todoId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  try {
    const response = await fetch(`/api/teams/${teamId}/todos/${todoId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    viewTeam(teamId);
  } catch (error) {
    showError("Error deleting task: " + error.message);
  }
}

// Delete Team
async function deleteTeam(teamId) {
  if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
    return;
  }

  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete team");
    }

    // Remove team card from the list
    const teamCard = document.querySelector(`[data-team-id="${teamId}"]`);
    teamCard.remove();
  } catch (error) {
    showError("Error deleting team: " + error.message);
  }
} 