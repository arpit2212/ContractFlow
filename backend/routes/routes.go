package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/user/ContractFlow/backend/controllers"
	"github.com/user/ContractFlow/backend/middleware"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(gin.Logger())

	// Manual CORS middleware for absolute control
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "http://localhost:5173" || origin == "http://localhost:3000" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-PandaDoc-Api-Key, x-pandadoc-api-key")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	authController := controllers.NewAuthController()
	contractController := controllers.NewContractController()
	pandaDocController := controllers.NewPandaDocController()

	api := r.Group("/api")
	{
		api.GET("/pandadoc/status", pandaDocController.GetStatus)

		pandadoc := api.Group("/pandadoc")
		{
			pandadoc.POST("/documents/bulk-send", pandaDocController.BulkCreateAndSendDocuments)
			pandadoc.POST("/documents/create-and-send", pandaDocController.CreateAndSendDocument)

			pandadoc.GET("/documents", pandaDocController.GetDocuments)
			pandadoc.GET("/documents/:id", pandaDocController.GetDocumentDetails)
			pandadoc.GET("/templates", pandaDocController.GetTemplates)
			pandadoc.GET("/templates/:id/details", pandaDocController.GetTemplateDetails)

			pandadoc.POST("/documents", pandaDocController.CreateDocument)
			pandadoc.PATCH("/documents/:id", pandaDocController.UpdateDocument)
			pandadoc.POST("/documents/:id/send", pandaDocController.SendDocument)

			pandadoc.GET("/analytics", pandaDocController.GetAnalytics)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.POST("/auth/google", authController.GoogleAuth)

			contracts := protected.Group("/contracts")
			{
				contracts.GET("", contractController.GetContracts)
				contracts.POST("/create", contractController.CreateContract)
				contracts.POST("/send", contractController.SendContract)
				contracts.GET("/:id", contractController.GetContract)
			}
		}
	}

	return r
}
