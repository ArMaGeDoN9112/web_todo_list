package handlers

import (
	"log"
	"net/http"
	"strconv"

	"todo-app/database"
	"todo-app/models"

	"github.com/gin-gonic/gin"
)

func GetTeamsPage(c *gin.Context) {
	userID := c.GetInt64("user_id")
	teams, err := database.GetUserTeams(userID)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"error": "Failed to load teams",
		})
		return
	}

	c.HTML(http.StatusOK, "teams.html", gin.H{
		"teams": teams,
		"title": "Team Todos",
	})
}

func CreateTeam(c *gin.Context) {
	userID := c.GetInt64("user_id")
	var input models.CreateTeamInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team, err := database.CreateTeam(userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create team"})
		return
	}

	c.JSON(http.StatusOK, team)
}

func JoinTeam(c *gin.Context) {
	userID := c.GetInt64("user_id")
	var input models.JoinTeamInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team, err := database.JoinTeam(userID, input.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team code"})
		return
	}

	c.JSON(http.StatusOK, team)
}

func GetTeamTodos(c *gin.Context) {
	userID := c.GetInt64("user_id")
	teamID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		log.Printf("GetTeamTodos: Invalid team ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}
	log.Printf("GetTeamTodos: Getting todos for team %d (user %d)", teamID, userID)

	// Verify user is a member of the team
	teams, err := database.GetUserTeams(userID)
	if err != nil {
		log.Printf("GetTeamTodos: Error verifying team membership: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify team membership"})
		return
	}

	isMember := false
	for _, team := range teams {
		if team.ID == teamID {
			isMember = true
			break
		}
	}

	if !isMember {
		log.Printf("GetTeamTodos: User %d is not a member of team %d", userID, teamID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this team"})
		return
	}

	todos, err := database.GetTeamTodos(teamID)
	if err != nil {
		log.Printf("GetTeamTodos: Error loading todos for team %d: %v", teamID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load team todos"})
		return
	}

	if todos == nil {
		log.Printf("GetTeamTodos: No todos found for team %d, returning empty array", teamID)
		todos = []models.TeamTodo{} // Ensure we always return an array, even if empty
	}

	log.Printf("GetTeamTodos: Returning %d todos for team %d", len(todos), teamID)
	c.JSON(http.StatusOK, todos)
}

func CreateTeamTodo(c *gin.Context) {
	userID := c.GetInt64("user_id")
	teamID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	var input models.CreateTeamTodoInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify user is a member of the team
	teams, err := database.GetUserTeams(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify team membership"})
		return
	}

	isMember := false
	for _, team := range teams {
		if team.ID == teamID {
			isMember = true
			break
		}
	}

	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this team"})
		return
	}

	todo, err := database.CreateTeamTodo(teamID, userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create team todo"})
		return
	}

	c.JSON(http.StatusOK, todo)
}

func UpdateTeamTodo(c *gin.Context) {
	userID := c.GetInt64("user_id")
	teamID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		log.Printf("UpdateTeamTodo: Invalid team ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	todoID, err := strconv.ParseInt(c.Param("todoId"), 10, 64)
	if err != nil {
		log.Printf("UpdateTeamTodo: Invalid todo ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todo ID"})
		return
	}

	log.Printf("UpdateTeamTodo: Updating todo %d for team %d (user %d)", todoID, teamID, userID)

	var input models.UpdateTeamTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("UpdateTeamTodo: Invalid input format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify user is a member of the team
	teams, err := database.GetUserTeams(userID)
	if err != nil {
		log.Printf("UpdateTeamTodo: Error verifying team membership: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify team membership"})
		return
	}

	isMember := false
	for _, team := range teams {
		if team.ID == teamID {
			isMember = true
			break
		}
	}

	if !isMember {
		log.Printf("UpdateTeamTodo: User %d is not a member of team %d", userID, teamID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this team"})
		return
	}

	err = database.UpdateTeamTodo(teamID, todoID, input)
	if err != nil {
		log.Printf("UpdateTeamTodo: Error updating todo: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update team todo"})
		return
	}

	log.Printf("UpdateTeamTodo: Successfully updated todo %d for team %d", todoID, teamID)
	c.JSON(http.StatusOK, gin.H{"message": "Todo updated successfully"})
}

func DeleteTeamTodo(c *gin.Context) {
	userID := c.GetInt64("user_id")
	teamID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		log.Printf("DeleteTeamTodo: Invalid team ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	todoID, err := strconv.ParseInt(c.Param("todoId"), 10, 64)
	if err != nil {
		log.Printf("DeleteTeamTodo: Invalid todo ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todo ID"})
		return
	}

	log.Printf("DeleteTeamTodo: Deleting todo %d from team %d (user %d)", todoID, teamID, userID)

	// Verify user is a member of the team
	teams, err := database.GetUserTeams(userID)
	if err != nil {
		log.Printf("DeleteTeamTodo: Error verifying team membership: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify team membership"})
		return
	}

	isMember := false
	for _, team := range teams {
		if team.ID == teamID {
			isMember = true
			break
		}
	}

	if !isMember {
		log.Printf("DeleteTeamTodo: User %d is not a member of team %d", userID, teamID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this team"})
		return
	}

	err = database.DeleteTeamTodo(teamID, todoID)
	if err != nil {
		log.Printf("DeleteTeamTodo: Error deleting todo: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete team todo"})
		return
	}

	log.Printf("DeleteTeamTodo: Successfully deleted todo %d from team %d", todoID, teamID)
	c.JSON(http.StatusOK, gin.H{"message": "Todo deleted successfully"})
}

func DeleteTeam(c *gin.Context) {
	userID := c.GetInt64("user_id")
	teamID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	// Проверяем, является ли пользователь создателем команды
	var team models.Team
	err = database.GetTeamByID(teamID, &team)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify team ownership"})
		return
	}

	if team.CreatedBy != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only team creator can delete the team"})
		return
	}

	// Удаляем команду (все связанные задачи и членства будут удалены автоматически благодаря CASCADE)
	err = database.DeleteTeam(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete team"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team deleted successfully"})
}

func GetTeams(c *gin.Context) {
	userID := c.GetInt64("user_id")
	log.Printf("GetTeams: Getting teams for user %d", userID)

	teams, err := database.GetUserTeams(userID)
	if err != nil {
		log.Printf("GetTeams: Error getting teams for user %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get teams"})
		return
	}

	log.Printf("GetTeams: Found %d teams for user %d", len(teams), userID)
	for _, team := range teams {
		log.Printf("GetTeams: Team %d: %s (code: %s)", team.ID, team.Name, team.Code)
	}

	c.JSON(http.StatusOK, teams)
}
