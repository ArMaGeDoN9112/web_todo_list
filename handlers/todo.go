package handlers

import (
	"net/http"
	"strconv"

	"todo-app/database"
	"todo-app/models"

	"log"

	"github.com/gin-gonic/gin"
)

func GetTodos(c *gin.Context) {
	log.Printf("GetTodos: Processing request")
	userID := c.GetInt64("user_id")
	log.Printf("GetTodos: User ID: %d", userID)

	todos, err := database.GetTodos(userID)
	if err != nil {
		log.Printf("GetTodos: Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if todos == nil {
		log.Printf("GetTodos: No todos found, returning empty array")
		todos = []models.Todo{} // Ensure we always return an array, even if empty
	}

	log.Printf("GetTodos: Returning %d todos", len(todos))
	c.JSON(http.StatusOK, todos)
}

func CreateTodo(c *gin.Context) {
	log.Printf("CreateTodo: Processing request")
	userID := c.GetInt64("user_id")
	log.Printf("CreateTodo: User ID: %d", userID)

	// Verify user exists
	user, err := database.GetUserByID(userID)
	if err != nil {
		log.Printf("CreateTodo: Error verifying user: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}
	log.Printf("CreateTodo: Verified user: %s", user.Username)

	var input models.CreateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("CreateTodo: Invalid input format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	log.Printf("CreateTodo: Input received: %+v", input)

	todo, err := database.CreateTodo(userID, input)
	if err != nil {
		log.Printf("CreateTodo: Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Printf("CreateTodo: Todo created successfully: %+v", todo)

	c.JSON(http.StatusCreated, todo)
}

func UpdateTodo(c *gin.Context) {
	log.Printf("UpdateTodo: Processing request")
	userID := c.GetInt64("user_id")
	log.Printf("UpdateTodo: User ID: %d", userID)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		log.Printf("UpdateTodo: Invalid ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	log.Printf("UpdateTodo: Todo ID: %d", id)

	var input models.UpdateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("UpdateTodo: Invalid input format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	log.Printf("UpdateTodo: Input received: %+v", input)

	if err := database.UpdateTodo(userID, id, input); err != nil {
		log.Printf("UpdateTodo: Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Printf("UpdateTodo: Todo updated successfully")

	c.JSON(http.StatusOK, gin.H{"message": "Todo updated successfully"})
}

func ToggleTodo(c *gin.Context) {
	log.Printf("ToggleTodo: Processing request")
	userID := c.GetInt64("user_id")
	log.Printf("ToggleTodo: User ID: %d", userID)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		log.Printf("ToggleTodo: Invalid ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	log.Printf("ToggleTodo: Todo ID: %d", id)

	// Get current todo status
	todo, err := database.GetTodoByID(userID, id)
	if err != nil {
		log.Printf("ToggleTodo: Error getting todo: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get todo"})
		return
	}

	// Toggle completion status
	updateInput := models.UpdateTodoInput{
		Title:       todo.Title,
		Description: todo.Description,
		Completed:   !todo.Completed,
	}

	if err := database.UpdateTodo(userID, id, updateInput); err != nil {
		log.Printf("ToggleTodo: Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Printf("ToggleTodo: Todo status toggled successfully")

	// Return updated todo
	updatedTodo, err := database.GetTodoByID(userID, id)
	if err != nil {
		log.Printf("ToggleTodo: Error getting updated todo: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated todo"})
		return
	}

	c.JSON(http.StatusOK, updatedTodo)
}

func DeleteTodo(c *gin.Context) {
	log.Printf("DeleteTodo: Processing request")
	userID := c.GetInt64("user_id")
	log.Printf("DeleteTodo: User ID: %d", userID)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		log.Printf("DeleteTodo: Invalid ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	log.Printf("DeleteTodo: Todo ID: %d", id)

	if err := database.DeleteTodo(userID, id); err != nil {
		log.Printf("DeleteTodo: Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Printf("DeleteTodo: Todo deleted successfully")

	c.JSON(http.StatusOK, gin.H{"message": "Todo deleted successfully"})
}
