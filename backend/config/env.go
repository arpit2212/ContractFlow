package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	SupabaseURL            string
	SupabaseServiceRoleKey string
	SupabaseJWTSecret      string
	PandaDocAPIKey         string
	PandaDocClientID       string
	PandaDocClientSecret   string
	PandaDocRedirectURI    string
	Port                   string
}

var Env *Config

func LoadEnv() {
	// Try loading from current directory, then one level up
	err := godotenv.Load()
	if err != nil {
		err = godotenv.Load("../.env")
		if err != nil {
			log.Println("Note: No .env file found, using system environment variables")
		} else {
			log.Println("Loaded .env from ../.env")
		}
	} else {
		log.Println("Loaded .env from current directory")
	}

	Env = &Config{
		SupabaseURL:            getEnv("SUPABASE_URL", ""),
		SupabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		SupabaseJWTSecret:      getEnv("SUPABASE_JWT_SECRET", ""),
		PandaDocAPIKey:         getEnv("PANDADOC_API_KEY", ""),
		PandaDocClientID:       getEnv("PANDADOC_CLIENT_ID", ""),
		PandaDocClientSecret:   getEnv("PANDADOC_CLIENT_SECRET", ""),
		PandaDocRedirectURI:    getEnv("PANDADOC_REDIRECT_URI", "http://localhost:8080/api/pandadoc/callback"),
		Port:                   getEnv("PORT", "8080"),
	}

	if Env.SupabaseJWTSecret != "" {
		log.Printf("Loaded SUPABASE_JWT_SECRET (length: %d)", len(Env.SupabaseJWTSecret))
	} else {
		log.Println("WARNING: SUPABASE_JWT_SECRET is empty!")
	}

	if Env.SupabaseURL == "" || Env.SupabaseServiceRoleKey == "" {
		log.Fatal("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
