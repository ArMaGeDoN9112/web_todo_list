let currentTeamId = null;

// Проверка загрузки скрипта
console.log('Teams.js loaded');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    loadTeams(); // Загружаем команды при загрузке страницы
    
    // Обработчики для кнопок создания и присоединения к команде
    const createTeamBtn = document.getElementById('createTeamBtn');
    const joinTeamBtn = document.getElementById('joinTeamBtn');
    const closeCreateTeamBtn = document.getElementById('closeCreateTeamBtn');
    
    if (createTeamBtn) {
        console.log('Create Team button found');
        createTeamBtn.addEventListener('click', function() {
            console.log('Create Team button clicked');
            toggleSection('createTeamSection');
        });
    } else {
        console.error('Create Team button not found');
    }

    if (joinTeamBtn) {
        console.log('Join Team button found');
        joinTeamBtn.addEventListener('click', function() {
            console.log('Join Team button clicked');
            toggleSection('joinTeamSection');
        });
    } else {
        console.error('Join Team button not found');
    }

    if (closeCreateTeamBtn) {
        console.log('Close Create Team button found');
        closeCreateTeamBtn.addEventListener('click', function() {
            console.log('Close Create Team button clicked');
            toggleSection('createTeamSection');
        });
    } else {
        console.error('Close Create Team button not found');
    }

    // Добавляем обработчик для формы создания команды
    const createTeamForm = document.getElementById('createTeamForm');
    if (createTeamForm) {
        console.log('Create Team form found');
        createTeamForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Create Team form submitted');
            const name = document.getElementById('teamName').value;
            // ... rest of the form submission code ...
        });
    } else {
        console.error('Create Team form not found');
    }
});

// Toggle section visibility
function toggleSection(sectionId) {
    console.log('Toggling section:', sectionId);
    const section = document.getElementById(sectionId);
    if (!section) {
        console.error('Section not found:', sectionId);
        return;
    }
    console.log('Current section state:', section.classList.contains('hidden'));
    section.classList.toggle('hidden');
    // Принудительно обновляем display
    if (section.classList.contains('hidden')) {
        section.style.display = 'none';
    } else {
        section.style.display = 'block';
    }
    console.log('New section state:', section.classList.contains('hidden'));
    console.log('Section display style:', section.style.display);
}

// Toggle team todo form visibility
function toggleTeamTodoForm(teamId) {
    const form = document.getElementById(`teamTodoForm-${teamId}`);
    form.classList.toggle('hidden');
}

// Show error message
function showError(message, isSuccess = false) {
    const errorDiv = document.getElementById("error-message");
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
    if (isSuccess) {
        errorDiv.classList.add("success-message");
    } else {
        errorDiv.classList.remove("success-message");
    }
    setTimeout(() => {
        errorDiv.classList.add("hidden");
    }, 5000);
}

