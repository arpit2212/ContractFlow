package middleware

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/user/ContractFlow/backend/config"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Println("AuthMiddleware: Missing Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Printf("AuthMiddleware: Invalid header format: %s", authHeader)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(config.Env.SupabaseJWTSecret), nil
		})

		if err != nil {
			log.Printf("AuthMiddleware: Token parsing error: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Token error: %v", err)})
			c.Abort()
			return
		}

		if !token.Valid {
			log.Println("AuthMiddleware: Token is invalid")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Check 30-minute session expiry
		// Supabase JWTs have "iat" (issued at) claim
		if iat, ok := claims["iat"].(float64); ok {
			issuedAt := time.Unix(int64(iat), 0)
			sessionAge := time.Since(issuedAt)
			maxSessionAge := 30 * time.Minute

			if sessionAge > maxSessionAge {
				log.Printf("AuthMiddleware: Session expired. Age: %v, Max: %v", sessionAge, maxSessionAge)
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":        "Session expired",
					"session_age": sessionAge.Round(time.Second).String(),
					"max_age":     maxSessionAge.String(),
				})
				c.Abort()
				return
			}
		}

		userID, ok := claims["sub"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}
