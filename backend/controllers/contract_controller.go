package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/user/ContractFlow/backend/models"
	"github.com/user/ContractFlow/backend/services"
)

type ContractController struct{}

func NewContractController() *ContractController {
	return &ContractController{}
}

func (ctrl *ContractController) GetContracts(c *gin.Context) {
	userID, _ := c.Get("user_id")
	contracts, err := services.GetContractsByUserID(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch contracts"})
		return
	}
	c.JSON(http.StatusOK, contracts)
}

func (ctrl *ContractController) CreateContract(c *gin.Context) {
	var contract models.Contract
	if err := c.ShouldBindJSON(&contract); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contract data"})
		return
	}

	userID, _ := c.Get("user_id")
	contract.UserID = userID.(string)
	contract.Status = models.StatusDraft

	err := services.CreateContract(c.Request.Context(), &contract)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contract"})
		return
	}

	c.JSON(http.StatusCreated, contract)
}

func (ctrl *ContractController) GetContract(c *gin.Context) {
	contractID := c.Param("id")
	userID, _ := c.Get("user_id")

	contract, err := services.GetContractByID(c.Request.Context(), contractID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contract not found"})
		return
	}

	c.JSON(http.StatusOK, contract)
}

func (ctrl *ContractController) SendContract(c *gin.Context) {
	// Placeholder for PandaDoc integration
	c.JSON(http.StatusNotImplemented, gin.H{"message": "PandaDoc integration coming soon"})
}
