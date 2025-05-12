package main

import (
	"log"
	"net/http"

	"todo-app/database"
	"todo-app/handlers"
	"todo-app/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize Gin router
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 hours
	}))

	// Serve static files
	r.Static("/static", "./static")
	r.LoadHTMLGlob("templates/*")

	// Public routes
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/login")
	})
	r.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{
			"title": "Login - To-Do List",
		})
	})
	r.GET("/register", func(c *gin.Context) {
		c.HTML(http.StatusOK, "register.html", gin.H{
			"title": "Register - To-Do List",
		})
	})

	// Public API routes
	r.POST("/api/register", handlers.Register)
	r.POST("/api/login", handlers.Login)

	// Protected API routes
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/profile", handlers.GetProfile)
		api.GET("/todos", handlers.GetTodos)
		api.POST("/todos", handlers.CreateTodo)
		api.PUT("/todos/:id", handlers.UpdateTodo)
		api.PUT("/todos/:id/toggle", handlers.ToggleTodo)
		api.DELETE("/todos/:id", handlers.DeleteTodo)
	}

	// Protected pages
	protected := r.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/profile", func(c *gin.Context) {
			c.HTML(http.StatusOK, "profile.html", gin.H{
				"title": "Profile - To-Do List",
			})
		})
		protected.GET("/todos", func(c *gin.Context) {
			c.HTML(http.StatusOK, "index.html", gin.H{
				"title": "My Todos",
			})
		})
	}

	// Start server
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
