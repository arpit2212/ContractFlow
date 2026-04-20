package services

import (
	"context"
	"fmt"
	"net/http"

	"github.com/user/ContractFlow/backend/models"
)

func CreateContract(ctx context.Context, contract *models.Contract) error {
	client := NewSupabaseClient()

	var result []models.Contract
	err := client.Request(ctx, http.MethodPost, "/contracts", contract, &result)
	if err != nil {
		return fmt.Errorf("failed to create contract via rest: %w", err)
	}

	if len(result) > 0 {
		*contract = result[0]
	}

	return nil
}

func GetContractsByUserID(ctx context.Context, userID string) ([]models.Contract, error) {
	client := NewSupabaseClient()

	var contracts []models.Contract
	path := fmt.Sprintf("/contracts?user_id=eq.%s&select=*", userID)

	err := client.Request(ctx, http.MethodGet, path, nil, &contracts)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch contracts via rest: %w", err)
	}

	return contracts, nil
}

func GetContractByID(ctx context.Context, contractID, userID string) (*models.Contract, error) {
	client := NewSupabaseClient()

	var result []models.Contract
	path := fmt.Sprintf("/contracts?id=eq.%s&user_id=eq.%s&select=*", contractID, userID)

	err := client.Request(ctx, http.MethodGet, path, nil, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to get contract via rest: %w", err)
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("contract not found")
	}

	return &result[0], nil
}
