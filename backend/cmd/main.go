package main

import (
	"log"

	"github.com/user/ContractFlow/backend/config"
	"github.com/user/ContractFlow/backend/routes"
)

func main() {
	// Initialize configurations
	config.LoadEnv()

	// Setup routes and start server
	r := routes.SetupRouter()

	log.Printf("Server starting on :%s...\n", config.Env.Port)
	if err := r.Run(":" + config.Env.Port); err != nil {
		log.Fatal(err)
	}
}
