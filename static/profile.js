document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile.js: DOM Content Loaded');
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Profile.js: No token found, redirecting to login');
        window.location.href = '/login';
        return;
    }

    // Load profile data
    loadProfile();

    // Handle logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Profile.js: Logging out');
            localStorage.removeItem('token');
            window.location.href = '/login';
        });
    }

    // Handle change password
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            console.log('Profile.js: Change password clicked');
            // TODO: Implement change password functionality
            alert('Change password functionality coming soon!');
        });
    }

    // Handle delete account
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            console.log('Profile.js: Delete account clicked');
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // TODO: Implement delete account functionality
                alert('Delete account functionality coming soon!');
            }
        });
    }
});

async function loadProfile() {
    console.log('Profile.js: Loading profile data');
    try {
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Profile.js: Failed to load profile, status:', response.status);
            throw new Error('Failed to load profile');
        }

        const user = await response.json();
        console.log('Profile.js: Profile data received:', user);
        
        // Update profile information
        const usernameElement = document.querySelector('.profile-username');
        const emailElement = document.querySelector('.profile-email');
        
        if (usernameElement) {
            console.log('Profile.js: Setting username to:', user.username);
            usernameElement.textContent = user.username;
        } else {
            console.error('Profile.js: Username element not found');
        }
        
        if (emailElement) {
            console.log('Profile.js: Setting email to:', user.email);
            emailElement.textContent = user.email;
        } else {
            console.error('Profile.js: Email element not found');
        }

        // Load todo statistics
        await loadTodoStats();
    } catch (error) {
        console.error('Profile.js: Error loading profile:', error);
        if (error.message === 'Failed to load profile') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }
}

async function loadTodoStats() {
    console.log('Profile.js: Loading todo statistics');
    try {
        const response = await fetch('/api/todos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Profile.js: Failed to load todos, status:', response.status);
            throw new Error('Failed to load todos');
        }

        const todos = await response.json();
        console.log('Profile.js: Todos data received:', todos);

        const totalTodos = todos.length;
        const completedTodos = todos.filter(todo => todo.completed).length;
        const pendingTodos = totalTodos - completedTodos;

        // Update statistics
        const totalElement = document.getElementById('total-todos');
        const completedElement = document.getElementById('completed-todos');
        const pendingElement = document.getElementById('pending-todos');

        if (totalElement) totalElement.textContent = totalTodos;
        if (completedElement) completedElement.textContent = completedTodos;
        if (pendingElement) pendingElement.textContent = pendingTodos;

        // Display todos
        const todosList = document.getElementById('profile-todos-list');
        if (!todosList) {
            console.error('Profile.js: todos-list element not found');
            return;
        }

        // Wait for i18n to be ready
        while (!window.i18n || !window.i18n.t) {
            console.log('Profile.js: Waiting for i18n in loadTodoStats...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        todosList.innerHTML = '';
        
        if (!Array.isArray(todos) || todos.length === 0) {
            todosList.innerHTML = `<div class="text-gray-500 text-center py-4">${window.i18n.t('todos.noTodos')}</div>`;
            return;
        }

        for (const todo of todos) {
            const todoElement = await createTodoElement(todo);
            todosList.appendChild(todoElement);
        }
    } catch (error) {
        console.error('Profile.js: Error loading todo statistics:', error);
    }
}

// Create todo element for profile page
async function createTodoElement(todo) {
    // Wait for i18n to be ready
    while (!window.i18n || !window.i18n.t) {
        console.log('Profile.js: Waiting for i18n in createTodoElement...');
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const todoElement = document.createElement('div');
    todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    todoElement.dataset.id = todo.id;

    const title = todo.title;
    const description = todo.description;
    const completed = todo.completed;
    const completeText = window.i18n.t(completed ? 'todos.undo' : 'todos.complete');
    const deleteText = window.i18n.t('todos.delete');
    
    todoElement.innerHTML = `
        <div class="todo-header">
            <h3 class="todo-title ${completed ? 'completed-text' : ''}">${title}</h3>
            <div class="todo-actions">
                <button class="complete-btn" onclick="toggleTodo(${todo.id})" title="${completeText}">
                    <i class="fas ${completed ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})" title="${deleteText}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        ${description && !completed ? `<p class="todo-description">${description}</p>` : ''}
    `;

    return todoElement;
}

// Add todo management functions
async function toggleTodo(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/todos/${id}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to toggle todo');
        }

        // Reload todos to update the display
        await loadTodoStats();
    } catch (error) {
        console.error('Profile.js: Error toggling todo:', error);
    }
}

async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete todo');
        }

        // Reload todos to update the display
        await loadTodoStats();
    } catch (error) {
        console.error('Profile.js: Error deleting todo:', error);
    }
} 