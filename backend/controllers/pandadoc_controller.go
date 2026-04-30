package controllers

import (
	"log"
	"net/http"
	"strconv"
	"strings"

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
	apiKey := c.GetHeader("X-PandaDoc-Api-Key")
	if apiKey == "" {
		apiKey = c.GetHeader("x-pandadoc-api-key")
	}
	return strings.TrimSpace(apiKey)
}

func (ctrl *PandaDocController) GetDocuments(c *gin.Context) {
	userID := ctrl.getID(c)
	apiKey := ctrl.getAPIKey(c)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required. Please add your API key in settings."})
		return
	}

	page := 1
	limit := 25
	refresh := c.Query("refresh") == "true"
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	log.Printf("Controller: GetDocuments for user %s (page=%d, limit=%d, refresh=%v)", userID, page, limit, refresh)
	docs, total, err := ctrl.Service.GetDocuments(c.Request.Context(), userID, apiKey, page, limit, refresh)
	if err != nil {
		log.Printf("Controller: GetDocuments error: %v", err)
		if strings.Contains(err.Error(), "invalid PandaDoc API key") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Your PandaDoc API key is invalid. Please update it in settings."})
			return
		}
		if strings.Contains(err.Error(), "403 Forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Your PandaDoc API key does not have permission to list documents. Please check your PandaDoc API settings."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Backend Error: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"documents": docs, "total": total, "page": page, "limit": limit})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "PandaDoc API key is required. Please add your API key in settings."})
		return
	}

	log.Printf("Controller: GetAnalytics for user %s", userID)
	analytics, err := ctrl.Service.GetAnalytics(c.Request.Context(), userID, apiKey)
	if err != nil {
		log.Printf("Controller: GetAnalytics error: %v", err)
		if strings.Contains(err.Error(), "invalid PandaDoc API key") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Your PandaDoc API key is invalid. Please update it in settings."})
			return
		}
		if strings.Contains(err.Error(), "403 Forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Your PandaDoc API key does not have permission to access analytics/documents. Please check your PandaDoc API settings."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Backend Error: " + err.Error()})
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
