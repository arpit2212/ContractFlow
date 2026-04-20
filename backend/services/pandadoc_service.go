package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/user/ContractFlow/backend/config"
	"github.com/user/ContractFlow/backend/models"
)

type PandaDocAnalytics struct {
	Total     int `json:"total"`
	Draft     int `json:"draft"`
	Sent      int `json:"sent"`
	Viewed    int `json:"viewed"`
	Completed int `json:"completed"`
	Declined  int `json:"declined"`
}

type PandaDocServiceInterface interface {
	GetDocuments(ctx context.Context, userID string) ([]interface{}, error)
	GetDocumentDetails(ctx context.Context, userID, id string) (interface{}, error)
	GetTemplates(ctx context.Context, userID string) ([]interface{}, error)
	GetTemplateDetails(ctx context.Context, userID, id string) (interface{}, error)
	CreateDocument(ctx context.Context, userID string, payload interface{}) (interface{}, error)
	SendDocument(ctx context.Context, userID, id string, payload interface{}) (interface{}, error)
	GetAnalytics(ctx context.Context, userID string) (*PandaDocAnalytics, error)
	ExchangeCode(ctx context.Context, userID, code string) (*models.PandaDocAuth, error)
	GetAuthURL() string
}

type pandaDocService struct {
	BaseURL    string
	cache      sync.Map
	tokenStore sync.Map // Temporary in-memory store: map[userID]*models.PandaDocAuth
}

type cacheItem struct {
	data      interface{}
	expiresAt time.Time
}

func NewPandaDocService() PandaDocServiceInterface {
	return &pandaDocService{
		BaseURL: "https://api.pandadoc.com/public/v1",
	}
}

func (s *pandaDocService) getFromCache(key string) (interface{}, bool) {
	val, ok := s.cache.Load(key)
	if !ok {
		return nil, false
	}
	item := val.(cacheItem)
	if time.Now().After(item.expiresAt) {
		s.cache.Delete(key)
		return nil, false
	}
	return item.data, true
}

func (s *pandaDocService) setToCache(key string, data interface{}) {
	s.cache.Store(key, cacheItem{
		data:      data,
		expiresAt: time.Now().Add(60 * time.Second),
	})
}

func (s *pandaDocService) GetAuthURL() string {
	baseURL := "https://app.pandadoc.com/oauth2/authorize"
	params := url.Values{}
	params.Add("client_id", config.Env.PandaDocClientID)
	params.Add("redirect_uri", config.Env.PandaDocRedirectURI)
	params.Add("scope", "read+write")
	params.Add("response_type", "code")
	return fmt.Sprintf("%s?%s", baseURL, params.Encode())
}

func (s *pandaDocService) ExchangeCode(ctx context.Context, userID, code string) (*models.PandaDocAuth, error) {
	tokenURL := "https://api.pandadoc.com/oauth2/access_token"
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", config.Env.PandaDocClientID)
	data.Set("client_secret", config.Env.PandaDocClientSecret)
	data.Set("code", code)
	data.Set("scope", "read+write")

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, bytes.NewBufferString(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("pandadoc oauth error (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	auth := &models.PandaDocAuth{
		UserID:       userID,
		AccessToken:  tokenResp.AccessToken,
		RefreshToken: tokenResp.RefreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second),
	}

	// Store token for this user
	s.tokenStore.Store(userID, auth)

	return auth, nil
}

