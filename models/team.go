package models

import "time"

type Team struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	CreatedBy int64     `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type TeamMember struct {
	ID        int64     `json:"id"`
	TeamID    int64     `json:"team_id"`
	UserID    int64     `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

type TeamTodo struct {
	ID          int64     `json:"id"`
	TeamID      int64     `json:"team_id"`
	CreatedBy   int64     `json:"created_by"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Completed   bool      `json:"completed"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateTeamInput struct {
	Name string `json:"name" binding:"required"`
}

type JoinTeamInput struct {
	Code string `json:"code" binding:"required"`
}

type CreateTeamTodoInput struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}

type UpdateTeamTodoInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Completed   bool   `json:"completed"`
}
