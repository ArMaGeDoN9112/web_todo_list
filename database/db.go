package database

import (
	"database/sql"
	"log"
	"time"

	"todo-app/models"

	"golang.org/x/crypto/bcrypt"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func InitDB() error {
	var err error
	db, err = sql.Open("sqlite3", "./todos.db")
	if err != nil {
		return err
	}

	// Enable foreign key constraints
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		log.Printf("InitDB: Error enabling foreign keys: %v", err)
		return err
	}
	log.Printf("InitDB: Foreign key constraints enabled")

	// Drop existing tables if they exist
	_, err = db.Exec("DROP TABLE IF EXISTS todos")
	if err != nil {
		log.Printf("InitDB: Error dropping todos table: %v", err)
		return err
	}
	_, err = db.Exec("DROP TABLE IF EXISTS users")
	if err != nil {
		log.Printf("InitDB: Error dropping users table: %v", err)
		return err
	}
	log.Printf("InitDB: Existing tables dropped")

	// Create users table
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		email TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	// Create todos table with user_id and foreign key constraint
	createTodosTable := `
	CREATE TABLE IF NOT EXISTS todos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		title TEXT NOT NULL,
		description TEXT,
		completed BOOLEAN DEFAULT FALSE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);`

	_, err = db.Exec(createUsersTable)
	if err != nil {
		log.Printf("InitDB: Error creating users table: %v", err)
		return err
	}
	log.Printf("InitDB: Users table created")

	_, err = db.Exec(createTodosTable)
	if err != nil {
		log.Printf("InitDB: Error creating todos table: %v", err)
		return err
	}
	log.Printf("InitDB: Todos table created")

	// Verify foreign key constraints
	var foreignKeysEnabled int
	err = db.QueryRow("PRAGMA foreign_keys").Scan(&foreignKeysEnabled)
	if err != nil {
		log.Printf("InitDB: Error checking foreign keys: %v", err)
		return err
	}
	log.Printf("InitDB: Foreign keys enabled: %d", foreignKeysEnabled)

	return nil
}