// Load team todos
async function loadTeamTodos(teamId) {
    try {
        console.log(`Loading todos for team ${teamId}...`);
        const response = await fetch(`/api/teams/${teamId}/todos`, {
            credentials: 'include'
        });
        console.log(`Team ${teamId} todos response status:`, response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to load todos for team ${teamId}. Status:`, response.status, 'Response:', errorText);
            throw new Error("Failed to load team todos");
        }

        const todos = await response.json();
        console.log(`Team ${teamId} todos loaded:`, todos);

        const todosList = document.getElementById(`teamTodosList-${teamId}`);
        if (!todosList) {
            console.error(`Todo list container not found for team ${teamId}`);
            return;
        }

        if (!Array.isArray(todos)) {
            console.error(`Invalid todos format for team ${teamId}:`, todos);
            todosList.innerHTML = `
                <div class="todo-item empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading tasks</p>
                    <p class="text-secondary">Please try again later</p>
                </div>
            `;
            return;
        }

        if (todos.length === 0) {
            console.log(`No todos found for team ${teamId}`);
            todosList.innerHTML = `
                <div class="todo-item empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks yet</p>
                    <p class="text-secondary">Add your first team task!</p>
                </div>
            `;
            return;
        }

        console.log(`Rendering ${todos.length} todos for team ${teamId}`);
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
        console.log(`Adding event listeners for team ${teamId} todos`);
        todosList.querySelectorAll(".todo-item").forEach((item, index) => {
            const todo = todos[index];
            const completeBtn = item.querySelector(".complete-btn");
            const deleteBtn = item.querySelector(".delete-btn");

            completeBtn.addEventListener("click", () => toggleTeamTodo(teamId, todo.id, !todo.completed));
            deleteBtn.addEventListener("click", () => deleteTeamTodo(teamId, todo.id));
        });
        console.log(`Team ${teamId} todos loaded and rendered successfully`);
    } catch (error) {
        console.error(`Error loading todos for team ${teamId}:`, error);
        showError("Error loading team todos: " + error.message);
    }
}

// Load Teams
async function loadTeams() {
    try {
        console.log('Starting to load teams...');
        // Используем /api/teams/list вместо /api/teams
        const response = await fetch("/api/teams/list", {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log('Teams API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to load teams. Status:', response.status, 'Response:', errorText);
            throw new Error("Failed to load teams");
        }

        const teams = await response.json();
        console.log('Teams loaded successfully:', teams);

        if (!Array.isArray(teams)) {
            console.error('Invalid teams format:', teams);
            throw new Error("Invalid response format from server");
        }

        const teamsList = document.getElementById("teamsList");
        if (!teamsList) {
            console.error('Teams list container not found');
            return;
        }

        teamsList.innerHTML = "";

        if (teams.length === 0) {
            console.log('No teams found');
            teamsList.innerHTML = `
                <div class="no-teams">
                    <p>You haven't joined any teams yet.</p>
                    <p>Create a new team or join an existing one to get started!</p>
                </div>
            `;
            return;
        }

        console.log('Rendering teams list...');
        teams.forEach(team => {
            console.log('Rendering team:', team);
            if (!team.id || !team.name || !team.code) {
                console.error('Invalid team data:', team);
                return;
            }

            const teamCard = document.createElement("div");
            teamCard.className = "team-card";
            teamCard.setAttribute("data-team-id", team.id);
            teamCard.innerHTML = `
                <div class="team-info">
                    <h3>${team.name}</h3>
                    <p class="team-code">Team Code: ${team.code}</p>
                </div>
                <div class="team-todos">
                    <div class="team-todos-header">
                        <h4>Team Tasks</h4>
                        <button class="btn btn-sm btn-primary" onclick="toggleTeamTodoForm(${team.id})">
                            <i class="fas fa-plus"></i>
                            <span>Add Task</span>
                        </button>
                    </div>
                    <div id="teamTodoForm-${team.id}" class="team-todo-form hidden">
                        <form class="todo-form" onsubmit="return createTeamTodo(event, ${team.id})">
                            <div class="form-group">
                                <div class="input-with-icon">
                                    <i class="fas fa-pencil-alt"></i>
                                    <input type="text" name="title" required minlength="3" maxlength="100" placeholder="What needs to be done?">
                                </div>
                            </div>
                            <div class="form-group">
                                <div class="input-with-icon">
                                    <i class="fas fa-align-left"></i>
                                    <textarea name="description" placeholder="Add a description (optional)" class="todo-description"></textarea>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary btn-sm">
                                    <i class="fas fa-plus"></i>
                                    <span>Add</span>
                                </button>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="toggleTeamTodoForm(${team.id})">
                                    <i class="fas fa-times"></i>
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </form>
                    </div>
                    <div class="team-todos-list" id="teamTodosList-${team.id}">
                        <!-- Team todos will be loaded here -->
                    </div>
                </div>
                <div class="team-actions">
                    <button class="btn btn-danger" onclick="deleteTeam(${team.id})">
                        <i class="fas fa-trash"></i>
                        <span>Delete Team</span>
                    </button>
                </div>
            `;
            teamsList.appendChild(teamCard);
            console.log('Team card added to DOM:', team.id);
            
            // Load team todos
            loadTeamTodos(team.id);
        });
        console.log('Teams list rendering completed');
    } catch (error) {
        console.error('Error in loadTeams:', error);
        showError("Error loading teams: " + error.message);
    }
}

// Create Team
document.getElementById("createTeamForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("teamName").value.trim();
    
    console.log('Create team form submitted with name:', name);
    
    if (!name) {
        console.log('Team name is empty');
        showError("Please enter a team name");
        return;
    }

    try {
        console.log('Sending create team request...');
        // Создаем команду
        const createResponse = await fetch("/api/teams", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
            credentials: 'include'
        });
        console.log('Create team response status:', createResponse.status);

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('Create team failed. Status:', createResponse.status, 'Response:', errorText);
            throw new Error(errorText || "Failed to create team");
        }

        const team = await createResponse.json();
        console.log('Team created successfully:', team);

        // Автоматически присоединяем создателя к команде
        console.log('Attempting to join team as creator with code:', team.code);
        const joinResponse = await fetch("/api/teams/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: team.code }),
            credentials: 'include'
        });
        console.log('Join team response status:', joinResponse.status);

        if (!joinResponse.ok) {
            const errorText = await joinResponse.text();
            console.error('Failed to join team as creator. Status:', joinResponse.status, 'Response:', errorText);
            // Продолжаем выполнение, так как команда уже создана
        } else {
            console.log('Successfully joined team as creator');
        }

        // Add new team to the list
        console.log('Adding new team to the list...');
        const teamsList = document.getElementById("teamsList");
        const teamCard = document.createElement("div");
        teamCard.className = "team-card";
        teamCard.setAttribute("data-team-id", team.id);
        teamCard.innerHTML = `
            <div class="team-info">
                <h3>${team.name}</h3>
                <p class="team-code">Team Code: ${team.code}</p>
            </div>
            <div class="team-todos">
                <div class="team-todos-header">
                    <h4>Team Tasks</h4>
                    <button class="btn btn-sm btn-primary" onclick="toggleTeamTodoForm(${team.id})">
                        <i class="fas fa-plus"></i>
                        <span>Add Task</span>
                    </button>
                </div>
                <div id="teamTodoForm-${team.id}" class="team-todo-form hidden">
                    <form class="todo-form" onsubmit="return createTeamTodo(event, ${team.id})">
                        <div class="form-group">
                            <div class="input-with-icon">
                                <i class="fas fa-pencil-alt"></i>
                                <input type="text" name="title" required minlength="3" maxlength="100" placeholder="What needs to be done?">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="input-with-icon">
                                <i class="fas fa-align-left"></i>
                                <textarea name="description" placeholder="Add a description (optional)" class="todo-description"></textarea>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-sm">
                                <i class="fas fa-plus"></i>
                                <span>Add</span>
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="toggleTeamTodoForm(${team.id})">
                                <i class="fas fa-times"></i>
                                <span>Cancel</span>
                            </button>
                        </div>
                    </form>
                </div>
                <div class="team-todos-list" id="teamTodosList-${team.id}">
                    <!-- Team todos will be loaded here -->
                </div>
            </div>
            <div class="team-actions">
                <button class="btn btn-danger" onclick="deleteTeam(${team.id})">
                    <i class="fas fa-trash"></i>
                    <span>Delete Team</span>
                </button>
            </div>
        `;
        teamsList.insertBefore(teamCard, teamsList.firstChild);
        console.log('New team card added to DOM');

        // Load team todos
        console.log('Loading todos for new team...');
        loadTeamTodos(team.id);

        // Clear form and hide section
        document.getElementById("createTeamForm").reset();
        toggleSection("createTeamSection");

        // Show success message with team code
        console.log('Team creation process completed successfully');
        showError(`Team created successfully! Share this code with your team members: ${team.code}`, true);
    } catch (error) {
        console.error('Error in create team process:', error);
        showError("Error creating team: " + error.message);
    }
});

// Join Team
document.getElementById("joinTeamForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("teamCode").value.trim();
    
    if (!code) {
        showError("Please enter a team code");
        return;
    }

    try {
        console.log('Attempting to join team with code:', code);
        const response = await fetch("/api/teams/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
            credentials: 'include' // Добавляем credentials для передачи куки
        });

        console.log('Join team response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
            console.error('Join team error:', errorData);
            throw new Error(errorData.error || `Failed to join team (Status: ${response.status})`);
        }

        const result = await response.json();
        console.log('Successfully joined team:', result);
        
        // Показываем сообщение об успехе перед перезагрузкой
        showError("Successfully joined the team!", true);
        
        // Даем время увидеть сообщение об успехе
        setTimeout(() => {
            location.reload();
        }, 1500);
    } catch (error) {
        console.error('Error joining team:', error);
        showError("Error joining team: " + error.message);
    }
});

// Create Team Todo
async function createTeamTodo(event, teamId) {
    event.preventDefault();
    const form = event.target;
    const title = form.querySelector('input[name="title"]').value;
    const description = form.querySelector('textarea[name="description"]').value;

    try {
        const response = await fetch(`/api/teams/${teamId}/todos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title, description }),
        });

        if (!response.ok) {
            throw new Error("Failed to create task");
        }

        // Clear form and hide it
        form.reset();
        toggleTeamTodoForm(teamId);

        // Refresh team todos
        loadTeamTodos(teamId);
    } catch (error) {
        showError("Error creating task: " + error.message);
    }
    return false;
}

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

        loadTeamTodos(teamId);
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

        loadTeamTodos(teamId);
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
            throw new Error("Failed to delete team");
        }

        const teamCard = document.querySelector(`.team-card[data-team-id="${teamId}"]`);
        teamCard.remove();
    } catch (error) {
        showError("Error deleting team: " + error.message);
    }
} 