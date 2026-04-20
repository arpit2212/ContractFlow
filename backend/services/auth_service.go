package services

import (
	"context"
	"fmt"
	"net/http"

	"github.com/user/ContractFlow/backend/models"
)

func SyncUser(ctx context.Context, user *models.User) error {
	client := NewSupabaseClient()

	// Upsert user into users table
	// Supabase REST API upsert: POST with Prefer: resolution=merge-duplicates or similar
	// But usually, we can just use POST with Prefer: on_conflict=id

	// Check if user exists first or just use upsert via POST
	// For Supabase REST, POST with on_conflict query param is standard for upsert
	upsertPath := "/users"

	// We use the client to perform a POST request with the user data
	// The client already sets Prefer: return=representation
	// To handle upsert, we add on_conflict
	reqPath := upsertPath + "?on_conflict=id"

	var result []models.User
	err := client.Request(ctx, http.MethodPost, reqPath, user, &result)
	if err != nil {
		return fmt.Errorf("failed to sync user via rest: %w", err)
	}

	return nil
}

func GetUserByID(ctx context.Context, id string) (*models.User, error) {
	client := NewSupabaseClient()

	var users []models.User
	path := fmt.Sprintf("/users?id=eq.%s&select=*", id)

	err := client.Request(ctx, http.MethodGet, path, nil, &users)
	if err != nil {
		return nil, fmt.Errorf("failed to get user via rest: %w", err)
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return &users[0], nil
}
