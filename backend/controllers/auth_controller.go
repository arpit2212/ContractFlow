package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/user/ContractFlow/backend/models"
	"github.com/user/ContractFlow/backend/services"
)

type AuthController struct{}

func NewAuthController() *AuthController {
	return &AuthController{}
}

func (ctrl *AuthController) GoogleAuth(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	// userID comes from middleware (sub claim)
	userID, _ := c.Get("user_id")
	user.ID = userID.(string)

	err := services.SyncUser(c.Request.Context(), &user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync user profile"})
		return
	}

	profile, err := services.GetUserByID(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}