func (s *pandaDocService) doRequest(ctx context.Context, userID, method, path string, body interface{}, result interface{}) error {
	fullURL := s.BaseURL + path
	log.Printf("PandaDoc Request: %s %s (User: %s)", method, fullURL, userID)

	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return err
		}
		bodyReader = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
	if err != nil {
		return err
	}

	// 1. Check if user has an OAuth token
	if authVal, ok := s.tokenStore.Load(userID); ok {
		auth := authVal.(*models.PandaDocAuth)
		log.Printf("Using OAuth Bearer token for user %s", userID)
		req.Header.Set("Authorization", "Bearer "+auth.AccessToken)
	} else if config.Env.PandaDocAPIKey != "" {
		// 2. Fallback to Sandbox API Key
		log.Printf("Using API-Key fallback for user %s", userID)
		req.Header.Set("Authorization", "API-Key "+config.Env.PandaDocAPIKey)
	} else {
		log.Printf("WARNING: No authentication found for user %s", userID)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("PandaDoc Request failed: %v", err)
		return err
	}
	defer resp.Body.Close()

	log.Printf("PandaDoc Response: %d %s", resp.StatusCode, resp.Status)

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("PandaDoc Error Body: %s", string(body))
		return fmt.Errorf("pandadoc api error (status %d): %s", resp.StatusCode, string(body))
	}

	return json.NewDecoder(resp.Body).Decode(result)
}

func (s *pandaDocService) GetDocuments(ctx context.Context, userID string) ([]interface{}, error) {
	cacheKey := fmt.Sprintf("docs_%s", userID)
	if data, ok := s.getFromCache(cacheKey); ok {
		return data.([]interface{}), nil
	}

	var response struct {
		Results []interface{} `json:"results"`
	}
	err := s.doRequest(ctx, userID, http.MethodGet, "/documents?count=50&page=1", nil, &response)
	if err != nil {
		return nil, err
	}

	s.setToCache(cacheKey, response.Results)
	return response.Results, nil
}

func (s *pandaDocService) GetDocumentDetails(ctx context.Context, userID, id string) (interface{}, error) {
	var result interface{}
	err := s.doRequest(ctx, userID, http.MethodGet, "/documents/"+id, nil, &result)
	return result, err
}

func (s *pandaDocService) GetTemplates(ctx context.Context, userID string) ([]interface{}, error) {
	cacheKey := fmt.Sprintf("templates_%s", userID)
	if data, ok := s.getFromCache(cacheKey); ok {
		return data.([]interface{}), nil
	}

	var response struct {
		Results []interface{} `json:"results"`
	}
	err := s.doRequest(ctx, userID, http.MethodGet, "/templates", nil, &response)
	if err != nil {
		return nil, err
	}

	s.setToCache(cacheKey, response.Results)
	return response.Results, nil
}

func (s *pandaDocService) GetTemplateDetails(ctx context.Context, userID, id string) (interface{}, error) {
	var result interface{}
	err := s.doRequest(ctx, userID, http.MethodGet, "/templates/"+id+"/details", nil, &result)
	return result, err
}

func (s *pandaDocService) CreateDocument(ctx context.Context, userID string, payload interface{}) (interface{}, error) {
	var result interface{}
	err := s.doRequest(ctx, userID, http.MethodPost, "/documents", payload, &result)
	return result, err
}

func (s *pandaDocService) SendDocument(ctx context.Context, userID, id string, payload interface{}) (interface{}, error) {
	var result interface{}
	err := s.doRequest(ctx, userID, http.MethodPost, "/documents/"+id+"/send", payload, &result)
	return result, err
}

func (s *pandaDocService) GetAnalytics(ctx context.Context, userID string) (*PandaDocAnalytics, error) {
	docs, err := s.GetDocuments(ctx, userID)
	if err != nil {
		return nil, err
	}

	analytics := &PandaDocAnalytics{
		Total: len(docs),
	}

	for _, d := range docs {
		docMap, ok := d.(map[string]interface{})
		if !ok {
			continue
		}
		status, _ := docMap["status"].(string)
		switch status {
		case "document.draft":
			analytics.Draft++
		case "document.sent":
			analytics.Sent++
		case "document.viewed":
			analytics.Viewed++
		case "document.completed":
			analytics.Completed++
		case "document.declined":
			analytics.Declined++
		}
	}

	return analytics, nil
}
