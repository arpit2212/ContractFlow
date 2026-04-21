package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/user/ContractFlow/backend/services"
)

type PandaDocController struct {
	Service services.PandaDocServiceInterface
}

func NewPandaDocController() *PandaDocController {
	return &PandaDocController{
		Service: services.NewPandaDocService(),
	}
}

func (ctrl *PandaDocController) getID(c *gin.Context) string {
	userID, exists := c.Get("user_id")
	if !exists {
		return "test-user"
	}
	return userID.(string)
}

func (ctrl *PandaDocController) getAPIKey(c *gin.Context) string {
	return c.GetHeader("X-PandaDoc-Api-Key")
}

func (ctrl *PandaDocController) GetDocuments(c *gin.Context) {
	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required. Please add your API key in settings."})
		return
	}
	docs, err := ctrl.Service.GetDocuments(c.Request.Context(), userID, apiKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, docs)
}

func (ctrl *PandaDocController) GetDocumentDetails(c *gin.Context) {
	id := c.Param("id")
	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required"})
		return
	}
	doc, err := ctrl.Service.GetDocumentDetails(c.Request.Context(), userID, apiKey, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, doc)
}

func (ctrl *PandaDocController) GetTemplates(c *gin.Context) {
	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required"})
		return
	}
	templates, err := ctrl.Service.GetTemplates(c.Request.Context(), userID, apiKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, templates)
}

func (ctrl *PandaDocController) GetTemplateDetails(c *gin.Context) {
	id := c.Param("id")
	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required"})
		return
	}
	details, err := ctrl.Service.GetTemplateDetails(c.Request.Context(), userID, apiKey, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, details)
}

func (ctrl *PandaDocController) CreateDocument(c *gin.Context) {
	var payload interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required"})
		return
	}
	doc, err := ctrl.Service.CreateDocument(c.Request.Context(), userID, apiKey, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, doc)
}

func (ctrl *PandaDocController) UpdateDocument(c *gin.Context) {
	id := c.Param("id")
	var payload interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required"})
		return
	}
	doc, err := ctrl.Service.UpdateDocument(c.Request.Context(), userID, apiKey, id, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, doc)
}

func (ctrl *PandaDocController) SendDocument(c *gin.Context) {
	id := c.Param("id")
	var payload interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		payload = gin.H{}
	}

	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required"})
		return
	}
	doc, err := ctrl.Service.SendDocument(c.Request.Context(), userID, apiKey, id, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, doc)
}

func (ctrl *PandaDocController) CreateAndSendDocument(c *gin.Context) {
	var payload interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required. Please add your API key in settings."})
		return
	}
	doc, err := ctrl.Service.CreateAndSendDocument(c.Request.Context(), userID, apiKey, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, doc)
}

func (ctrl *PandaDocController) BulkCreateAndSendDocuments(c *gin.Context) {
	var payloads []interface{}
	if err := c.ShouldBindJSON(&payloads); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required"})
		return
	}
	results, err := ctrl.Service.BulkCreateAndSendDocuments(c.Request.Context(), userID, apiKey, payloads)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, results)
}

func (ctrl *PandaDocController) GetAnalytics(c *gin.Context) {
	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required"})
		return
	}
	analytics, err := ctrl.Service.GetAnalytics(c.Request.Context(), userID, apiKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}

func (ctrl *PandaDocController) GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"connected": true,
		"mode":      "user_provided_api_key",
	})
}
