package handlers

import (
	"log"
	"net/http"
	"time"

	"todo-app/database"
	"todo-app/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("your-secret-key") // In production, use environment variable

func Register(c *gin.Context) {
	log.Printf("Register: Starting registration process")

	var input models.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("Register: Failed to bind JSON input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	log.Printf("Register: Received registration request for email: %s", input.Email)

	user, err := database.CreateUser(input)
	if err != nil {
		log.Printf("Register: Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.Printf("Register: Successfully created user with ID: %d", user.ID)

	// Generate JWT token
	token, err := generateToken(user.ID)
	if err != nil {
		log.Printf("Register: Failed to generate token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}
	log.Printf("Register: Successfully generated token for user ID: %d", user.ID)

	// Set token as cookie
	c.SetCookie("token", token, 24*60*60, "/", "", false, true)
	log.Printf("Register: Set token cookie for user ID: %d", user.ID)

	c.JSON(http.StatusCreated, gin.H{
		"user":  user,
		"token": token,
	})
	log.Printf("Register: Sent successful response for user ID: %d", user.ID)
}

func Login(c *gin.Context) {
	log.Printf("Login: Starting login process")
	log.Printf("Login: Request headers: %v", c.Request.Header)

	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("Login: Failed to bind JSON input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	log.Printf("Login: Received login request for username: %s", input.Username)

	user, err := database.GetUserByUsername(input.Username)
	if err != nil {
		log.Printf("Login: User not found for username %s: %v", input.Username, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	log.Printf("Login: Found user with ID: %d", user.ID)

	// Compare passwords
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		log.Printf("Login: Invalid password for user ID %d: %v", user.ID, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	log.Printf("Login: Password verified for user ID: %d", user.ID)

	// Generate JWT token
	token, err := generateToken(user.ID)
	if err != nil {
		log.Printf("Login: Failed to generate token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}
	log.Printf("Login: Successfully generated token for user ID: %d", user.ID)

	// Set token as cookie
	c.SetCookie("token", token, 24*60*60, "/", "", false, true)
	log.Printf("Login: Set token cookie for user ID: %d", user.ID)

	c.JSON(http.StatusOK, gin.H{
		"user":  user,
		"token": token,
	})
	log.Printf("Login: Sent successful response for user ID: %d", user.ID)
}

func GetProfile(c *gin.Context) {
	userID := c.GetInt64("user_id")
	log.Printf("GetProfile: Processing request for user ID: %d", userID)

	user, err := database.GetUserByID(userID)
	if err != nil {
		log.Printf("GetProfile: Failed to get user with ID %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		return
	}
	log.Printf("GetProfile: Successfully retrieved profile for user ID: %d", userID)
	log.Printf("GetProfile: User data - Username: %s, Email: %s", user.Username, user.Email)

	// Ensure we're not sending the password
	user.Password = ""
	c.JSON(http.StatusOK, user)
}

func generateToken(userID int64) (string, error) {
	log.Printf("generateToken: Generating token for user ID: %d", userID)

	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		log.Printf("generateToken: Failed to sign token for user ID %d: %v", userID, err)
		return "", err
	}

	log.Printf("generateToken: Successfully generated token for user ID: %d", userID)
	return tokenString, nil
}
