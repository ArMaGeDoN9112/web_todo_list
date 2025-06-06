package handlers

import (
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
	userID := c.GetInt64("userID")
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
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

	todos, err := database.GetTeamTodos(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load team todos"})
		return
	}

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
	userID := c.GetInt64("userID")
	teamID, err := strconv.ParseInt(c.Param("teamId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	todoID, err := strconv.ParseInt(c.Param("todoId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todo ID"})
		return
	}

	var input models.UpdateTeamTodoInput
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

	err = database.UpdateTeamTodo(teamID, todoID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update team todo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todo updated successfully"})
}

func DeleteTeamTodo(c *gin.Context) {
	userID := c.GetInt64("userID")
	teamID, err := strconv.ParseInt(c.Param("teamId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	todoID, err := strconv.ParseInt(c.Param("todoId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todo ID"})
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

	err = database.DeleteTeamTodo(teamID, todoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete team todo"})
		return
	}

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

	teams, err := database.GetUserTeams(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get teams"})
		return
	}

	c.JSON(http.StatusOK, teams)
}
