package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/user/ContractFlow/backend/controllers"
	"github.com/user/ContractFlow/backend/middleware"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Logger middleware to see incoming requests
	r.Use(gin.Logger())

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	authController := controllers.NewAuthController()
	contractController := controllers.NewContractController()
	pandaDocController := controllers.NewPandaDocController()

	api := r.Group("/api")
	{
		// Public routes
		api.GET("/pandadoc/status", pandaDocController.GetStatus)

		// PandaDoc routes (made public for testing as requested)
		pandadoc := api.Group("/pandadoc")
		{
			// Specific POST routes first to avoid conflicts
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
			pandadoc.GET("/connect", pandaDocController.Connect)
			pandadoc.GET("/callback", pandaDocController.Callback)
		}

		// Protected routes
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