// User functions
func CreateUser(input models.RegisterInput) (models.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, err
	}

	now := time.Now()
	result, err := db.Exec(
		"INSERT INTO users (username, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		input.Username, input.Email, string(hashedPassword), now, now,
	)
	if err != nil {
		return models.User{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.User{}, err
	}

	return models.User{
		ID:        id,
		Username:  input.Username,
		Email:     input.Email,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func GetUserByEmail(email string) (models.User, error) {
	var user models.User
	err := db.QueryRow(
		"SELECT id, username, email, password, created_at, updated_at FROM users WHERE email = ?",
		email,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	return user, err
}

func GetUserByUsername(username string) (models.User, error) {
	var user models.User
	err := db.QueryRow(
		"SELECT id, username, email, password, created_at, updated_at FROM users WHERE username = ?",
		username,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	return user, err
}

func GetUserByID(id int64) (models.User, error) {
	var user models.User
	err := db.QueryRow(
		"SELECT id, username, email, password, created_at, updated_at FROM users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	return user, err
}

// Todo functions
func GetTodos(userID int64) ([]models.Todo, error) {
	log.Printf("GetTodos: Fetching todos for user ID: %d", userID)

	// First verify the user exists
	var userExists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)", userID).Scan(&userExists)
	if err != nil {
		log.Printf("GetTodos: Error checking if user exists: %v", err)
		return nil, err
	}
	if !userExists {
		log.Printf("GetTodos: User ID %d does not exist", userID)
		return []models.Todo{}, nil
	}

	// Get the count of all todos for debugging
	var totalTodos int
	err = db.QueryRow("SELECT COUNT(*) FROM todos").Scan(&totalTodos)
	if err != nil {
		log.Printf("GetTodos: Error getting total todos count: %v", err)
	} else {
		log.Printf("GetTodos: Total todos in database: %d", totalTodos)
	}

	// Get the count of todos for this user
	var userTodosCount int
	err = db.QueryRow("SELECT COUNT(*) FROM todos WHERE user_id = ?", userID).Scan(&userTodosCount)
	if err != nil {
		log.Printf("GetTodos: Error getting user todos count: %v", err)
	} else {
		log.Printf("GetTodos: Total todos for user %d: %d", userID, userTodosCount)
	}

	rows, err := db.Query(
		"SELECT id, user_id, title, description, completed, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY created_at DESC",
		userID,
	)
	if err != nil {
		log.Printf("GetTodos: Database error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var todos []models.Todo
	for rows.Next() {
		var todo models.Todo
		err := rows.Scan(&todo.ID, &todo.UserID, &todo.Title, &todo.Description, &todo.Completed, &todo.CreatedAt, &todo.UpdatedAt)
		if err != nil {
			log.Printf("GetTodos: Error scanning row: %v", err)
			return nil, err
		}
		log.Printf("GetTodos: Found todo - ID: %d, UserID: %d, Title: %s", todo.ID, todo.UserID, todo.Title)
		todos = append(todos, todo)
	}

	if err = rows.Err(); err != nil {
		log.Printf("GetTodos: Error iterating rows: %v", err)
		return nil, err
	}

	log.Printf("GetTodos: Found %d todos for user %d", len(todos), userID)
	return todos, nil
}

func CreateTodo(userID int64, todo models.CreateTodoInput) (models.Todo, error) {
	log.Printf("CreateTodo: Creating todo for user %d with title: %s", userID, todo.Title)
	now := time.Now()

	result, err := db.Exec(
		"INSERT INTO todos (user_id, title, description, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		userID, todo.Title, todo.Description, false, now, now,
	)
	if err != nil {
		log.Printf("CreateTodo: Database error: %v", err)
		return models.Todo{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Printf("CreateTodo: Error getting last insert ID: %v", err)
		return models.Todo{}, err
	}
	log.Printf("CreateTodo: Successfully created todo with ID: %d for user %d", id, userID)

	return models.Todo{
		ID:          id,
		UserID:      userID,
		Title:       todo.Title,
		Description: todo.Description,
		Completed:   false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func UpdateTodo(userID int64, todoID int64, todo models.UpdateTodoInput) error {
	log.Printf("UpdateTodo: Updating todo %d for user %d", todoID, userID)

	// First get the existing todo
	var existingTodo models.Todo
	err := db.QueryRow(
		"SELECT id, title, description, completed FROM todos WHERE id = ? AND user_id = ?",
		todoID, userID,
	).Scan(&existingTodo.ID, &existingTodo.Title, &existingTodo.Description, &existingTodo.Completed)
	if err != nil {
		log.Printf("UpdateTodo: Error fetching existing todo: %v", err)
		return err
	}
	log.Printf("UpdateTodo: Existing todo: %+v", existingTodo)

	// Use existing values if not provided in the update
	title := todo.Title
	if title == "" {
		title = existingTodo.Title
	}
	description := todo.Description
	if description == "" {
		description = existingTodo.Description
	}
	completed := todo.Completed
	if !todo.Completed {
		completed = existingTodo.Completed
	}

	log.Printf("UpdateTodo: Updating with values - title: %s, description: %s, completed: %v",
		title, description, completed)

	_, err = db.Exec(
		"UPDATE todos SET title = ?, description = ?, completed = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		title, description, completed, time.Now(), todoID, userID,
	)
	if err != nil {
		log.Printf("UpdateTodo: Error updating todo: %v", err)
		return err
	}
	log.Printf("UpdateTodo: Successfully updated todo")
	return nil
}

func DeleteTodo(userID int64, todoID int64) error {
	_, err := db.Exec("DELETE FROM todos WHERE id = ? AND user_id = ?", todoID, userID)
	return err
}

func GetTodoByID(userID int64, todoID int64) (models.Todo, error) {
	log.Printf("GetTodoByID: Fetching todo ID %d for user ID %d", todoID, userID)
	var todo models.Todo
	err := db.QueryRow(
		"SELECT id, user_id, title, description, completed, created_at, updated_at FROM todos WHERE id = ? AND user_id = ?",
		todoID, userID,
	).Scan(&todo.ID, &todo.UserID, &todo.Title, &todo.Description, &todo.Completed, &todo.CreatedAt, &todo.UpdatedAt)
	if err != nil {
		log.Printf("GetTodoByID: Error fetching todo: %v", err)
		return models.Todo{}, err
	}
	log.Printf("GetTodoByID: Found todo - ID: %d, UserID: %d, Title: %s", todo.ID, todo.UserID, todo.Title)
	return todo, nil
}
