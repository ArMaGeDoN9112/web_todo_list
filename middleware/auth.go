package middleware

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"todo-app/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("your-secret-key") // In production, use environment variable

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("AuthMiddleware: Processing request for path: %s", c.Request.URL.Path)
		log.Printf("AuthMiddleware: Request headers: %v", c.Request.Header)
		log.Printf("AuthMiddleware: Cookies: %v", c.Request.Cookies())

		// First try to get token from cookie
		tokenString, err := c.Cookie("token")
		if err != nil {
			log.Printf("AuthMiddleware: No token cookie found: %v", err)
			// If no cookie, try Authorization header
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				log.Printf("AuthMiddleware: No Authorization header found")
				if strings.HasPrefix(c.Request.URL.Path, "/api/") {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
				} else {
					c.Redirect(http.StatusFound, "/login")
				}
				c.Abort()
				return
			}
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			log.Printf("AuthMiddleware: Found token in Authorization header")
		} else {
			log.Printf("AuthMiddleware: Found token in cookie")
		}

		log.Printf("AuthMiddleware: Token string: %s", tokenString)

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				log.Printf("AuthMiddleware: Unexpected signing method: %v", token.Header["alg"])
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte("your-secret-key"), nil
		})

		if err != nil {
			log.Printf("AuthMiddleware: Error parsing token: %v", err)
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			} else {
				c.Redirect(http.StatusFound, "/login")
			}
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			userID := int64(claims["user_id"].(float64))
			log.Printf("AuthMiddleware: Valid token for user ID: %d", userID)
			log.Printf("AuthMiddleware: Token claims: %v", claims)

			// Verify user exists
			user, err := database.GetUserByID(userID)
			if err != nil {
				log.Printf("AuthMiddleware: User not found for ID %d: %v", userID, err)
				if strings.HasPrefix(c.Request.URL.Path, "/api/") {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				} else {
					c.Redirect(http.StatusFound, "/login")
				}
				c.Abort()
				return
			}
			log.Printf("AuthMiddleware: Verified user: %s (ID: %d)", user.Username, user.ID)

			c.Set("user_id", userID)
			c.Next()
		} else {
			log.Printf("AuthMiddleware: Invalid token claims or token not valid")
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			} else {
				c.Redirect(http.StatusFound, "/login")
			}
			c.Abort()
		}
	}
}
