document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todoForm');
    const todoList = document.getElementById('todoList');

    // Load todos on page load
    loadTodos();

    // Handle form submission
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description }),
            });

            if (!response.ok) throw new Error('Failed to create todo');

            todoForm.reset();
            loadTodos();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create todo');
        }
    });

    // Load todos from the server
    async function loadTodos() {
        try {
            const response = await fetch('/api/todos');
            const todos = await response.json();
            renderTodos(todos);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load todos');
        }
    }

    // Render todos in the UI
    function renderTodos(todos) {
        todoList.innerHTML = '';
        todos.forEach(todo => {
            const todoElement = createTodoElement(todo);
            todoList.appendChild(todoElement);
        });
    }

    // Create a todo element
    function createTodoElement(todo) {
        const div = document.createElement('div');
        div.className = `todo-item bg-white rounded-lg shadow-md p-4 flex items-start justify-between ${todo.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="custom-checkbox ${todo.completed ? 'checked' : ''}" data-id="${todo.id}"></div>
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">${todo.title}</h3>
                    <p class="text-gray-600">${todo.description || ''}</p>
                </div>
            </div>
            <button class="delete-btn text-red-500 hover:text-red-700" data-id="${todo.id}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        `;

        // Add event listeners
        const checkbox = div.querySelector('.custom-checkbox');
        checkbox.addEventListener('click', () => toggleTodo(todo.id, !todo.completed));

        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        return div;
    }

    // Toggle todo completion status
    async function toggleTodo(id, completed) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed }),
            });

            if (!response.ok) throw new Error('Failed to update todo');
            loadTodos();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update todo');
        }
    }

    // Delete todo
    async function deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this todo?')) return;

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete todo');
            loadTodos();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to delete todo');
        }
    }
}); 