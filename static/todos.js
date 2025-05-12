document.addEventListener('DOMContentLoaded', () => {
    console.log('Todos: Page loaded');
    checkAuth();
    loadTodos();
    
    // Event Listeners
    if (todoForm) {
        todoForm.addEventListener('submit', addTodo);
    }
});

function checkAuth() {
    console.log('Todos: Checking authentication');
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Todos: No token found, redirecting to login');
        window.location.href = '/login';
        return false;
    }
    console.log('Todos: Token found');
    return true;
}

async function loadTodos() {
    console.log('Todos: Loading todos');
    if (!checkAuth()) return;
    
    const token = localStorage.getItem('token');
    console.log('Todos: Using token:', token ? 'Token exists' : 'No token');
    
    try {
        console.log('Todos: Sending fetch request to /api/todos');
        const response = await fetch('/api/todos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Todos: Response status:', response.status);
        if (!response.ok) {
            if (response.status === 401) {
                console.log('Todos: Unauthorized, redirecting to login');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            const errorText = await response.text();
            console.error('Todos: Server error response:', errorText);
            throw new Error('Failed to load todos');
        }
        
        const todos = await response.json();
        console.log('Todos: Received todos:', todos);
        
        if (!Array.isArray(todos)) {
            console.error('Todos: Invalid response format - expected array, got:', typeof todos);
            throw new Error('Invalid response format from server');
        }
        
        await displayTodos(todos);
    } catch (error) {
        console.error('Todos: Error loading todos:', error);
        if (window.i18n && window.i18n.t) {
            showError(window.i18n.t('todos.fetchError'));
        } else {
            showError('Failed to load todos. Please try again.');
        }
    }
}

async function displayTodos(todos) {
    console.log('Todos: Displaying todos:', todos);
    if (!todosList) {
        console.error('Todos: todos-list element not found');
        return;
    }
    
    // Wait for i18n to be ready
    while (!window.i18n || !window.i18n.t) {
        console.log('Todos: Waiting for i18n in displayTodos...');
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    todosList.innerHTML = '';
    
    // if (!Array.isArray(todos) || todos.length === 0) {
    //     todosList.innerHTML = `<div class="text-gray-500 text-center py-4">${window.i18n.t('todos.noTodos')}</div>`;
    //     return;
    // }
    
    for (const todo of todos) {
        const todoElement = await createTodoElement(todo);
        todosList.appendChild(todoElement);
    }
}

// DOM Elements
let todoForm;
let todoInput;
let todoDescription;
let todosList;
let errorMessage;

// Initialize the page
async function initialize() {
    console.log('Todos: Starting initialization');
    
    // Get DOM elements
    todoForm = document.getElementById('new-todo-form');
    todoInput = document.getElementById('new-todo');
    todoDescription = document.getElementById('new-todo-description');
    todosList = document.getElementById('todos-list');
    errorMessage = document.getElementById('error-message');
    
    // Check if we have all required DOM elements
    console.log('Todos: Checking DOM elements:', {
        todoForm: !!todoForm,
        todoInput: !!todoInput,
        todoDescription: !!todoDescription,
        todosList: !!todosList,
        errorMessage: !!errorMessage
    });
    
    if (!todosList) {
        console.error('Todos: todos-list element not found');
        if (errorMessage) {
            showError('Page initialization failed: missing required elements');
        }
        return;
    }
    
    // Wait for i18n to be fully initialized
    console.log('Todos: Waiting for i18n...');
    while (!window.i18n || !window.i18n.t) {
        console.log('Todos: i18n not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('Todos: i18n is ready');
    
    if (!checkAuth()) {
        console.log('Todos: Authentication check failed');
        return;
    }
    
    // Set up event listeners
    if (todoForm) {
        console.log('Todos: Setting up form event listener');
        todoForm.addEventListener('submit', addTodo);
    } else {
        console.error('Todos: todo form not found');
    }
    
    // Load initial todos
    console.log('Todos: Loading initial todos');
    await loadTodos();
    console.log('Todos: Initialization complete');
}

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Todos: DOM Content Loaded');
    initialize().catch(error => {
        console.error('Todos: Initialization failed:', error);
        if (errorMessage) {
            showError('Failed to initialize page. Please refresh.');
        }
    });
});

// Show error message
function showError(message) {
    console.log('Todos: Showing error:', message);
    if (!errorMessage) {
        console.error('Todos: Error message element not found');
        return;
    }
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

// Create todo item HTML
async function createTodoElement(todo) {
    // Wait for i18n to be ready
    while (!window.i18n || !window.i18n.t) {
        console.log('Todos: Waiting for i18n in createTodoElement...');
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

// Add new todo
async function addTodo(e) {
    e.preventDefault();
    if (!checkAuth()) return;

    const title = todoInput.value.trim();
    const description = todoDescription.value.trim();

    // Wait for i18n to be ready
    while (!window.i18n || !window.i18n.t) {
        console.log('Todos: Waiting for i18n in addTodo...');
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!title) {
        showError(window.i18n.t('todos.titleRequired'));
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            throw new Error(window.i18n.t('todos.addError'));
        }

        const todo = await response.json();
        console.log('Todos: Added new todo:', todo);
        
        // Clear form
        todoInput.value = '';
        todoDescription.value = '';
        todoInput.focus();
        
        // Reload todos to ensure consistent state
        await loadTodos();
    } catch (error) {
        console.error('Todos: Error adding todo:', error);
        showError(error.message);
    }
}

// Toggle todo completion
async function toggleTodo(id) {
    if (!checkAuth()) return;
    
    try {
        // Wait for i18n to be ready
        while (!window.i18n || !window.i18n.t) {
            console.log('Todos: Waiting for i18n in toggleTodo...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/todos/${id}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            throw new Error(window.i18n.t('todos.toggleError'));
        }

        // Reload todos to ensure consistent state
        await loadTodos();
    } catch (error) {
        console.error('Todos: Error toggling todo:', error);
        showError(error.message);
    }
}

// Delete todo
async function deleteTodo(id) {
    if (!checkAuth()) return;
    
    try {
        // Wait for i18n to be ready
        while (!window.i18n || !window.i18n.t) {
            console.log('Todos: Waiting for i18n in deleteTodo...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            throw new Error(window.i18n.t('todos.deleteError'));
        }

        // Reload todos to ensure consistent state
        await loadTodos();
    } catch (error) {
        console.error('Todos: Error deleting todo:', error);
        showError(error.message);
    }
}

function logout() {
    console.log('Todos: Logging out');
    localStorage.removeItem('token');
    window.location.href = '/login';
} 